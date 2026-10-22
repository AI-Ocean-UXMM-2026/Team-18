// ===========================================================================
//  data.ts — static content shipped with the app.
//    questions.json  20 quiz questions (EN + MY)
//    careers.json    14 careers, majors, 3-minute short-movie info
//    g12.json        Grade 12: 26 Myanmar universities + 154 programmes (UniAdvisor)
// ===========================================================================
import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = path.resolve(import.meta.dirname, "..", "data");
const load = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));

export type Code = "R" | "I" | "A" | "S" | "E" | "C";
export type Question = { id: number; area: string; code: Code; en: string; my: string };
export type Career = {
  id: string; t: string; codes: string; f: number[]; demand: string; study: string; blurb: string;
  positions: string[]; skills: string[]; quals: string[]; outlook: string; subjects: string[];
  majors: { n: string; f: number }[]; video: { len: string; ch: string[]; url: string };
};
export type G12University = { id: number; code: string; name: string; location: string; type: string; fields: number[]; established: number; description: string; admission: string; website: string; photo: string | null };
export type G12Program = { university: number; field: number; name: string };

export const QUESTIONS = load<Question[]>("questions.json");
export const CAREERS = load<Career[]>("careers.json");
export const { codes: CODES, fields: FIELD_NAMES } = load<{ codes: Record<Code, { n: string; d: string }>; fields: Record<string, string> }>("codes.json");
const g12 = load<{ universities: G12University[]; programs: G12Program[] }>("g12.json");
export const G12_UNIS = g12.universities;
export const G12_PROGRAMS = g12.programs;
export const careerById = (id: string | null | undefined) => CAREERS.find(c => c.id === id) ?? null;
