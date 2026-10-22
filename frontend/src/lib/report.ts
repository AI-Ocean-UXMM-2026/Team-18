// Browser-generated Pro report. English text uses the built-in PDF fonts.
import { jsPDF } from "jspdf";
import type { Career, ScoreResult, UniItem } from "@/lib/api";
import { LEVELS } from "@/lib/format";

type Input = { name: string; level: string; score: ScoreResult; career: Career; majors: string[]; shortlist: UniItem[]; nextSteps: string[]; session?: string | null };
type Color = [number, number, number];
const INK: Color = [43, 33, 58], MUTED: Color = [104, 91, 120], VIOLET: Color = [112, 61, 224];
const CREAM: Color = [250, 247, 239], LIME: Color = [225, 250, 119], PINK: Color = [250, 182, 214], LILAC: Color = [237, 228, 255], BLUE: Color = [204, 228, 255];
const clean = (value: unknown) => String(value ?? "").replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/→/g, "->").replace(/…/g, "...").replace(/[^\x20-\xFF\n]/g, "");

export function buildReport(o: Input) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 17, WIDTH = 176, BOTTOM = 272;
  let y = 0, section = "YOUR NEXT MOVE", pageStarted = false;
  const lines = (value: unknown, size: number, width: number, bold = false): string[] => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    return doc.splitTextToSize(clean(value), width);
  };
  const label = (value: string, x: number, baseline: number, size = 10, color = INK, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...color); doc.text(clean(value), x, baseline);
  };
  const box = (x: number, top: number, width: number, height: number, color: Color) => {
    doc.setFillColor(...INK); doc.roundedRect(x + 1.3, top + 1.5, width, height, 3, 3, "F");
    doc.setFillColor(...color); doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.roundedRect(x, top, width, height, 3, 3, "FD");
  };
  const newPage = () => {
    if (pageStarted) doc.addPage(); pageStarted = true;
    doc.setFillColor(...CREAM); doc.rect(0, 0, 210, 297, "F");
    label("CareerNet.", M, 14, 12, INK, true); label("YOUR FUTURE, YOUR WAY", 133, 14, 8, MUTED, true);
    doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.line(M, 19, 193, 19);
    label(section, M, 27, 8, VIOLET, true); y = 35;
  };
  const need = (height: number) => { if (y + height > BOTTOM) newPage(); };
  const title = (number: string, heading: string, subtitle: string, color: Color) => {
    section = `${number} / ${heading.toUpperCase()}`; newPage();
    box(M, y, WIDTH, 38, color);
    label(heading, M + 7, y + 15, 26, INK, true);
    label(subtitle, M + 7, y + 28, 10, INK); y += 46;
  };
  // Cards paginate as measured text, including unusually long school names or descriptions.
  const card = (heading: string, body: string[], color: Color = [255, 255, 255]) => {
    const headingLines = lines(heading, 13, WIDTH - 14, true);
    let remaining = body.flatMap(s => lines(s, 10.5, WIDTH - 14));
    let continued = false;
    do {
      const head = continued ? lines(`${heading} (continued)`, 13, WIDTH - 14, true) : headingLines;
      const headerHeight = head.length * 5.8 + 7;
      need(headerHeight + Math.min(remaining.length, 3) * 4.6 + 4);
      const capacity = Math.max(1, Math.floor((BOTTOM - y - headerHeight - 5) / 4.6));
      const part = remaining.splice(0, capacity);
      const height = headerHeight + part.length * 4.6 + 4;
      box(M, y, WIDTH, height, color);
      head.forEach((line, index) => label(line, M + 7, y + 8 + index * 5.8, 13, INK, true));
      part.forEach((line, index) => label(line, M + 7, y + headerHeight + index * 4.6, 10.5, INK));
      y += height + 4;
      if (remaining.length) { newPage(); continued = true; }
    } while (remaining.length);
  };

  title("01", "Find your next move.", "Your personal career & university playbook", LIME);
  card(clean(o.name).trim() || "Your personal playbook", [
    `${LEVELS[o.level] ?? o.level} | ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    `Holland code: ${o.score.holland} | Your interests, based on 20 quiz answers.`,
  ], LILAC);
  const names: Record<string, string> = { R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional" };
  const colors = [VIOLET, PINK, BLUE, LIME, VIOLET, PINK];
  Object.entries(o.score.scores).forEach(([key, value], index) => {
    need(10);
    label(names[key] ?? key, M, y + 4, 10, INK, true);
    doc.setFillColor(...LILAC); doc.roundedRect(68, y, 109, 5, 2, 2, "F");
    const score = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
    if (score > 0) { doc.setFillColor(...colors[index % colors.length]); doc.roundedRect(68, y, Math.max(1, 109 * score / 100), 5, 1, 1, "F"); }
    label(`${value}`, 183, y + 4, 10, INK, true); y += 9;
  });
  y += 3;
  o.score.top.forEach(x => card(`${x.priority.toString().padStart(2, "0")} / ${x.career.t} - ${x.pct}% match`, [x.career.blurb], x.priority === 1 ? PINK : [255, 255, 255]));

  const c = o.career;
  title("02", "Build your direction.", "A career to explore. Skills you can start building now.", PINK);
  card(c.t, [c.blurb, `Job market: ${c.outlook}`, `Demand: ${c.demand} | Study length: ${c.study}`], LILAC);
  card("Roles you could grow into", c.positions.map(s => `- ${s}`));
  card("Your skill starter pack", c.skills.map(s => `- ${s}`), BLUE);
  card("Qualifications to aim for", c.quals.map(s => `- ${s}`));
  card("Your major & school subjects", [o.majors.join(", ") || "No major selected yet.", `Key subjects: ${c.subjects.join(", ")}`], LIME);

  title("03", "Explore your options.", "Your university shortlist, all in one place.", BLUE);
  if (!o.shortlist.length) card("Your shortlist is still open", ["Explore universities and save the ones that fit your goals."]);
  o.shortlist.forEach((item, index) => {
    if (item.kind === "g12") {
      const u = item.university;
      card(`${index + 1} / ${u.name}`, [`${u.location} | ${u.type}`, `Programmes: ${item.programs.join(", ")}`, `Admission: ${u.admission}`, `Website: ${u.website}`], index % 2 ? LILAC : [255, 255, 255]);
    } else {
      const s = item.school, level = o.level === "igcse" ? "igcse" : "ged";
      card(`${index + 1} / ${s.name}`, [`${s.city}, ${s.country} | ${s.type}`, `Scholarship: ${s.scholarship}`, `Entry with ${level.toUpperCase()}: ${s[level].note}`, `English: ${s.english}`, `Pathway: ${s.pathway} | Intakes: ${s.intakes}`, `Website: ${s.website}`], index % 2 ? LILAC : [255, 255, 255]);
    }
  });
  card("Before you apply", ["Confirm entry rules, deadlines and scholarships directly with each university."], LIME);

  title("04", "Make your next move.", "Small steps today. More possibilities tomorrow.", LILAC);
  if (o.session) card("Your mentor session", [o.session], PINK);
  o.nextSteps.forEach((step, index) => card(`${String(index + 1).padStart(2, "0")} / Your next step`, [step], index % 2 ? [255, 255, 255] : BLUE));
  card("Keep exploring. Keep growing.", ["Your quiz results are a starting point. Explore, ask questions and update your plan as you learn more about yourself."], LIME);

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page); doc.setDrawColor(...INK); doc.line(M, 282, 193, 282);
    label("CareerNet / Personal career playbook", M, 289, 8, MUTED);
    label(`${String(page).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, 177, 289, 9, INK, true);
  }
  doc.setProperties({ title: "CareerNet - Your career playbook", subject: "Personal career and university plan", author: "CareerNet" });
  return doc;
}
