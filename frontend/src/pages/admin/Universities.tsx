// Content check: GED/IGCSE data comes from the Google Sheet; flag rows to re-check.
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, Note, PageHead, Pill, Spinner } from "@/components/ui";

type Row = { id: string; code: string; name: string; country: string; hasScholarship: boolean; ged: string; igcse: string; lastChecked: string; source: string; needsCheck: boolean };
type D = { source: string; sheetConnected: boolean; g12: { universities: number; programs: number }; schools: Row[] };
const ok = (v: string) => <Pill tone={v === "yes" ? "ok" : v === "no" ? "bad" : "warn"}>{v === "yes" ? "Accepted" : v === "no" ? "Not direct" : "Confirm"}</Pill>;
export default function Universities() {
  const { t } = usePrefs();
  const { data, loading, error, refresh } = useApiData(() => api.get<D>("/admin/universities"));
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No data"} onRetry={refresh} />;
  return (
    <>
      <PageHead eyebrow="Admin portal" title="Universities" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[["Grade 12 universities", data.g12.universities], ["Grade 12 programmes", data.g12.programs], ["GED / IGCSE universities", data.schools.length], ["With scholarships", data.schools.filter(s => s.hasScholarship).length], ["Need re-check", data.schools.filter(s => s.needsCheck).length]].map(([l, v]) => <div key={l} className="tile"><b>{v}</b><span>{t(String(l))}</span></div>)}</div>
      <Note>{data.sheetConnected ? t("GED / IGCSE data comes from your Google Sheet. Edit the sheet; the site updates within 10 minutes.") : t("Google Sheet not connected yet: using backend/data/schools.csv. Set SCHOOLS_SHEET_CSV_URL in backend/.env.")} {t("Re-check every university every 6 months. Grade 12 data is in backend/data/g12.json.")}</Note>
      <div className="table-wrap"><table>
        <thead><tr><th>{t("University")}</th><th>{t("Country")}</th><th>{t("Scholarship")}</th><th>GED</th><th>IGCSE</th><th>{t("Last checked")}</th><th /></tr></thead>
        <tbody>{data.schools.map(s => <tr key={s.id}><td><b className="font-mono text-xs text-brand">{s.code}</b> {s.name}</td><td>{s.country}</td><td>{s.hasScholarship ? <Pill tone="ok">Yes</Pill> : <Pill tone="warn">No</Pill>}</td><td>{ok(s.ged)}</td><td>{ok(s.igcse)}</td>
          <td className="font-mono text-xs">{s.lastChecked}{s.needsCheck && <> <Pill tone="warn">{t("Re-check")}</Pill></>}</td><td><a className="text-brand" href={s.source} target="_blank" rel="noreferrer">{t("Source")}</a></td></tr>)}</tbody>
      </table></div>
    </>
  );
}
