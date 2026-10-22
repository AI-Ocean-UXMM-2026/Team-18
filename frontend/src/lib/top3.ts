// Scores the saved quiz answers (server-side rules) for the results screens.
import { api, type ScoreResult } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import type { Journey } from "@/lib/journey";
export function useScore(j: Journey) {
  return useApiData(() => api.post<ScoreResult>("/quiz/score", { answers: j.answers }), [JSON.stringify(j.answers)]);
}
