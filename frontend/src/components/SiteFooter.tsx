import { Link } from "wouter";
import { usePrefs } from "@/lib/prefs";

export default function SiteFooter() {
  const { t } = usePrefs();
  return <footer className="mt-auto border-t border-line bg-card">
    <div className="mx-auto grid w-full max-w-[1440px] gap-5 px-4 pb-24 pt-7 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
      <div><p className="text-lg font-bold text-ink">CareerNest<span className="text-brand">.</span></p><p className="mt-1 text-sm text-muted">{t("Career guidance for students in Myanmar")}</p><p className="mt-3 text-xs text-muted">© {new Date().getFullYear()} CareerNest. {t("All rights reserved.")}</p></div>
      <div>
        <nav aria-label={t("Footer navigation")} className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-muted">
          {[["/about", "About Us"], ["/contact", "Contact"], ["/privacy", "Privacy Policy"], ["/guide", "Guide"]].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center hover:text-brand">{t(label)}</Link>)}
        </nav>
        <nav aria-label={t("Portals")} className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted">
          <Link href="/mentor/apply" className="inline-flex min-h-11 items-center hover:text-brand">{t("Apply to become a mentor")}</Link>
          <Link href="/mentor/login" className="inline-flex min-h-11 items-center hover:text-brand">{t("Mentor sign in")}</Link>
          <Link href="/admin/login" className="inline-flex min-h-11 items-center hover:text-brand">{t("Admin sign in")}</Link>
        </nav>
      </div>
    </div>
  </footer>;
}
