import type { Content } from "./api";
import type { Journey } from "./journey";

export const JOURNEY_PATHS = ["/student/quiz", "/student/results", "/student/movies", "/student/career", "/student/majors", "/student/explorer", "/student/compare", "/student/plan", "/student/mentors"];

/** One policy for both navigation and direct URL access. Never count unknown answer IDs. */
export function studentProgress(j: Journey, content: Content | null) {
  const questions = content?.questions ?? [];
  const answered = questions.filter(q => Number.isInteger(j.answers[q.id]) && j.answers[q.id] >= 1 && j.answers[q.id] <= 5).length;
  const quizDone = !!j.level && questions.length > 0 && answered === questions.length && j.quizCompleted !== false;
  // Older saved journeys did not have confirmation flags. Retain completed work.
  const resultsDone = quizDone && (j.resultsReviewed ?? !!j.careerId);
  const career = content?.careers.find(c => c.id === j.careerId);
  const careerDone = resultsDone && !!career;
  const majorsDone = careerDone && j.majors.length > 0 && j.majors.length <= 2 && j.majors.every(n => career!.majors.some(m => m.n === n)) && j.majorsConfirmed !== false;
  const comparisonReady = majorsDone && j.compare.length >= 2 && j.compare.length <= 3 && new Set(j.compare).size === j.compare.length && j.compare.every(k => j.shortlist.includes(k));
  const comparisonDone = comparisonReady && j.comparisonCompleted !== false;
  const nextPath = !j.level ? "/student" : !quizDone ? "/student/quiz" : !resultsDone ? "/student/results" : !careerDone ? "/student/career" : !majorsDone ? "/student/majors" : !comparisonReady ? "/student/explorer" : !comparisonDone ? "/student/compare" : "/student/plan";
  return { answered, total: questions.length, quizDone, resultsDone, careerDone, majorsDone, comparisonReady, comparisonDone, nextPath };
}

export function studentRouteRedirect(path: string, progress: ReturnType<typeof studentProgress>, level: Journey["level"], isPro = false): string | null {
  const allowed: Record<string, boolean> = {
    "/student/quiz": !!level,
    "/student/results": progress.quizDone,
    "/student/movies": progress.resultsDone,
    "/student/career": progress.resultsDone,
    "/student/majors": progress.careerDone,
    "/student/explorer": progress.majorsDone,
    "/student/compare": progress.majorsDone,
    "/student/plan": progress.comparisonDone,
    "/student/mentors": progress.comparisonDone,
  };
  if (allowed[path] === false) return progress.nextPath;
  if (path === "/student/mentors" && !isPro) return "/student/pro";
  return null;
}

/** Editing a prerequisite invalidates saved confirmations and dependent choices. */
export function updateJourney(prev: Journey, patch: Partial<Journey>): Journey {
  const next = { ...prev, ...patch };
  if (JSON.stringify(next.answers) !== JSON.stringify(prev.answers)) {
    Object.assign(next, { quizCompleted: false, resultsReviewed: false, careerId: null, majors: [], majorsConfirmed: false, shortlist: [], compare: [], comparisonCompleted: false, videoChoice: null, watched: {} });
  } else if (next.careerId !== prev.careerId) {
    Object.assign(next, { majors: [], majorsConfirmed: false, shortlist: [], compare: [], comparisonCompleted: false });
  } else if (JSON.stringify(next.majors) !== JSON.stringify(prev.majors)) {
    Object.assign(next, { majorsConfirmed: false, shortlist: [], compare: [], comparisonCompleted: false });
  }
  if (next.level !== prev.level) Object.assign(next, { shortlist: [], compare: [], comparisonCompleted: false });
  if (JSON.stringify(next.compare) !== JSON.stringify(prev.compare) || JSON.stringify(next.shortlist) !== JSON.stringify(prev.shortlist)) next.comparisonCompleted = false;
  return next;
}
