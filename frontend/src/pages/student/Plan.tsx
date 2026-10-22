// Your plan: career, major, shortlist, mentor session, next steps, PDF report (Pro).
import { useState } from "react";
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
  const { j, content } = useJourney(); const { user, isGuest } = useAuth(); const { t } = usePrefs();
  const [pdfStatus, setPdfStatus] = useState("");
  const score = useScore(j); const unis = useUniversities(false, true);
  const bookings = useApiData(() => user?.isPro ? api.get<{ bookings: { status: string; startsAt: string; mentorName: string }[] }>("/me/bookings") : Promise.resolve({ bookings: [] }), [user?.id, user?.isPro]);
  if (score.loading || unis.loading || !content) return <Spinner />;
  const c = content.careers.find(x => x.id === j.careerId);
  if (!c || !score.data) return <section className="card"><p>{t("Finish the quiz and choose a career first.")}</p><Link href="/student" className="btn-primary mt-3 inline-flex">{t("Start quiz")}</Link></section>;
  const shortlist = j.shortlist.map(k => unis.data?.items.find(i => i.key === k)).filter(Boolean) as NonNullable<typeof unis.data>["items"];
  const session = bookings.data?.bookings.find(b => ["confirmed", "completed"].includes(b.status));
  const next = NEXT[j.level ?? "g12"];
  function download() {
    setPdfStatus("");
    let objectUrl: string | null = null;
    try {
      const comparing = j.compare.map(key => unis.data?.items.find(item => item.key === key)).filter(Boolean) as typeof shortlist;
      const doc = buildReport({ name: user?.name ?? "", level: j.level ?? "g12", score: score.data!, career: c!, majors: j.majors, shortlist, comparing, videoChoice: j.videoChoice, watched: j.watched, nextSteps: next, session: session ? `${session.mentorName}, ${fmtWhen(session.startsAt)}` : null });
      const pdf = doc.output("blob");
      if (!pdf.size) throw new Error("The generated PDF is empty.");
      objectUrl = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "CareerNest-report.pdf";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setPdfStatus(t("Your PDF report is downloading. Check your Downloads folder."));
    } catch (error) {
      console.error("CareerNest PDF generation failed", error);
      setPdfStatus(t("Could not create the PDF"));
      toast(t("Could not create the PDF"));
    }
    if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl!), 60_000);
  }
  return (
    <>
      <PageHead back="/student/compare" eyebrow="Your plan" title={user ? `${t("Your plan")}, ${user.name.split(" ")[0]}` : t("Your plan")} />
      <div className="grid gap-5 md:grid-cols-3">
        <div className="card border-t-4 border-t-brand"><h2 className="text-sm text-muted">{t("Chosen career")}</h2><p className="text-xl font-bold">{c.t}</p><p className="text-sm text-muted">{score.data.top.find(x => x.career.id === c.id)?.pct ?? "–"}% · {t("Demand")} {c.demand}</p></div>
        <div className="card border-t-4 border-t-ai"><h2 className="text-sm text-muted">{t("Major")}</h2><p className="text-xl font-bold">{j.majors.join(" · ")}</p><p className="text-sm text-muted">{LEVELS[j.level ?? "g12"]}</p></div>
      <div className="card border-t-4 border-t-ok"><h2 className="text-sm text-muted">{t("University shortlist")}</h2><p className="mt-2 text-3xl font-bold">{shortlist.length}</p><Link href="/student/explorer" className="mt-2 inline-block text-sm font-semibold text-brand">{t("Explore universities")} →</Link></div>
      </div>
      <div className="card"><h2 className="mb-2 text-lg">{t("Shortlisted universities")}</h2>
        {shortlist.length ? <ul className="divide-y divide-line">{shortlist.map(i => <li key={i.key} className="flex items-center justify-between gap-3 py-2"><span>{i.kind === "g12" ? i.university.name : i.school.name}</span>{i.kind === "intl" && i.school.hasScholarship && <Pill tone="ok">{t("Scholarship")}</Pill>}</li>)}</ul>
          : <p className="text-muted">{t("Nothing shortlisted yet.")} <Link href="/student/explorer" className="text-brand">{t("Open explorer")}</Link></p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card"><h2 className="mb-2 text-lg">{t("Mentor session")}</h2>{session ? <p>{session.mentorName}, <span className="font-mono">{fmtWhen(session.startsAt)}</span></p> : (user?.isPro ? <><p className="text-muted">{t("Not booked (optional)")}</p><Link href="/student/mentors" className="btn-outline btn-sm mt-2 inline-flex">{t("Book a 1-hour mentor session")}</Link></>
          : isGuest ? <><p className="text-muted">{t("Mentor sessions require an account and CareerNest Pro.")}</p><Link href="/register" className="btn-outline btn-sm mt-2 inline-flex">{t("Create an account")}</Link></>
          : <><p className="text-muted">{t("Mentor sessions are part of CareerNest Pro.")}</p><Link href="/student/pro" className="btn-outline btn-sm mt-2 inline-flex">{t("Go Pro")}</Link></>)}</div>
        <div className="card"><h2 className="mb-2 text-lg">{t("Next steps")}</h2><ol className="list-decimal pl-5">{next.map(s => <li key={s}>{t(s)}</li>)}</ol></div>
      </div>
      <div className={`card flex flex-col gap-2 ${user?.isPro ? "border-ok" : ""}`}>
        <div className="flex justify-between"><h2 className="text-lg">{t("Full report (PDF)")}</h2><span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Pro</span></div>
        {user?.isPro ? <><p className="text-sm text-muted">{t("Your personal report with results, career plan, universities, scholarships and next steps.")}</p><button className="btn-primary self-start" onClick={download}>{t("Download PDF report")}</button>{pdfStatus && <p className="text-sm text-muted" role="status" aria-live="polite">{pdfStatus}</p>}</>
          : isGuest ? <><p className="text-sm text-muted">{t("Create an account to save your plan and see CareerNest Pro.")}</p><Link href="/register" className="btn-primary self-start">{t("Create an account")}</Link></>
          : <><p className="text-sm text-muted">{t("The full PDF report is part of CareerNest Pro.")}</p><Link href="/student/pro" className="btn-primary self-start">{t("Go Pro")}</Link></>}
      </div>
    </>
  );
}
