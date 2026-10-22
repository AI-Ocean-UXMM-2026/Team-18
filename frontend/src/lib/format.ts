// Dates in Myanmar time, money in Ks.
export const fmtKs = (n: number) => `${n.toLocaleString("en-US")} Ks`;
export const fmtWhen = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Yangon", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Yangon", weekday: "short", day: "numeric", month: "short" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Asia/Yangon", hour: "2-digit", minute: "2-digit" });
export const LEVELS: Record<string, string> = { g12: "Grade 12 (Matriculation)", ged: "GED", igcse: "IGCSE" };
