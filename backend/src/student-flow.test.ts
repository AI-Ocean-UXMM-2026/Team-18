import { describe, expect, it } from "vitest";
import { JOURNEY_PATHS, studentProgress, studentRouteRedirect, updateJourney } from "../../frontend/src/lib/studentFlow";
import type { Content } from "../../frontend/src/lib/api";
import type { Journey } from "../../frontend/src/lib/journey";

const content = {
  questions: Array.from({ length: 20 }, (_, id) => ({ id })),
  careers: [{ id: "swe", majors: [{ n: "Computer Science", f: 1 }] }, { id: "design", majors: [{ n: "Design", f: 2 }] }],
} as Content;
const fresh = (): Journey => ({ level: null, answers: {}, careerId: null, majors: [], shortlist: [], compare: [], watched: {}, videoChoice: null });
const answered = (): Journey => ({ ...fresh(), level: "g12", answers: Object.fromEntries(content.questions.map(q => [q.id, 3])), quizCompleted: true });
const completed = (): Journey => ({ ...answered(), resultsReviewed: true, careerId: "swe", majors: ["Computer Science"], majorsConfirmed: true, shortlist: ["a", "b"], compare: ["a", "b"], comparisonCompleted: true });
const redirect = (path: string, j: Journey, pro = false) => studentRouteRedirect(path, studentProgress(j, content), j.level, pro);

describe("student journey access", () => {
  it("locks every journey destination until education is chosen, including direct URLs", () => {
    for (const path of JOURNEY_PATHS) expect(redirect(path, fresh())).toBe("/student");
  });
  it("allows only the quiz for a new student, even with Pro", () => {
    const j = { ...fresh(), level: "g12" as const };
    expect(redirect("/student/quiz", j)).toBeNull();
    for (const path of JOURNEY_PATHS.filter(p => p !== "/student/quiz")) expect(redirect(path, j, true)).toBe("/student/quiz");
  });
  it("requires all real questions and Finish quiz, not just 20 truthy entries", () => {
    const j = answered();
    j.quizCompleted = false;
    expect(redirect("/student/results", j)).toBe("/student/quiz");
    j.quizCompleted = true;
    delete j.answers[0]; j.answers[999] = 3;
    expect(studentProgress(j, content).quizDone).toBe(false);
    j.answers[0] = 6;
    expect(studentProgress(j, content).quizDone).toBe(false);
    j.answers[0] = 2.5;
    expect(studentProgress(j, content).quizDone).toBe(false);
  });
  it("unlocks Results alone after the quiz and Career only after reviewing Results", () => {
    const j = answered();
    expect(redirect("/student/results", j)).toBeNull();
    expect(redirect("/student/career", j)).toBe("/student/results");
    j.resultsReviewed = true;
    expect(redirect("/student/career", j)).toBeNull();
    expect(redirect("/student/movies", j)).toBeNull();
    expect(redirect("/student/majors", j)).toBe("/student/career");
  });
  it("requires a valid career and explicit major confirmation", () => {
    const j = { ...answered(), resultsReviewed: true, careerId: "swe", majors: ["Computer Science"], majorsConfirmed: false };
    expect(redirect("/student/majors", j)).toBeNull();
    expect(redirect("/student/explorer", j)).toBe("/student/majors");
    j.majorsConfirmed = true;
    expect(redirect("/student/explorer", j)).toBeNull();
    j.majors = ["Unrelated major"];
    expect(redirect("/student/explorer", j)).toBe("/student/majors");
  });
  it("requires two distinct shortlisted universities, then an explicit comparison save", () => {
    const j = { ...completed(), comparisonCompleted: false };
    expect(redirect("/student/compare", j)).toBeNull();
    expect(redirect("/student/plan", j)).toBe("/student/compare");
    j.comparisonCompleted = true;
    expect(redirect("/student/plan", j)).toBeNull();
    j.compare = ["a", "a"];
    expect(redirect("/student/compare", j)).toBe("/student/explorer");
    j.compare = ["a", "missing"];
    expect(redirect("/student/compare", j)).toBe("/student/explorer");
  });
  it("keeps mentor access restricted to Pro after completing the journey", () => {
    expect(redirect("/student/mentors", completed())).toBe("/student/pro");
    expect(redirect("/student/mentors", completed(), true)).toBeNull();
  });
  it("does not trust downstream confirmations when content or a prerequisite is missing", () => {
    expect(studentProgress(completed(), null).quizDone).toBe(false);
    const j = { ...completed(), resultsReviewed: false };
    expect(redirect("/student/plan", j, true)).toBe("/student/results");
    j.resultsReviewed = true; j.quizCompleted = false;
    expect(redirect("/student/mentors", j, true)).toBe("/student/quiz");
  });
  it("leaves account settings, upgrade and education setup available", () => {
    for (const path of ["/student", "/student/profile", "/student/pro"]) expect(redirect(path, fresh())).toBeNull();
  });
  it("preserves genuinely completed legacy journeys after reload", () => {
    const j = completed();
    delete j.quizCompleted; delete j.resultsReviewed; delete j.majorsConfirmed; delete j.comparisonCompleted;
    expect(redirect("/student/plan", JSON.parse(JSON.stringify(j)))).toBeNull();
    j.answers = {};
    expect(redirect("/student/plan", j)).toBe("/student/quiz");
  });
  it("relocks every dependent step when an answer changes", () => {
    const j = updateJourney(completed(), { answers: { ...answered().answers, 0: 1 } });
    expect(j.careerId).toBeNull();
    expect(j.majors).toEqual([]);
    expect(j.compare).toEqual([]);
    expect(redirect("/student/plan", j, true)).toBe("/student/quiz");
  });
  it("relocks university choices when the career, major, education or comparison changes", () => {
    expect(redirect("/student/plan", updateJourney(completed(), { careerId: "design" }))).toBe("/student/majors");
    expect(redirect("/student/explorer", updateJourney(completed(), { majors: [] }))).toBe("/student/majors");
    expect(redirect("/student/plan", updateJourney(completed(), { level: "ged" }))).toBe("/student/explorer");
    const j = updateJourney(completed(), { shortlist: ["a", "b", "c"], compare: ["a", "c"] });
    expect(redirect("/student/plan", j)).toBe("/student/compare");
  });
  it("retains completion on unchanged answers and persists newly confirmed steps", () => {
    expect(studentProgress(updateJourney(completed(), { answers: { ...completed().answers } }), content).comparisonDone).toBe(true);
    const j = updateJourney({ ...completed(), comparisonCompleted: false }, { comparisonCompleted: true });
    expect(redirect("/student/plan", JSON.parse(JSON.stringify(j)))).toBeNull();
  });
});
