import { useState, type ClipboardEvent } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { usePrefs } from "@/lib/prefs";
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
  questions: number; questionIds: number[]; storageReady: boolean; videoUploadReady: boolean;
};

type SignedVideoUpload = { bucket: string; objectPath: string; token: string; uploadEndpoint: string };

const CAREER_COLUMNS = ["ID", "Career", "RIASEC", "Field IDs", "Demand", "Study", "Description", "Positions", "Skills", "Qualifications", "Outlook", "Subjects", "Majors", "Video length", "Video chapters", "Video URL"];
const QUESTION_COLUMNS = ["ID", "Area", "RIASEC", "English statement", "Myanmar statement"];
const blankRow = (columns: number) => Array.from({ length: columns }, () => "");
const splitList = (value: string) => value.split(";").map(s => s.trim()).filter(Boolean);
const slug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
const nonemptyRows = (rows: string[][]) => rows.filter(row => row.some(cell => cell.trim()));

function readVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This video file could not be read.")); };
    video.src = url;
  });
}

function metadataValue(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

async function uploadResumableVideo(file: File, signed: SignedVideoUpload, onProgress: (progress: number) => void) {
  const metadata = [
    ["bucketName", signed.bucket], ["objectName", signed.objectPath], ["contentType", file.type], ["cacheControl", "3600"],
  ].map(([key, value]) => `${key} ${metadataValue(value)}`).join(",");
  const tusHeaders = { "Tus-Resumable": "1.0.0", "x-signature": signed.token };
  const created = await fetch(signed.uploadEndpoint, { method: "POST", headers: {
    ...tusHeaders, "Upload-Length": String(file.size), "Upload-Metadata": metadata,
    "Content-Type": "application/offset+octet-stream",
  } });
  if (created.status !== 201) throw new Error(`Supabase could not start the upload (${created.status}).`);
  const location = created.headers.get("Location");
  if (!location) throw new Error("Supabase did not return an upload session.");
  const uploadUrl = new URL(location, signed.uploadEndpoint).toString();
  const chunkSize = 6 * 1024 * 1024;
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
    let response: Response | null = null;
    let lastError: unknown;
    let serverAdvanced = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        response = await fetch(uploadUrl, { method: "PATCH", headers: {
          ...tusHeaders, "Upload-Offset": String(offset), "Content-Type": "application/offset+octet-stream",
        }, body: chunk });
        if (response.ok) break;
        const head = await fetch(uploadUrl, { method: "HEAD", headers: tusHeaders });
        const serverOffset = Number(head.headers.get("Upload-Offset"));
        if (head.ok && Number.isFinite(serverOffset) && serverOffset > offset) {
          offset = serverOffset;
          onProgress(Math.min(100, Math.round(offset / file.size * 100)));
          serverAdvanced = true;
          break;
        }
        if (response.status < 500) throw new Error(`Supabase rejected a video chunk (${response.status}).`);
        lastError = new Error(`Supabase temporarily failed (${response.status}).`);
      } catch (error) {
        lastError = error;
        try {
          const head = await fetch(uploadUrl, { method: "HEAD", headers: tusHeaders });
          const serverOffset = Number(head.headers.get("Upload-Offset"));
          if (head.ok && Number.isFinite(serverOffset) && serverOffset > offset) {
            offset = serverOffset;
            onProgress(Math.min(100, Math.round(offset / file.size * 100)));
            serverAdvanced = true;
          }
        } catch { /* retry the same chunk after transient network errors */ }
        if (serverAdvanced) break;
      }
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
    }
    if (serverAdvanced) continue;
    if (!response?.ok) throw lastError instanceof Error ? lastError : new Error("The video upload failed.");
    offset = Number(response.headers.get("Upload-Offset") ?? offset + chunk.size);
    onProgress(Math.min(100, Math.round(offset / file.size * 100)));
  }
}

function careerFromRow(row: string[]): CareerImport {
  const majors = splitList(row[12] ?? "").map(item => {
    const divider = item.lastIndexOf("|");
    return { n: (divider < 0 ? "" : item.slice(0, divider)).trim(), f: Number(divider < 0 ? "" : item.slice(divider + 1).trim()) };
  });
  return {
    id: slug(row[0] ?? ""), t: (row[1] ?? "").trim(), codes: (row[2] ?? "").trim().toUpperCase(),
    f: splitList(row[3] ?? "").map(Number), demand: (row[4] ?? "").trim(), study: (row[5] ?? "").trim(), blurb: (row[6] ?? "").trim(),
    positions: splitList(row[7] ?? ""), skills: splitList(row[8] ?? ""), quals: splitList(row[9] ?? ""), outlook: (row[10] ?? "").trim(),
    subjects: splitList(row[11] ?? ""), majors,
    video: { len: (row[13] ?? "").trim(), ch: splitList(row[14] ?? ""), url: (row[15] ?? "").trim() },
  };
}

