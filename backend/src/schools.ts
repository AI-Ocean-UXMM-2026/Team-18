// ===========================================================================
//  schools.ts — GED / IGCSE universities from your Google Sheet.
//  The sheet IS the editing tool: change a row and within
//  SCHOOLS_CACHE_SECONDS the site and the AI advisor use it.
// ===========================================================================
import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import { ENV } from "./env.js";
import { DATA_DIR } from "./data.js";

export type Accepts = "yes" | "no" | "confirm";
export type School = {
  id: string; code: string; name: string; country: string; city: string; type: string; mode: string; established: string;
  fields: number[]; description: string; partner: string; programs: string[];
  ged: { ok: Accepts; note: string; tests: string }; igcse: { ok: Accepts; note: string };
  english: string; admission: string; pathway: string; duration: string; intakes: string;
  hasScholarship: boolean; scholarship: string; website: string; source: string; photo: string; lastChecked: string;
};
const list = (v?: string) => String(v ?? "").split(";").map(s => s.trim()).filter(Boolean);
const acc = (v?: string): Accepts => { const s = String(v ?? "").trim().toLowerCase(); return s === "yes" ? "yes" : s === "no" ? "no" : "confirm"; };

export function rowToSchool(r: Record<string, string>): School {
  return {
    id: (r.id ?? "").trim(), code: (r.code ?? "").trim(), name: (r.name ?? "").trim(), country: r.country ?? "", city: r.city ?? "",
    type: r.type ?? "", mode: r.mode ?? "", established: r.established ?? "", fields: list(r.fields).map(Number).filter(Number.isFinite),
    description: r.description ?? "", partner: r.partner ?? "", programs: list(r.programs),
    ged: { ok: acc(r.ged_ok), note: r.ged_note ?? "", tests: r.ged_tests ?? "" }, igcse: { ok: acc(r.igcse_ok), note: r.igcse_note ?? "" },
    english: r.english ?? "", admission: r.admission ?? "", pathway: r.pathway ?? "", duration: r.duration ?? "", intakes: r.intakes ?? "",
    hasScholarship: (r.has_scholarship ?? "").trim().toLowerCase() === "yes", scholarship: r.scholarship ?? "",
    website: r.website ?? "", source: r.source ?? "", photo: r.photo ?? "", lastChecked: r.last_checked ?? "",
  };
}
export function parseSchoolsCsv(text: string) {
  const { data } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const all = data.map(rowToSchool);
  const bad = all.filter(s => !s.id || !s.name);
  if (bad.length) console.warn(`[schools] skipped ${bad.length} row(s) without id or name`);
  return all.filter(s => s.id && s.name);
}

let cache: { at: number; schools: School[]; source: string } | null = null;
export async function getSchools(): Promise<School[]> {
  if (cache && Date.now() - cache.at < ENV.schoolsCacheSeconds * 1000) return cache.schools;
  try {
    let text: string, source: string;
    if (ENV.schoolsSheetUrl) {
      const res = await fetch(ENV.schoolsSheetUrl);
      if (!res.ok) throw new Error(`Google Sheet answered ${res.status}`);
      text = await res.text(); source = "google-sheet";
    } else { text = await fs.readFile(path.join(DATA_DIR, "schools.csv"), "utf8"); source = "local-csv"; }
    cache = { at: Date.now(), schools: parseSchoolsCsv(text), source };
    return cache.schools;
  } catch (e) {
    if (cache) { console.warn("[schools] reload failed, keeping last good copy:", (e as Error).message); return cache.schools; }
    throw e;
  }
}
export const schoolsSource = () => cache?.source ?? "not-loaded";
