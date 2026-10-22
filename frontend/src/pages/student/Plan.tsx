// Your plan: career, major, shortlist, mentor session, next steps, PDF report (Pro).
import { Link } from "wouter";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth";
import { fmtWhen, LEVELS } from "@/lib/format";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { buildReport } from "@/lib/report";
import { useScore } from "@/lib/top3";
import { useUniversities } from "@/lib/unis";
import { PageHead, Pill, Spinner, toast } from "@/components/ui";

const NEXT = {
  g12: ["Check the official university entry announcement when matriculation results come out.", "Rank your shortlisted programmes on the application form.", "Keep a back-up choice in case your first choice is full."],
  ged: ["Book IELTS (and SAT if your shortlist asks for it).", "Request official GED transcripts.", "For Thai universities, prepare HSCES equivalency.", "Email admissions to confirm GED entry before you apply."],
  igcse: ["Book IELTS if your shortlist needs it.", "Get certified copies of IGCSE results.", "Decide between a foundation year or A-Levels for direct entry.", "Email admissions to confirm IGCSE entry before you apply."],
};
export default function Plan() {
  const { j, content } = useJourney(); const { user } = useAuth(); const { t } = usePrefs();
  const score = useScore(j); const unis = useUniversities(false, true);
  const bookings = useApiData(() => api.get<{ bookings: { status: string; startsAt: string; mentorName: string }[] }>("/me/bookings"));
  if (score.loading || unis.loading || !content) return <Spinner />;
  const c = content.careers.find(x => x.id === j.careerId);
  if (!c || !score.data) return <section className="card"><p>{t("Finish the quiz and choose a career first.")}</p><Link href="/student" className="btn-primary mt-3 inline-flex">{t("Start quiz")}</Link></section>;
  const shortlist = j.shortlist.map(k => unis.data?.items.find(i => i.key === k)).filter(Boolean) as NonNullable<typeof unis.data>["items"];
  const session = bookings.data?.bookings.find(b => ["confirmed", "completed"].includes(b.status));
  const next = NEXT[j.level ?? "g12"];
  function download() {
    try {
      const doc = buildReport({ name: user?.name ?? "", level: j.level ?? "g12", score: score.data!, career: c!, majors: j.majors, shortlist, nextSteps: next, session: session ? `${session.mentorName}, ${fmtWhen(session.startsAt)}` : null });
      doc.save("CareerNet-report.pdf");
    } catch { toast(t("Could not create the PDF")); }
  }
  return (
    <>
      <PageHead back="/student/compare" eyebrow="Your plan" title={`${t("Your plan")}, ${user?.name.split(" ")[0] ?? ""}`} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card"><h2 className="text-sm text-muted">{t("Chosen career")}</h2><p className="text-xl font-bold">{c.t}</p><p className="text-sm text-muted">{score.data.top.find(x => x.career.id === c.id)?.pct ?? "–"}% · {t("Demand")} {c.demand}</p></div>
        <div className="card"><h2 className="text-sm text-muted">{t("Major")}</h2><p className="text-xl font-bold">{j.majors.join(" · ")}</p><p className="text-sm text-muted">{LEVELS[j.level ?? "g12"]}</p></div>
      </div>
      <div className="card"><h2 className="mb-2 text-lg">{t("Shortlisted universities")}</h2>
        {shortlist.length ? <ul className="divide-y divide-line">{shortlist.map(i => <li key={i.key} className="flex items-center justify-between gap-3 py-2"><span>{i.kind === "g12" ? i.university.name : i.school.name}</span>{i.kind === "intl" && i.school.hasScholarship && <Pill tone="ok">{t("Scholarship")}</Pill>}</li>)}</ul>
          : <p className="text-muted">{t("Nothing shortlisted yet.")} <Link href="/student/explorer" className="text-brand">{t("Open explorer")}</Link></p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card"><h2 className="mb-2 text-lg">{t("Mentor session")}</h2>{session ? <p>{session.mentorName}, <span className="font-mono">{fmtWhen(session.startsAt)}</span></p> : (user?.isPro ? <><p className="text-muted">{t("Not booked (optional)")}</p><Link href="/student/mentors" className="btn-outline btn-sm mt-2 inline-flex">{t("Book a 1-hour mentor session")}</Link></>
          : <><p className="text-muted">{t("Mentor sessions are part of CareerNet Pro.")}</p><Link href="/student/pro" className="btn-outline btn-sm mt-2 inline-flex">{t("Go Pro")}</Link></>)}</div>
        <div className="card"><h2 className="mb-2 text-lg">{t("Next steps")}</h2><ol className="list-decimal pl-5">{next.map(s => <li key={s}>{t(s)}</li>)}</ol></div>
      </div>
      <div className={`card flex flex-col gap-2 ${user?.isPro ? "border-ok" : ""}`}>
        <div className="flex justify-between"><h2 className="text-lg">{t("Full report (PDF)")}</h2><span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Pro</span></div>
        {user?.isPro ? <><p className="text-sm text-muted">{t("Your personal report with results, career plan, universities, scholarships and next steps.")}</p><button className="btn-primary self-start" onClick={download}>{t("Download PDF report")}</button></>
          : <><p className="text-sm text-muted">{t("The full PDF report is part of CareerNet Pro.")}</p><Link href="/student/pro" className="btn-primary self-start">{t("Go Pro")}</Link></>}
      </div>
    </>
  );
}
