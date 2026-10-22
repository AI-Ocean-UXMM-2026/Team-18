// quiz.ts — Holland (RIASEC) scoring. Plain rules, no AI.
import { CAREERS, CODES, QUESTIONS, type Career, type Code } from "./data.js";

export type Answers = Record<string, number>;
const ALL: Code[] = ["R", "I", "A", "S", "E", "C"];

export function codeScores(a: Answers): Record<Code, number> {
  const out = {} as Record<Code, number>;
  for (const c of ALL) {
    const v = QUESTIONS.filter(q => q.code === c).map(q => a[q.id]).filter(x => x >= 1 && x <= 5);
    out[c] = v.length ? Math.round(((v.reduce((s, x) => s + x, 0) / v.length - 1) / 4) * 100) : 0;
  }
  return out;
}
export function rankCareers(a: Answers) {
  const s = codeScores(a); const w = [1, 0.6, 0.35];
  return CAREERS.map(career => {
    let sum = 0, tot = 0; [...career.codes].forEach((c, i) => { sum += s[c as Code] * w[i]; tot += w[i]; });
    return { career, pct: Math.round(sum / tot) };
  }).sort((x, y) => y.pct - x.pct);
}
export function reasonsFor(career: Career, a: Answers) {
  const s = codeScores(a);
  return [...career.codes].slice(0, 2).map(c => ({
    code: c, name: CODES[c as Code].n, score: s[c as Code],
    example: QUESTIONS.find(q => q.code === c && a[q.id] >= 4)?.en ?? null,
  }));
}
export const unanswered = (a: Answers) => QUESTIONS.filter(q => !(a[q.id] >= 1 && a[q.id] <= 5)).map(q => q.id);
export function hollandCode(a: Answers) { const s = codeScores(a); return [...ALL].sort((x, y) => s[y] - s[x]).slice(0, 3).join(""); }
