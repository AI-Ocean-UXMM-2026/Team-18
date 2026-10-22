import { useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { usePrefs } from "@/lib/prefs";
import { parseCsv } from "@/lib/csv";
import { ErrorNote, Note, PageHead, Pill, Spinner, toast } from "@/components/ui";

type AcceptCode = "R" | "I" | "A" | "S" | "E" | "C";
type CareerImport = {
  id: string; t: string; codes: string; f: number[]; demand: string; study: string; blurb: string;
  positions: string[]; skills: string[]; quals: string[]; outlook: string; subjects: string[];
  majors: { n: string; f: number }[]; video: { len: string; ch: string[]; url: string };
};
type QuestionImport = { id: number; area: string; code: AcceptCode; en: string; my: string };
type D = {
  careers: { id: string; title: string; majors: string[]; videoLength: string; hasVideo: boolean }[];
  questions: number; questionIds: number[]; storageReady: boolean;
};
const splitList = (value: string) => value.split(";").map(s => s.trim()).filter(Boolean);
const slug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");

function readCareers(text: string): CareerImport[] {
  const [headerRow, ...rows] = parseCsv(text);
  if (!headerRow) throw new Error("The career CSV is empty.");
  const headers = headerRow.map(value => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  const get = (row: string[], ...keys: string[]) => { const index = keys.map(key => headers.indexOf(key)).find(i => i >= 0); return index == null ? "" : (row[index] ?? "").trim(); };
  if (!["id", "career_id"].some(key => headers.includes(key)) || !["title", "career", "t"].some(key => headers.includes(key))) throw new Error("Use the career template headers. Career ID and title are required.");
  return rows.map(row => {
    const majors = splitList(get(row, "majors")).map(item => {
      const divider = item.lastIndexOf("|");
      return { n: (divider < 0 ? "" : item.slice(0, divider)).trim(), f: Number(divider < 0 ? "" : item.slice(divider + 1).trim()) };
    });
    const url = get(row, "video_url", "url");
    return {
      id: slug(get(row, "id", "career_id")), t: get(row, "title", "career", "t"), codes: get(row, "codes").toUpperCase(),
      f: splitList(get(row, "f", "field_ids")).map(Number), demand: get(row, "demand"), study: get(row, "study"), blurb: get(row, "blurb", "description"),
      positions: splitList(get(row, "positions", "jobs")), skills: splitList(get(row, "skills")), quals: splitList(get(row, "quals", "qualifications")),
      outlook: get(row, "outlook"), subjects: splitList(get(row, "subjects")), majors,
      video: { len: get(row, "video_length", "video_len"), ch: splitList(get(row, "video_chapters", "video_ch")), url },
    };
  });
}

function readQuestions(text: string): QuestionImport[] {
  const [headerRow, ...rows] = parseCsv(text);
  if (!headerRow) throw new Error("The question CSV is empty.");
  const headers = headerRow.map(value => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  const get = (row: string[], ...keys: string[]) => { const index = keys.map(key => headers.indexOf(key)).find(i => i >= 0); return index == null ? "" : (row[index] ?? "").trim(); };
  if (!["id", "question_id"].some(key => headers.includes(key)) || !["en", "english"].some(key => headers.includes(key)) || !["my", "myanmar"].some(key => headers.includes(key))) throw new Error("Use the question template headers. ID, English, and Myanmar text are required.");
  return rows.map(row => ({ id: Number(get(row, "id", "question_id")), area: get(row, "area"), code: get(row, "code").toUpperCase() as AcceptCode, en: get(row, "en", "english"), my: get(row, "my", "myanmar") }));
}

export default function Content() {
  const { t } = usePrefs();
  const { data, loading, error, refresh } = useApiData(() => api.get<D>("/admin/content"));
  const [careers, setCareers] = useState<CareerImport[]>([]);
  const [questions, setQuestions] = useState<QuestionImport[]>([]);
  const [careerFile, setCareerFile] = useState("");
  const [questionFile, setQuestionFile] = useState("");
  const [careerErrors, setCareerErrors] = useState<string[]>([]);
  const [questionErrors, setQuestionErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState<"career" | "question" | null>(null);

  async function chooseCareerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    setCareerFile(file.name); setCareers([]); setCareerErrors([]);
    try {
      if (file.size > 1024 * 1024) throw new Error("Choose a CSV file smaller than 1 MB.");
      const rows = readCareers(await file.text());
      if (!rows.length || rows.length > 50) throw new Error("Import between 1 and 50 careers at a time.");
      const existing = new Set(data?.careers.map(c => c.id.toLowerCase()) ?? []), seen = new Set<string>(), issues: string[] = [];
      rows.forEach((c, i) => {
        const line = i + 2;
        if (!/^[a-z0-9-]{2,40}$/.test(c.id)) issues.push(`Row ${line}: add a career ID using letters, numbers, or hyphens.`);
        if (c.t.length < 2 || !/^[RIASEC]{1,3}$/.test(c.codes) || !c.blurb || !c.f.length || !c.majors.length) issues.push(`Row ${line}: title, RIASEC codes, field IDs, description, and majors are required.`);
        if (c.majors.some(m => !m.n || !Number.isInteger(m.f) || m.f < 1 || m.f > 11)) issues.push(`Row ${line}: majors must use the format Major name|field ID, separated by semicolons.`);
        if (c.video.url && !/^https?:\/\//i.test(c.video.url)) issues.push(`Row ${line}: video URL must start with http:// or https://.`);
        if (seen.has(c.id) || existing.has(c.id)) issues.push(`Row ${line}: career ID “${c.id}” already exists.`);
        seen.add(c.id);
      });
      setCareers(issues.length ? [] : rows); setCareerErrors(issues);
    } catch (err) { setCareerErrors([(err as Error).message]); }
  }

  async function chooseQuestionFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    setQuestionFile(file.name); setQuestions([]); setQuestionErrors([]);
    try {
      if (file.size > 1024 * 1024) throw new Error("Choose a CSV file smaller than 1 MB.");
      const rows = readQuestions(await file.text());
      if (!rows.length || rows.length > 100) throw new Error("Import between 1 and 100 quiz questions at a time.");
      const existing = new Set(data?.questionIds ?? []), seen = new Set<number>(), issues: string[] = [];
      rows.forEach((q, i) => {
        const line = i + 2;
        if (!Number.isInteger(q.id) || q.id < 21 || q.id > 500) issues.push(`Row ${line}: use a new question ID from 21 to 500.`);
        if (!q.area || !["R", "I", "A", "S", "E", "C"].includes(q.code) || q.en.length < 4 || q.my.length < 2) issues.push(`Row ${line}: area, RIASEC code, and English and Myanmar text are required.`);
        if (seen.has(q.id) || existing.has(q.id)) issues.push(`Row ${line}: question ID “${q.id}” already exists.`);
        seen.add(q.id);
      });
      setQuestions(issues.length ? [] : rows); setQuestionErrors(issues);
    } catch (err) { setQuestionErrors([(err as Error).message]); }
  }

  async function importRows(kind: "career" | "question") {
    setSaving(kind);
    try {
      const result = await api.post<{ careers: number; questions: number }>("/admin/content/import", {
        careers: kind === "career" ? careers : [], questions: kind === "question" ? questions : [],
      });
      toast(kind === "career" ? `${result.careers} ${t("careers imported")}` : `${result.questions} ${t("quiz questions imported")}`);
      if (kind === "career") { setCareers([]); setCareerFile(""); } else { setQuestions([]); setQuestionFile(""); }
      await refresh();
    } catch (err) { (kind === "career" ? setCareerErrors : setQuestionErrors)([(err as Error).message]); }
    finally { setSaving(null); }
  }

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No content data"} onRetry={refresh} />;
  return (
    <>
      <PageHead eyebrow="Admin portal" title="Content" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{[["Careers", data.careers.length], ["Quiz questions", data.questions], ["Short movies uploaded", data.careers.filter(c => c.hasVideo).length]].map(([l, v]) => <div key={l} className="tile"><b>{v}</b><span>{t(String(l))}</span></div>)}</div>
      <Note>{t("Import new careers and quiz questions from Excel. Imported content is saved in CareerNet and used by the student quiz and career matches.")}</Note>
      {!data.storageReady && <Note>{t("Run the admin content database migration before importing. Existing student and admin pages remain available until then.")}</Note>}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card flex flex-col gap-3">
          <div><h2 className="text-lg">{t("Import careers from Excel")}</h2><p className="text-sm text-muted">{t("Fill the career template, save as CSV UTF-8, then upload and preview it.")}</p><p className="mt-1 text-xs text-muted">{t("Use semicolons for lists. Write each major as Major name|field ID.")}</p></div>
          <div className="flex flex-wrap items-center gap-3"><a className="btn-outline btn-sm" href="/careers-template.csv" download>{t("Download template")}</a><label className="btn-outline btn-sm cursor-pointer">{t("Choose CSV file")}<input className="sr-only" type="file" accept=".csv,text/csv" onChange={chooseCareerFile} /></label>{careerFile && <span className="text-sm text-muted">{careerFile}</span>}</div>
          {careerErrors.length > 0 && <div className="rounded-xl border border-bad/30 bg-bad/5 p-3 text-sm text-bad" role="alert"><b>{t("Fix these rows before importing")}</b><ul className="mt-1 list-disc pl-5">{careerErrors.slice(0, 8).map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
          {careers.length > 0 && <><p className="text-sm font-semibold">{careers.length} {t("careers ready to import")}</p><div className="table-wrap"><table><thead><tr><th>{t("Career")}</th><th>{t("Majors")}</th><th>{t("Short movie")}</th></tr></thead><tbody>{careers.slice(0, 5).map(c => <tr key={c.id}><td>{c.t}</td><td>{c.majors.map(m => m.n).join(", ")}</td><td>{c.video.url ? <Pill tone="ok">{t("Video link added")}</Pill> : <Pill tone="warn">{t("Video link needed")}</Pill>}</td></tr>)}</tbody></table></div><button type="button" className="btn-primary self-start" disabled={saving !== null || !data.storageReady} onClick={() => importRows("career")}>{saving === "career" ? t("Importing…") : t("Import careers")}</button></>}
        </section>

        <section className="card flex flex-col gap-3">
          <div><h2 className="text-lg">{t("Import quiz questions from Excel")}</h2><p className="text-sm text-muted">{t("Add new RIASEC questions in English and Myanmar. Use IDs 21 to 500.")}</p></div>
          <div className="flex flex-wrap items-center gap-3"><a className="btn-outline btn-sm" href="/questions-template.csv" download>{t("Download template")}</a><label className="btn-outline btn-sm cursor-pointer">{t("Choose CSV file")}<input className="sr-only" type="file" accept=".csv,text/csv" onChange={chooseQuestionFile} /></label>{questionFile && <span className="text-sm text-muted">{questionFile}</span>}</div>
          {questionErrors.length > 0 && <div className="rounded-xl border border-bad/30 bg-bad/5 p-3 text-sm text-bad" role="alert"><b>{t("Fix these rows before importing")}</b><ul className="mt-1 list-disc pl-5">{questionErrors.slice(0, 8).map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
          {questions.length > 0 && <><p className="text-sm font-semibold">{questions.length} {t("quiz questions ready to import")}</p><div className="table-wrap"><table><thead><tr><th>ID</th><th>{t("Area")}</th><th>{t("Statement")}</th></tr></thead><tbody>{questions.slice(0, 5).map(q => <tr key={q.id}><td>{q.id}</td><td>{q.area}</td><td>{q.en}</td></tr>)}</tbody></table></div><button type="button" className="btn-primary self-start" disabled={saving !== null || !data.storageReady} onClick={() => importRows("question")}>{saving === "question" ? t("Importing…") : t("Import questions")}</button></>}
        </section>
      </div>

      <div className="table-wrap"><table>
        <thead><tr><th>{t("Career")}</th><th>{t("Majors")}</th><th>{t("Short movie")}</th></tr></thead>
        <tbody>{data.careers.map(c => <tr key={c.id}><td><b>{c.title}</b></td><td className="text-xs">{c.majors.join(", ")}</td><td>{c.hasVideo ? <Pill tone="ok">{t("Uploaded")}</Pill> : <Pill tone="warn">{t("Video link needed")}</Pill>} <span className="font-mono text-xs">{c.videoLength}</span></td></tr>)}</tbody>
      </table></div>
    </>
  );
}
