import { Link } from "wouter";
import { usePrefs } from "@/lib/prefs";
export default function NotFound() {
  const { t } = usePrefs();
  return <section className="card mx-auto flex max-w-md flex-col items-center gap-3 text-center"><h1 className="text-2xl">{t("Page not found")}</h1><Link href="/" className="btn-primary">{t("Go home")}</Link></section>;
}
