// ===========================================================================
//  report.ts — builds the Pro PDF report in the browser (English; the built-in
//  PDF font cannot draw Burmese — embed a Myanmar font to add that later).
// ===========================================================================
import { jsPDF } from "jspdf";
import type { Career, ScoreResult, UniItem } from "@/lib/api";
import { LEVELS } from "@/lib/format";

type Input = { name: string; level: string; score: ScoreResult; career: Career; majors: string[]; shortlist: UniItem[]; nextSteps: string[]; session?: string | null };

export function buildReport(o: Input) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, TW = W - 2 * M; let y = 0;
  const ink: [number, number, number] = [18, 24, 54], muted: [number, number, number] = [89, 97, 130], accent: [number, number, number] = [52, 69, 196];
  const clean = (s: unknown) => String(s ?? "").replace(/→/g, "->").replace(/[^\x00-\xFF•–—‘’“”…]/g, "");
  const need = (n: number) => { if (y + n > 280) { doc.addPage(); y = M; } };
  const text = (s: unknown, size = 10.5, color = ink, style = "normal", gap = 1.6) => {
    doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...color);
    for (const line of doc.splitTextToSize(clean(s), TW) as string[]) { need(size * 0.45); doc.text(line, M, y); y += size * 0.42; }
    y += gap;
  };
  const h2 = (s: string) => { y += 3; need(14); doc.setDrawColor(...accent); doc.setLineWidth(0.6); doc.line(M, y, M + 12, y); y += 5; text(s, 14, ink, "bold", 2); };
  const bullet = (s: string) => { (doc.splitTextToSize(clean(s), TW - 6) as string[]).forEach((l, i) => { need(5); doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...ink); if (!i) doc.text("-", M + 1, y); doc.text(l, M + 6, y); y += 4.6; }); y += 0.8; };

  doc.setFillColor(...accent); doc.rect(0, 0, W, 42, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("CareerNet", M, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.text("Personal career & university report", M, 27);
  doc.setFontSize(9.5); doc.text(clean(`${o.name} · ${LEVELS[o.level] ?? ""} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`), M, 35);
  y = 54;

  h2("1. Your interest profile");
  text(`Holland code: ${o.score.holland}. Scores from 0 to 100, based on your 20 quiz answers.`, 10.5, muted);
  Object.entries(o.score.scores).forEach(([k, v]) => {
    need(7); doc.setFontSize(10); doc.setTextColor(...ink); doc.text(k, M, y);
    doc.setFillColor(238, 241, 250); doc.rect(M + 10, y - 3, 130, 3.6, "F"); doc.setFillColor(...accent); doc.rect(M + 10, y - 3, 130 * v / 100, 3.6, "F");
    doc.text(String(v), M + 145, y); y += 6.5;
  });
  h2("2. Your top 3 careers (priority order)");
  o.score.top.forEach(x => { text(`${x.priority}. ${x.career.t} · ${x.pct}% match`, 11.5, ink, "bold", 0.6); text(x.career.blurb, 10.5, muted, "normal", 2.5); });
  const c = o.career;
  h2(`3. Your career: ${c.t}`);
  text(c.blurb);
  text("Positions", 11, ink, "bold", 0.5); c.positions.forEach(bullet);
  text("Skills to build", 11, ink, "bold", 0.5); c.skills.forEach(bullet);
  text("Qualifications", 11, ink, "bold", 0.5); c.quals.forEach(bullet);
  text(`Job market: ${c.outlook}`); text(`Demand: ${c.demand} · Study length: ${c.study}`, 10.5, muted);
  h2("4. Your major"); text(o.majors.join(", "), 11, ink, "bold"); text(`Key school subjects: ${c.subjects.join(", ")}`);
  h2("5. Your shortlisted universities");
  if (!o.shortlist.length) text("No universities shortlisted yet.", 10.5, muted);
  o.shortlist.forEach(i => {
    if (i.kind === "g12") { text(i.university.name, 11.5, ink, "bold", 0.6); text(`${i.university.location} · ${i.university.type}`, 10, muted, "normal", 0.6); text(`Programmes: ${i.programs.join(", ")}`, 10.5, ink, "normal", 0.6); text(`Admission: ${i.university.admission}`, 10.5, ink, "normal", 0.6); text(`Website: ${i.university.website}`, 10, accent, "normal", 3); }
    else { const s = i.school; const lv = o.level === "igcse" ? "igcse" : "ged"; text(s.name, 11.5, ink, "bold", 0.6); text(`${s.city}, ${s.country} · ${s.type}`, 10, muted, "normal", 0.6); text(`Scholarship: ${s.scholarship}`, 10.5, ink, "normal", 0.6); text(`Entry with ${lv.toUpperCase()}: ${s[lv].note}`, 10.5, ink, "normal", 0.6); text(`English: ${s.english}`, 10.5, ink, "normal", 0.6); text(`Pathway: ${s.pathway} · Intakes: ${s.intakes}`, 10.5, ink, "normal", 0.6); text(`Website: ${s.website}`, 10, accent, "normal", 3); }
  });
  let n = 6;
  if (o.session) { h2(`${n++}. Your mentor session`); bullet(o.session); }
  h2(`${n}. Next steps`); o.nextSteps.forEach(bullet);
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) { doc.setPage(p); doc.setFontSize(8.5); doc.setTextColor(...muted); doc.text(`CareerNet report · page ${p} of ${pages} · Confirm entry rules and scholarships with each university before applying.`, M, 290); }
  return doc;
}
