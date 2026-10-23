import logo from "@/assets/careernest-logo.png";

/** Shared CareerNest mark and wordmark; keep their fixed dimensions consistent across the app. */
export default function BrandLogo() {
  return (
    <span className="flex shrink-0 items-center gap-2.5 text-ink" aria-hidden="true">
      <img src={logo} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
      <span className="creative-brand">CareerNest<span className="text-brand">.</span></span>
    </span>
  );
}
