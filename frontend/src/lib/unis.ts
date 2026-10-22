// Loads universities for the student's level and majors (information only, no marks).
import { api, type UniItem } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { majorFields, useJourney } from "@/lib/journey";
export function useUniversities(onlyScholarship = false, allFields = false) {
  const { j, content } = useJourney();
  const fields = allFields ? [] : majorFields(j, content);
  return useApiData(() => api.get<{ items: UniItem[] }>(`/universities?level=${j.level ?? "g12"}&fields=${fields.join(",")}${onlyScholarship ? "&scholarship=1" : ""}`), [j.level, fields.join(","), onlyScholarship, allFields]);
}
