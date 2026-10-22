import { useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, Note, PageHead, Pill, Spinner, toast } from "@/components/ui";

type Accepts = "yes" | "no" | "confirm";
type Row = { id: string; code: string; name: string; country: string; hasScholarship: boolean; ged: Accepts; igcse: Accepts; lastChecked: string; source: string; needsCheck: boolean };
type D = { source: string; sheetConnected: boolean; adminAdded: number; g12: { universities: number; programs: number }; schools: Row[] };
type Form = {
  code: string; name: string; country: string; city: string; type: string; mode: string; established: string;
  ged: Accepts; gedNote: string; gedTests: string; igcse: Accepts; igcseNote: string;
  hasScholarship: boolean; scholarship: string; website: string; source: string; description: string; partner: string;
  programs: string; english: string; admission: string; pathway: string; duration: string; intakes: string;
};
type ImportUniversity = Omit<Form, "ged" | "gedNote" | "gedTests" | "igcse" | "igcseNote" | "hasScholarship" | "scholarship" | "programs" | "code" | "name" | "country"> & {
  code: string; name: string; country: string; fields: number[]; programs: string[];
  ged: { ok: Accepts; note: string; tests: string }; igcse: { ok: Accepts; note: string };
  hasScholarship: boolean; scholarship: string;
};
const blank: Form = {
  code: "", name: "", country: "", city: "", type: "University", mode: "On campus", established: "",
  ged: "confirm", gedNote: "", gedTests: "", igcse: "confirm", igcseNote: "",
  hasScholarship: false, scholarship: "", website: "", source: "", description: "", partner: "",
  programs: "", english: "", admission: "", pathway: "", duration: "", intakes: "",
};
const ok = (v: Accepts) => <Pill tone={v === "yes" ? "ok" : v === "no" ? "bad" : "warn"}>{v === "yes" ? "Accepted" : v === "no" ? "Not direct" : "Confirm"}</Pill>;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  const csv = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (quoted && csv[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && ch === ",") { row.push(cell); cell = ""; }
    else if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && csv[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(values => values.some(value => value.trim()));
}

function parseAccepts(value: string): Accepts {
  const normalized = value.trim().toLowerCase();
  if (["yes", "accepted", "accept", "direct", "true", "1"].includes(normalized)) return "yes";
  if (["no", "not direct", "not accepted", "false", "0"].includes(normalized)) return "no";
  return "confirm";
}

function importFromCsv(text: string): ImportUniversity[] {
  const [headerRow, ...dataRows] = parseCsv(text);
  if (!headerRow) throw new Error("The CSV file is empty.");
  const headers = headerRow.map(value => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  const get = (row: string[], ...names: string[]) => {
    const index = names.map(name => headers.indexOf(name)).find(i => i >= 0);
    return index == null ? "" : (row[index] ?? "").trim();
  };
  if (!headers.includes("country") || !headers.some(h => ["name", "university", "university_name"].includes(h)) || !headers.some(h => ["code", "id"].includes(h))) {
    throw new Error("Use the template headers. Required columns are code, name, and country.");
  }
  return dataRows.map(row => {
    const hasScholarship = ["yes", "y", "true", "1"].includes(get(row, "has_scholarship", "scholarship_available").toLowerCase());
    const list = (value: string) => value.split(";").map(item => item.trim()).filter(Boolean);
    return {
      code: get(row, "code", "id"), name: get(row, "name", "university_name", "university"), country: get(row, "country"),
      city: get(row, "city"), type: get(row, "type") || "University", mode: get(row, "mode") || "On campus", established: get(row, "established"),
      fields: get(row, "fields").split(/[;,]/).map(value => Number(value.trim())).filter(value => Number.isInteger(value) && value > 0),
      description: get(row, "description"), partner: get(row, "partner"), programs: list(get(row, "programs")),
      ged: { ok: parseAccepts(get(row, "ged_ok", "ged_acceptance")), note: get(row, "ged_note"), tests: get(row, "ged_tests") },
      igcse: { ok: parseAccepts(get(row, "igcse_ok", "igcse_acceptance")), note: get(row, "igcse_note") },
      english: get(row, "english"), admission: get(row, "admission"), pathway: get(row, "pathway"), duration: get(row, "duration"), intakes: get(row, "intakes"),
      hasScholarship, scholarship: get(row, "scholarship"), website: get(row, "website"), source: get(row, "source"), photo: get(row, "photo"),
    };
  });
}

export default function Universities() {
  const { t } = usePrefs();
  const { data, loading, error, refresh } = useApiData(() => api.get<D>("/admin/universities"));
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<ImportUniversity[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importFile, setImportFile] = useState("");
  const [importing, setImporting] = useState(false);
  const set = (key: keyof Form, value: string | boolean) => setForm(previous => ({ ...previous, [key]: value }));

  async function add(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      await api.post("/admin/universities", {
        code: form.code.trim(), name: form.name.trim(), country: form.country.trim(), city: form.city.trim(),
        type: form.type.trim(), mode: form.mode.trim(), established: form.established.trim(), fields: [],
        ged: { ok: form.ged, note: form.gedNote.trim(), tests: form.gedTests.trim() },
        igcse: { ok: form.igcse, note: form.igcseNote.trim() }, hasScholarship: form.hasScholarship,
        scholarship: form.scholarship.trim(), website: form.website.trim(), source: form.source.trim(),
        description: form.description.trim(), partner: form.partner.trim(),
        programs: form.programs.split(/[;\n]/).map(value => value.trim()).filter(Boolean),
        english: form.english.trim(), admission: form.admission.trim(), pathway: form.pathway.trim(),
        duration: form.duration.trim(), intakes: form.intakes.trim(),
      });
      setForm(blank); toast(t("University added")); await refresh();
    } catch (err) { setFormError((err as Error).message); }
    finally { setSaving(false); }
  }

  async function readImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportFile(file.name); setImportRows([]); setImportErrors([]);
    try {
      if (file.size > 1024 * 1024) throw new Error("Choose a CSV file smaller than 1 MB.");
      const rows = importFromCsv(await file.text());
      if (!rows.length) throw new Error("The CSV has no university rows.");
      if (rows.length > 100) throw new Error("Import up to 100 universities at a time.");
      const existingCodes = new Set(data?.schools.flatMap(s => [s.id.toLowerCase(), s.code.toLowerCase()]) ?? []);
      const seen = new Set<string>();
      const issues: string[] = [];
      rows.forEach((school, index) => {
        const line = index + 2;
        if (!/^[A-Za-z0-9-]{2,20}$/.test(school.code)) issues.push(`Row ${line}: code must use 2–20 letters, numbers, or hyphens.`);
        if (school.name.length < 2 || !school.country) issues.push(`Row ${line}: university name and country are required.`);
        const code = school.code.toLowerCase();
        if (code && (seen.has(code) || existingCodes.has(code))) issues.push(`Row ${line}: code “${school.code}” is already in this file or CareerNet.`);
        seen.add(code);
      });
      setImportRows(issues.length ? [] : rows); setImportErrors(issues);
    } catch (error) { setImportErrors([(error as Error).message]); }
  }

  async function importUniversities() {
    setImporting(true); setImportErrors([]);
    try {
      const result = await api.post<{ imported: number }>("/admin/universities/import", { universities: importRows });
      toast(`${result.imported} ${t("universities imported")}`); setImportRows([]); setImportFile("");
      await refresh();
    } catch (error) { setImportErrors([(error as Error).message]); }
    finally { setImporting(false); }
  }

  function clearImport() { setImportRows([]); setImportErrors([]); setImportFile(""); }

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No university data"} onRetry={refresh} />;
  const input = (key: keyof Form) => ({ value: form[key] as string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value) });
  const textarea = (key: keyof Form, rows = 2) => <textarea className="input min-h-20" rows={rows} value={form[key] as string} onChange={e => set(key, e.target.value)} />;
  const acceptance = (key: "ged" | "igcse") => <select className="input" value={form[key]} onChange={e => set(key, e.target.value as Accepts)}><option value="yes">Accepted</option><option value="confirm">Confirm</option><option value="no">Not direct</option></select>;

  return (
    <>
      <PageHead eyebrow="Admin portal" title="Universities" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[["Grade 12 universities", data.g12.universities], ["Grade 12 programmes", data.g12.programs], ["GED / IGCSE universities", data.schools.length], ["With scholarships", data.schools.filter(s => s.hasScholarship).length], ["Need re-check", data.schools.filter(s => s.needsCheck).length]].map(([label, value]) => <div key={label} className="tile"><b>{value}</b><span>{t(String(label))}</span></div>)}</div>
      <Note>{data.sheetConnected ? t("Imported GED / IGCSE entries still sync from the Google Sheet.") : t("Imported GED / IGCSE entries use the local CSV file.")} {t("Universities added here are saved in CareerNet and appear alongside imported entries. No Google Sheet is needed to add one.")} {t("Re-check every university every 6 months. Grade 12 data remains in backend/data/g12.json.")}</Note>

      <section className="card flex flex-col gap-4">
        <div><h2 className="text-lg">{t("Add a university directly")}</h2><p className="text-sm text-muted">{t("Save a GED / IGCSE university in CareerNet for students to explore and compare.")}</p></div>
        <form className="flex flex-col gap-4" onSubmit={add}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="label">{t("Code")}<input className="input font-mono" required maxLength={20} pattern="[A-Za-z0-9-]+" placeholder="e.g. abc" {...input("code")} /></label>
            <label className="label sm:col-span-2">{t("University")}<input className="input" required maxLength={180} {...input("name")} /></label>
            <label className="label">{t("Country")}<input className="input" required maxLength={100} {...input("country")} /></label>
            <label className="label">{t("City")}<input className="input" maxLength={120} {...input("city")} /></label>
            <label className="label">{t("GED acceptance")}{acceptance("ged")}</label>
            <label className="label">{t("IGCSE acceptance")}{acceptance("igcse")}</label>
            <label className="label flex-row items-center gap-2"><input type="checkbox" checked={form.hasScholarship} onChange={e => set("hasScholarship", e.target.checked)} />{t("Scholarship available")}</label>
            <label className="label sm:col-span-2">{t("GED requirements")}{textarea("gedNote")}</label>
            <label className="label sm:col-span-2">{t("IGCSE requirements")}{textarea("igcseNote")}</label>
            <label className="label sm:col-span-2">{t("Scholarship details")}{textarea("scholarship")}</label>
            <label className="label sm:col-span-2">{t("Programmes (one per line)")}{textarea("programs", 3)}</label>
          </div>

          <details className="rounded-xl border border-line p-3">
            <summary className="cursor-pointer font-semibold">{t("More student-facing details (optional)")}</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="label">{t("University type")}<input className="input" maxLength={120} {...input("type")} /></label>
              <label className="label">{t("Study mode")}<input className="input" maxLength={80} {...input("mode")} /></label>
              <label className="label">{t("Established")}<input className="input" maxLength={20} {...input("established")} /></label>
              <label className="label">{t("Degree / partner")}<input className="input" maxLength={300} {...input("partner")} /></label>
              <label className="label">{t("English requirement")}<input className="input" maxLength={500} {...input("english")} /></label>
              <label className="label">{t("Duration")}<input className="input" maxLength={100} {...input("duration")} /></label>
              <label className="label">{t("Intakes")}<input className="input" maxLength={500} {...input("intakes")} /></label>
              <label className="label">{t("Website")}<input className="input" type="url" maxLength={500} {...input("website")} /></label>
              <label className="label">{t("Source link")}<input className="input" type="url" maxLength={500} {...input("source")} /></label>
              <label className="label sm:col-span-2">{t("Description")}{textarea("description", 3)}</label>
              <label className="label sm:col-span-2">{t("Admission process")}{textarea("admission", 3)}</label>
              <label className="label sm:col-span-2">{t("Pathway")}{textarea("pathway")}</label>
            </div>
          </details>
          {formError && <p className="text-sm font-semibold text-bad">{formError}</p>}
          <div><button className="btn-primary" disabled={saving}>{saving ? t("Saving…") : t("Add university")}</button></div>
        </form>
      </section>

      <section className="card flex flex-col gap-4">
        <div><h2 className="text-lg">{t("Import from Excel")}</h2><p className="text-sm text-muted">{t("Fill the template in Excel, save it as CSV UTF-8, then upload it here. Imports are checked before they are saved.")}</p><p className="mt-1 text-xs text-muted">{t("Use semicolons between multiple fields or programmes. GED and IGCSE values: yes, no, or confirm.")}</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <a className="btn-outline btn-sm" href="/universities-template.csv" download>{t("Download Excel template")}</a>
          <label className="btn-outline btn-sm cursor-pointer">{t("Choose CSV file")}<input className="sr-only" type="file" accept=".csv,text/csv" onChange={readImportFile} /></label>
          {importFile && <span className="text-sm text-muted">{importFile}</span>}
          {(importRows.length > 0 || importErrors.length > 0) && <button className="btn-ghost btn-sm" type="button" onClick={clearImport}>{t("Clear import")}</button>}
        </div>
        {importErrors.length > 0 && <div className="rounded-xl border border-bad/30 bg-bad/5 p-3 text-sm text-bad" role="alert"><b>{t("Fix these rows before importing")}</b><ul className="mt-1 list-disc pl-5">{importErrors.slice(0, 12).map((issue, i) => <li key={i}>{issue}</li>)}</ul>{importErrors.length > 12 && <p className="mt-1">{t("More row errors are in the file.")}</p>}</div>}
        {importRows.length > 0 && <>
          <p className="text-sm font-semibold">{importRows.length} {t("universities ready to import")}</p>
          <div className="table-wrap"><table><thead><tr><th>{t("Code")}</th><th>{t("University")}</th><th>{t("Country")}</th><th>GED</th><th>IGCSE</th></tr></thead><tbody>
            {importRows.slice(0, 6).map((school, i) => <tr key={`${school.code}-${i}`}><td className="font-mono text-xs">{school.code}</td><td>{school.name}</td><td>{school.country}</td><td>{ok(school.ged.ok)}</td><td>{ok(school.igcse.ok)}</td></tr>)}
          </tbody></table></div>
          {importRows.length > 6 && <p className="text-sm text-muted">{t("Preview shows the first six rows.")}</p>}
          <div><button className="btn-primary" type="button" disabled={importing} onClick={importUniversities}>{importing ? t("Importing…") : t("Import universities")}</button></div>
        </>}
      </section>

      <div className="table-wrap"><table>
        <thead><tr><th>{t("University")}</th><th>{t("Country")}</th><th>{t("Scholarship")}</th><th>GED</th><th>IGCSE</th><th>{t("Last checked")}</th><th>{t("Source")}</th></tr></thead>
        <tbody>{data.schools.map(s => <tr key={s.id}><td><b className="font-mono text-xs text-brand">{s.code}</b> {s.name}</td><td>{s.country}</td><td>{s.hasScholarship ? <Pill tone="ok">Yes</Pill> : <Pill tone="warn">No</Pill>}</td><td>{ok(s.ged)}</td><td>{ok(s.igcse)}</td>
          <td className="font-mono text-xs">{s.lastChecked}{s.needsCheck && <> <Pill tone="warn">{t("Re-check")}</Pill></>}</td><td>{s.source ? <a className="text-brand" href={s.source} target="_blank" rel="noreferrer">{t("Source")}</a> : <span className="text-muted">{t("Added in CareerNet")}</span>}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}
