import { CAREERS, QUESTIONS, type Career, type Question } from "./data.js";
import { query } from "./db.js";

export async function loadManagedContent() {
  let rows: { content_type: "career" | "question"; data: Career | Question }[] = [];
  let managedContentReady = true;
  try {
    rows = await query("SELECT content_type, data FROM admin_content ORDER BY created_at, content_id");
  } catch (error) {
    if ((error as { code?: string }).code !== "42P01") throw error;
    console.warn("[content] admin_content table is missing; apply database/migrations/20261022_admin_content.sql to enable content imports.");
    managedContentReady = false;
  }
  for (const row of rows) {
    if (row.content_type === "career") {
      const career = row.data as Career;
      if (!CAREERS.some(item => item.id === career.id)) CAREERS.push(career);
    } else {
      const question = row.data as Question;
      if (!QUESTIONS.some(item => item.id === question.id)) QUESTIONS.push(question);
    }
  }
  QUESTIONS.sort((a, b) => a.id - b.id);
  try {
    const videos = await query<{ career_id: string; video_url: string; video_length: string }>("SELECT career_id, video_url, video_length FROM admin_career_videos");
    for (const video of videos) {
      const career = CAREERS.find(item => item.id === video.career_id);
      if (career) {
        career.video.url = video.video_url;
        career.video.len = video.video_length;
      }
    }
  } catch (error) {
    if ((error as { code?: string }).code !== "42P01") throw error;
    console.warn("[content] admin_career_videos table is missing; apply database/migrations/20261022_admin_career_videos.sql to enable video uploads.");
    managedContentReady = false;
  }
  return managedContentReady;
}