function questionFromRow(row: string[]): QuestionImport {
  return { id: Number((row[0] ?? "").trim()), area: (row[1] ?? "").trim(), code: (row[2] ?? "").trim().toUpperCase() as AcceptCode, en: (row[3] ?? "").trim(), my: (row[4] ?? "").trim() };
}

export default function Content() {
  const { t } = usePrefs();
  const { data, loading, error, refresh } = useApiData(() => api.get<D>("/admin/content"));
  const [careerRows, setCareerRows] = useState<string[][]>(() => [blankRow(CAREER_COLUMNS.length)]);
  const [questionRows, setQuestionRows] = useState<string[][]>(() => [blankRow(QUESTION_COLUMNS.length)]);
  const [careerErrors, setCareerErrors] = useState<string[]>([]);
  const [questionErrors, setQuestionErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState<"career" | "question" | null>(null);
  const [videoUploads, setVideoUploads] = useState<Record<string, number>>({});

  async function uploadCareerVideo(careerId: string, file: File) {
    if (!data?.videoUploadReady) return;
    if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) { toast(t("Choose an MP4, WebM, or MOV video.")); return; }
    if (file.size > 50 * 1024 * 1024) { toast(t("Video files must be 50 MB or smaller.")); return; }
    setVideoUploads(current => ({ ...current, [careerId]: 0 }));
    try {
      const durationSeconds = await readVideoDuration(file);
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 180) throw new Error(t("Video must be 3 minutes or shorter."));
      const signed = await api.post<SignedVideoUpload>("/admin/content/videos/sign", { careerId, fileName: file.name, contentType: file.type, size: file.size });
      await uploadResumableVideo(file, signed, progress => setVideoUploads(current => ({ ...current, [careerId]: progress })));
      await api.post("/admin/content/videos/complete", { careerId, objectPath: signed.objectPath, durationSeconds });
      toast(t("Career video uploaded."));
      await refresh();
    } catch (error) {
      toast((error as Error).message || t("Video upload failed."));
    } finally {
      setVideoUploads(current => { const next = { ...current }; delete next[careerId]; return next; });
    }
  }

  function setCell(kind: "career" | "question", rowIndex: number, columnIndex: number, value: string) {
    const setRows = kind === "career" ? setCareerRows : setQuestionRows;
    setRows(previous => previous.map((row, i) => i === rowIndex ? row.map((cell, j) => j === columnIndex ? value : cell) : row));
  }

  function pasteCells(kind: "career" | "question", event: ClipboardEvent<HTMLDivElement>) {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !/[\r\n]/.test(text)) return;
    const target = (event.target as HTMLElement).closest<HTMLInputElement>("input[data-row][data-col]");
    if (!target) return;
    event.preventDefault();
    const startRow = Number(target.dataset.row), startCol = Number(target.dataset.col);
    const pasted = text.replace(/\r/g, "").replace(/\n$/, "").split("\n").map(line => line.split("\t"));
    const width = kind === "career" ? CAREER_COLUMNS.length : QUESTION_COLUMNS.length;
    const limit = kind === "career" ? 50 : 100;
    const setRows = kind === "career" ? setCareerRows : setQuestionRows;
    const setErrors = kind === "career" ? setCareerErrors : setQuestionErrors;
    setRows(previous => {
      const next = previous.map(row => [...row]);
      pasted.forEach((cells, rowOffset) => {
        const rowIndex = startRow + rowOffset;
        if (rowIndex >= limit) return;
        while (next.length <= rowIndex) next.push(blankRow(width));
        cells.slice(0, width - startCol).forEach((cell, colOffset) => { next[rowIndex][startCol + colOffset] = cell; });
      });
      return next;
    });
    setErrors(startRow + pasted.length > limit ? [`Only the first ${limit} rows can be saved at once; extra pasted rows were ignored.`] : []);
  }

  function addRow(kind: "career" | "question") {
    const setRows = kind === "career" ? setCareerRows : setQuestionRows;
    const setErrors = kind === "career" ? setCareerErrors : setQuestionErrors;
    const width = kind === "career" ? CAREER_COLUMNS.length : QUESTION_COLUMNS.length;
    setRows(previous => [...previous, blankRow(width)]);
    setErrors([]);
  }

  function deleteRow(kind: "career" | "question", index: number) {
    const setRows = kind === "career" ? setCareerRows : setQuestionRows;
    const setErrors = kind === "career" ? setCareerErrors : setQuestionErrors;
    const width = kind === "career" ? CAREER_COLUMNS.length : QUESTION_COLUMNS.length;
    setRows(previous => previous.length === 1 ? [blankRow(width)] : previous.filter((_, i) => i !== index));
    setErrors([]);
  }

  function validateCareers(rows: string[][]): { values: CareerImport[]; errors: string[] } {
    const values = nonemptyRows(rows).map(careerFromRow);
    const existing = new Set(data?.careers.map(c => c.id.toLowerCase()) ?? []), seen = new Set<string>(), errors: string[] = [];
    values.forEach((career, i) => {
      const row = i + 1;
      if (!/^[a-z0-9-]{2,40}$/.test(career.id)) errors.push(`Row ${row}: enter an ID using letters, numbers, or hyphens.`);
      if (career.t.length < 2 || !/^[RIASEC]{1,3}$/.test(career.codes) || !career.blurb || !career.f.length || !career.majors.length) errors.push(`Row ${row}: career, RIASEC, field IDs, description, and majors are required.`);
      if (career.f.some(id => !Number.isInteger(id) || id < 1 || id > 11)) errors.push(`Row ${row}: field IDs must be numbers from 1 to 11.`);
      if (career.majors.some(major => !major.n || !Number.isInteger(major.f) || major.f < 1 || major.f > 11)) errors.push(`Row ${row}: majors must use Major name|field ID, separated by semicolons.`);
      if (career.video.url && !/^https?:\/\//i.test(career.video.url)) errors.push(`Row ${row}: video URL must start with http:// or https://.`);
      if (seen.has(career.id) || existing.has(career.id)) errors.push(`Row ${row}: career ID “${career.id}” already exists.`);
      seen.add(career.id);
    });
    if (!values.length) errors.push("Enter at least one career row.");
    if (values.length > 50) errors.push("Save no more than 50 careers at a time.");
    return { values, errors };
  }

  function validateQuestions(rows: string[][]): { values: QuestionImport[]; errors: string[] } {
    const values = nonemptyRows(rows).map(questionFromRow);
    const existing = new Set(data?.questionIds ?? []), seen = new Set<number>(), errors: string[] = [];
    values.forEach((question, i) => {
      const row = i + 1;
      if (!Number.isInteger(question.id) || question.id < 21 || question.id > 500) errors.push(`Row ${row}: use a question ID from 21 to 500.`);
      if (!question.area || !["R", "I", "A", "S", "E", "C"].includes(question.code) || question.en.length < 4 || question.my.length < 2) errors.push(`Row ${row}: area, RIASEC, and English and Myanmar statements are required.`);
      if (seen.has(question.id) || existing.has(question.id)) errors.push(`Row ${row}: question ID “${question.id}” already exists.`);
      seen.add(question.id);
    });
    if (!values.length) errors.push("Enter at least one quiz question row.");
    if (values.length > 100) errors.push("Save no more than 100 quiz questions at a time.");
    return { values, errors };
  }

  async function saveRows(kind: "career" | "question") {
    const checked = kind === "career" ? validateCareers(careerRows) : validateQuestions(questionRows);
    const setErrors = kind === "career" ? setCareerErrors : setQuestionErrors;
    setErrors(checked.errors);
    if (checked.errors.length || !data?.storageReady) return;
    setSaving(kind);
    try {
      const result = await api.post<{ careers: number; questions: number }>("/admin/content/import", {
        careers: kind === "career" ? checked.values : [], questions: kind === "question" ? checked.values : [],
      });
      toast(kind === "career" ? `${result.careers} ${t("careers imported")}` : `${result.questions} ${t("quiz questions imported")}`);
      if (kind === "career") setCareerRows([blankRow(CAREER_COLUMNS.length)]); else setQuestionRows([blankRow(QUESTION_COLUMNS.length)]);
      setErrors([]);
      await refresh();
    } catch (err) { setErrors([(err as Error).message]); }
    finally { setSaving(null); }
  }

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No content data"} onRetry={refresh} />;

  const sheet = (kind: "career" | "question", rows: string[][], columns: string[]) => {
    const errors = kind === "career" ? careerErrors : questionErrors;
    const setErrors = kind === "career" ? setCareerErrors : setQuestionErrors;
    return <div className="table-wrap" onPaste={event => pasteCells(kind, event)}>
      <table className="spreadsheet-table">
        <thead><tr><th className="spreadsheet-row-number">#</th>{columns.map((column, index) => <th key={`${column}-${index}`}>{t(column)}</th>)}<th>{t("Remove")}</th></tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>
          <th scope="row" className="spreadsheet-row-number">{rowIndex + 1}</th>
          {columns.map((column, columnIndex) => <td key={`${rowIndex}-${columnIndex}`}><input
            data-row={rowIndex} data-col={columnIndex} value={row[columnIndex] ?? ""} spellCheck={columnIndex !== 0 && columnIndex !== 3}
            aria-label={`${t(column)}, ${t("row")} ${rowIndex + 1}`} autoComplete="off"
            style={{ width: kind === "career" ? ([96, 180, 100, 110, 120, 120, 250, 210, 210, 210, 250, 180, 250, 110, 220, 240][columnIndex]) : ([90, 140, 100, 280, 280][columnIndex]) }}
            className="spreadsheet-cell" onChange={event => { setCell(kind, rowIndex, columnIndex, event.target.value); setErrors([]); }}
          /></td>)}
          <td><button type="button" className="btn-ghost btn-sm" onClick={() => deleteRow(kind, rowIndex)} aria-label={`${t("Delete row")} ${rowIndex + 1}`}>×</button></td>
        </tr>)}</tbody>
      </table>
    </div>;
  };

  return <>
    <PageHead eyebrow="Admin portal" title="Content" />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{[["Careers", data.careers.length], ["Quiz questions", data.questions], ["Short movies uploaded", data.careers.filter(c => c.hasVideo).length]].map(([label, value]) => <div key={label} className="tile"><b>{value}</b><span>{t(String(label))}</span></div>)}</div>
    <Note>{t("Add content in the cells below. You can type directly or copy cells from Excel and paste them into the grid. Save each sheet to add those rows to CareerNest.")}</Note>
    {!data.storageReady && <Note>{t("Run the admin content database migration before saving. Existing student and admin pages remain available until then.")}</Note>}
    {!data.videoUploadReady && <Note>{t("To upload career videos, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the backend, then run database/migrations/20261022_admin_career_videos.sql.")}</Note>}

    <section className="card flex flex-col gap-3">
      <div><h2 className="text-lg">{t("Careers")}</h2><p className="text-sm text-muted">{t("Lists inside a cell use semicolons. Enter majors as Major name|field ID; Major name|field ID.")}</p></div>
      {sheet("career", careerRows, CAREER_COLUMNS)}
      {careerErrors.length > 0 && <ErrorList title={t("Fix these rows before saving")} errors={careerErrors} />}
      <div className="flex flex-wrap gap-2"><button type="button" className="btn-outline btn-sm" onClick={() => addRow("career")}>{t("Add row")}</button><button type="button" className="btn-primary btn-sm" disabled={saving !== null || !data.storageReady} onClick={() => saveRows("career")}>{saving === "career" ? t("Saving…") : t("Save careers")}</button><span className="self-center text-xs text-muted">{t("Paste multiple rows and columns from Excel with Ctrl+V.")}</span></div>
    </section>

    <section className="card flex flex-col gap-3">
      <div><h2 className="text-lg">{t("Quiz questions")}</h2><p className="text-sm text-muted">{t("Use new IDs from 21 to 500. Each RIASEC code is R, I, A, S, E, or C.")}</p></div>
      {sheet("question", questionRows, QUESTION_COLUMNS)}
      {questionErrors.length > 0 && <ErrorList title={t("Fix these rows before saving")} errors={questionErrors} />}
      <div className="flex flex-wrap gap-2"><button type="button" className="btn-outline btn-sm" onClick={() => addRow("question")}>{t("Add row")}</button><button type="button" className="btn-primary btn-sm" disabled={saving !== null || !data.storageReady} onClick={() => saveRows("question")}>{saving === "question" ? t("Saving…") : t("Save questions")}</button><span className="self-center text-xs text-muted">{t("Paste multiple rows and columns from Excel with Ctrl+V.")}</span></div>
    </section>

    <div className="table-wrap"><table><thead><tr><th>{t("Career")}</th><th>{t("Majors")}</th><th>{t("Short movie")}</th><th>{t("Video file")}</th></tr></thead><tbody>{data.careers.map(c => <tr key={c.id}><td><b>{c.title}</b></td><td className="text-xs">{c.majors.join(", ")}</td><td>{c.hasVideo ? <Pill tone="ok">{t("Uploaded")}</Pill> : <Pill tone="warn">{t("Video needed")}</Pill>} <span className="font-mono text-xs">{c.videoLength}</span></td><td><label className={`btn-outline btn-sm inline-flex cursor-pointer items-center ${!data.videoUploadReady || videoUploads[c.id] !== undefined ? "pointer-events-none opacity-60" : ""}`}>
      <input className="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime" disabled={!data.videoUploadReady || videoUploads[c.id] !== undefined} onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void uploadCareerVideo(c.id, file); event.currentTarget.value = ""; }} />
      {videoUploads[c.id] !== undefined ? `${t("Uploading")} ${videoUploads[c.id]}%` : t(c.hasVideo ? "Replace video" : "Upload video")}
    </label></td></tr>)}</tbody></table></div>
  </>;
}

function ErrorList({ title, errors }: { title: string; errors: string[] }) {
  return <div className="rounded-xl border border-bad/30 bg-bad-soft p-3 text-sm text-bad" role="alert"><b>{title}</b><ul className="mt-1 list-disc pl-5">{errors.slice(0, 8).map((message, index) => <li key={index}>{message}</li>)}</ul></div>;
}
