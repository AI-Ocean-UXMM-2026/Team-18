import { useState, type ClipboardEvent } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, Note, PageHead, Pill, Spinner, toast } from "@/components/ui";

type Accepts = "yes" | "no" | "confirm";
type Row = { id: string; code: string; name: string; country: string; hasScholarship: boolean; ged: Accepts; igcse: Accepts; lastChecked: string; source: string; needsCheck: boolean };
type D = { source: string; sheetConnected: boolean; adminAdded: number; g12: { universities: number; programs: number }; schools: Row[] };
type ImportUniversity = {
  code: string; name: string; country: string; city: string; type: string; mode: string; established: string; fields: number[];
  ged: { ok: Accepts; note: string; tests: string }; igcse: { ok: Accepts; note: string };
  hasScholarship: boolean; scholarship: string; programs: string[]; partner: string; english: string; duration: string;
  intakes: string; website: string; source: string; description: string; admission: string; pathway: string; photo: string;
};

const COLUMNS = ["Code", "University", "Country", "City", "GED acceptance", "GED requirements", "GED tests", "IGCSE acceptance", "IGCSE requirements", "Scholarship available", "Scholarship details", "Programmes", "University type", "Study mode", "Established", "Degree / partner", "English requirement", "Duration", "Intakes", "Website", "Source link", "Description", "Admission process", "Pathway"];
const blankRow = () => Array.from({ length: COLUMNS.length }, () => "");
const hasText = (row: string[]) => row.some(cell => cell.trim());
const list = (value: string) => value.split(";").map(item => item.trim()).filter(Boolean);

function parseAccepts(value: string): Accepts {
  const normalized = value.trim().toLowerCase();
  if (["yes", "accepted", "accept", "direct", "true", "1"].includes(normalized)) return "yes";
  if (["no", "not direct", "not accepted", "false", "0"].includes(normalized)) return "no";
  return "confirm";
}

function toUniversity(row: string[]): ImportUniversity {
  const scholarship = (row[9] ?? "").trim().toLowerCase();
  return {
    code: (row[0] ?? "").trim(), name: (row[1] ?? "").trim(), country: (row[2] ?? "").trim(), city: (row[3] ?? "").trim(),
    ged: { ok: parseAccepts(row[4] ?? ""), note: (row[5] ?? "").trim(), tests: (row[6] ?? "").trim() },
    igcse: { ok: parseAccepts(row[7] ?? ""), note: (row[8] ?? "").trim() },
    hasScholarship: ["yes", "y", "true", "1"].includes(scholarship), scholarship: (row[10] ?? "").trim(), programs: list(row[11] ?? ""),
    type: (row[12] ?? "").trim() || "University", mode: (row[13] ?? "").trim() || "On campus", established: (row[14] ?? "").trim(),
    partner: (row[15] ?? "").trim(), english: (row[16] ?? "").trim(), duration: (row[17] ?? "").trim(), intakes: (row[18] ?? "").trim(),
    website: (row[19] ?? "").trim(), source: (row[20] ?? "").trim(), description: (row[21] ?? "").trim(),
    admission: (row[22] ?? "").trim(), pathway: (row[23] ?? "").trim(), photo: "", fields: [],
  };
}

