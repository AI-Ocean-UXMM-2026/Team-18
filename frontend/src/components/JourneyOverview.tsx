import { usePrefs } from "@/lib/prefs";

const steps = ["Career quiz", "Career matches", "Explore majors & universities", "Build your plan"] as const;

export default function JourneyOverview() {
  const { t } = usePrefs();

  return (
    <section aria-labelledby="journey-overview-title" className="rounded-2xl border border-line bg-card/70 px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="journey-overview-title" className="text-sm font-bold">{t("Your journey")}</h2>
        <p className="text-xs text-muted">{t("Four simple steps")}</p>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step} className="flex min-h-11 items-center gap-2 rounded-xl bg-soft/70 px-2.5 py-2 sm:px-3">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">{index + 1}</span>
            <span className="text-xs font-semibold leading-4 text-ink sm:text-sm">{t(step)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
