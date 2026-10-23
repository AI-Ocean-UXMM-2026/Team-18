/** Shared CareerNest mark and wordmark; keep their fixed dimensions consistent across the app. */
export default function BrandLogo() {
  return (
    <span className="flex shrink-0 items-center gap-2.5 text-ink" aria-hidden="true">
      <span className="creative-logo grid aspect-square h-9 w-9 shrink-0 place-items-center rounded-xl text-lg">✦</span>
      <span className="creative-brand">CareerNest<span className="text-brand">.</span></span>
    </span>
  );
}
