// npm test — checks quiz scoring and the school sheet parser (no database needed).
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseSchoolsCsv } from "./schools.js";
import { rankCareers, unanswered } from "./quiz.js";
import { G12_UNIS, G12_PROGRAMS } from "./data.js";

const answers = Object.fromEntries([5, 2, 3, 3, 4, 4, 5, 3, 3, 2, 5, 4, 4, 3, 3, 3, 2, 4, 3, 5].map((v, i) => [String(i), v]));
const schools = parseSchoolsCsv(fs.readFileSync(path.resolve(import.meta.dirname, "../data/schools.csv"), "utf8"));

describe("quiz", () => {
  it("ranks Software Engineer first for the sample answers", () => expect(rankCareers(answers)[0].career.id).toBe("swe"));
  it("finds unanswered questions", () => expect(unanswered({ "0": 3 }).length).toBe(19));
});
describe("data", () => {
  it("loads Grade 12 data", () => { expect(G12_UNIS.length).toBe(26); expect(G12_PROGRAMS.length).toBe(154); });
  it("loads GED/IGCSE universities", () => expect(schools.length).toBe(9));
  it("marks scholarships", () => expect(schools.filter(s => s.hasScholarship).length).toBe(8));
  it("NUS accepts IGCSE only with A-Levels", () => expect(schools.find(s => s.id === "nus")!.igcse.ok).toBe("no"));
});