export default function Universities() {
  const { t } = usePrefs();
  const { data, loading, error, refresh } = useApiData(() => api.get<D>("/admin/universities"));
  const [rows, setRows] = useState<string[][]>(() => [blankRow()]);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function pasteCells(event: ClipboardEvent<HTMLDivElement>) {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !/[\r\n]/.test(text)) return;
    const target = (event.target as HTMLElement).closest<HTMLInputElement>("input[data-row][data-col]");
    if (!target) return;
    event.preventDefault();
    const startRow = Number(target.dataset.row), startCol = Number(target.dataset.col);
    const pasted = text.replace(/\r/g, "").replace(/\n$/, "").split("\n").map(line => line.split("\t"));
    setRows(previous => {
      const next = previous.map(row => [...row]);
      pasted.forEach((cells, rowOffset) => {
        const rowIndex = startRow + rowOffset;
        if (rowIndex >= 100) return;
        while (next.length <= rowIndex) next.push(blankRow());
        cells.slice(0, COLUMNS.length - startCol).forEach((cell, colOffset) => { next[rowIndex][startCol + colOffset] = cell; });
      });
      return next;
    });
    setRowErrors(startRow + pasted.length > 100 ? ["Only the first 100 rows can be saved at once; extra pasted rows were ignored."] : []);
  }

  function validateRows(): { universities: ImportUniversity[]; errors: string[] } {
    const universities = rows.filter(hasText).map(toUniversity);
    const existingCodes = new Set(data?.schools.flatMap(s => [s.id.toLowerCase(), s.code.toLowerCase()]) ?? []);
    const seen = new Set<string>(), errors: string[] = [];
    universities.forEach((university, index) => {
      const row = index + 1;
      if (!/^[A-Za-z0-9-]{2,20}$/.test(university.code)) errors.push(`Row ${row}: code must use 2–20 letters, numbers, or hyphens.`);
      if (university.name.length < 2 || !university.country) errors.push(`Row ${row}: university name and country are required.`);
      const code = university.code.toLowerCase();
      if (code && (seen.has(code) || existingCodes.has(code))) errors.push(`Row ${row}: code “${university.code}” already exists in CareerNest or this sheet.`);
      seen.add(code);
      for (const [label, url] of [["website", university.website], ["source link", university.source]] as const) {
        if (url && !/^https?:\/\//i.test(url)) errors.push(`Row ${row}: ${label} must start with http:// or https://.`);
      }
    });
    if (!universities.length) errors.push("Enter at least one university row.");
    if (universities.length > 100) errors.push("Save no more than 100 universities at a time.");
    return { universities, errors };
  }

  async function saveRows() {
    const checked = validateRows(); setRowErrors(checked.errors);
    if (checked.errors.length) return;
    setSaving(true);
    try {
      const result = await api.post<{ imported: number }>("/admin/universities/import", { universities: checked.universities });
      toast(`${result.imported} ${t("universities imported")}`);
      setRows([blankRow()]); setRowErrors([]); await refresh();
    } catch (err) { setRowErrors([(err as Error).message]); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No university data"} onRetry={refresh} />;
  const acceptance = (value: Accepts) => <Pill tone={value === "yes" ? "ok" : value === "no" ? "bad" : "warn"}>{value === "yes" ? "Accepted" : value === "no" ? "Not direct" : "Confirm"}</Pill>;

  return <>
    <PageHead eyebrow="Admin portal" title="Universities" />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[["Grade 12 universities", data.g12.universities], ["Grade 12 programmes", data.g12.programs], ["GED / IGCSE universities", data.schools.length], ["With scholarships", data.schools.filter(s => s.hasScholarship).length], ["Need re-check", data.schools.filter(s => s.needsCheck).length]].map(([label, value]) => <div key={label} className="tile"><b>{value}</b><span>{t(String(label))}</span></div>)}</div>
    <Note>{data.sheetConnected ? t("Imported GED / IGCSE entries still sync from the Google Sheet.") : t("Imported GED / IGCSE entries use the local CSV file.")} {t("Universities added here are saved in CareerNest and appear alongside imported entries. No Google Sheet is needed to add one.")} {t("Re-check every university every 6 months. Grade 12 data remains in backend/data/g12.json.")}</Note>

    <section className="card flex flex-col gap-4">
      <div><h2 className="text-lg">{t("Add a university directly")}</h2><p className="text-sm text-muted">{t("Type into cells or paste rows copied from Excel. Add one or more universities, then save the sheet.")}</p><p className="mt-1 text-xs text-muted">{t("Use yes, no, or confirm for GED/IGCSE. Separate programmes with semicolons.")}</p></div>
      <div className="table-wrap" onPaste={pasteCells}>
        <table className="spreadsheet-table">
          <thead><tr><th className="spreadsheet-row-number">#</th>{COLUMNS.map((column, index) => <th key={`${column}-${index}`}>{t(column)}</th>)}<th>{t("Remove")}</th></tr></thead>
          <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>
            <th scope="row" className="spreadsheet-row-number">{rowIndex + 1}</th>
            {COLUMNS.map((column, columnIndex) => <td key={`${rowIndex}-${columnIndex}`}><input
              data-row={rowIndex} data-col={columnIndex} value={row[columnIndex] ?? ""} autoComplete="off" spellCheck={columnIndex !== 0}
              aria-label={`${t(column)}, ${t("row")} ${rowIndex + 1}`}
              style={{ width: [100, 240, 150, 140, 140, 240, 180, 140, 240, 150, 240, 260, 170, 150, 120, 200, 220, 140, 180, 230, 230, 280, 280, 240][columnIndex] }}
              className="spreadsheet-cell" onChange={event => { setRows(previous => previous.map((values, i) => i === rowIndex ? values.map((cell, j) => j === columnIndex ? event.target.value : cell) : values)); setRowErrors([]); }}
            /></td>)}
            <td><button type="button" className="btn-ghost btn-sm" onClick={() => { setRows(previous => previous.length === 1 ? [blankRow()] : previous.filter((_, i) => i !== rowIndex)); setRowErrors([]); }} aria-label={`${t("Delete row")} ${rowIndex + 1}`}>×</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      {rowErrors.length > 0 && <div className="rounded-xl border border-bad/30 bg-bad-soft p-3 text-sm text-bad" role="alert"><b>{t("Fix these rows before saving")}</b><ul className="mt-1 list-disc pl-5">{rowErrors.slice(0, 12).map((issue, index) => <li key={index}>{issue}</li>)}</ul></div>}
      <div className="flex flex-wrap gap-2"><button type="button" className="btn-outline btn-sm" disabled={rows.length >= 100} onClick={() => setRows(previous => [...previous, blankRow()])}>{t("Add row")}</button><button type="button" className="btn-primary btn-sm" disabled={saving} onClick={saveRows}>{saving ? t("Saving…") : t("Save universities")}</button><span className="self-center text-xs text-muted">{t("Paste multiple rows and columns from Excel with Ctrl+V.")}</span></div>
    </section>

    <div className="table-wrap"><table>
      <thead><tr><th>{t("University")}</th><th>{t("Country")}</th><th>{t("Scholarship")}</th><th>GED</th><th>IGCSE</th><th>{t("Last checked")}</th><th>{t("Source")}</th></tr></thead>
      <tbody>{data.schools.map(s => <tr key={s.id}><td><b className="font-mono text-xs text-brand">{s.code}</b> {s.name}</td><td>{s.country}</td><td>{s.hasScholarship ? <Pill tone="ok">Yes</Pill> : <Pill tone="warn">No</Pill>}</td><td>{acceptance(s.ged)}</td><td>{acceptance(s.igcse)}</td>
        <td className="font-mono text-xs">{s.lastChecked}{s.needsCheck && <> <Pill tone="warn">{t("Re-check")}</Pill></>}</td><td>{s.source ? <a className="text-brand" href={s.source} target="_blank" rel="noreferrer">{t("Source")}</a> : <span className="text-muted">{t("Added in CareerNest")}</span>}</td></tr>)}</tbody>
    </table></div>
  </>;
}
