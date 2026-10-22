import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { usePrefs } from "@/lib/prefs";
import { Note, PageHead, Pill, Spinner } from "@/components/ui";

type D = { careers: { id: string; title: string; majors: string[]; videoLength: string; hasVideo: boolean }[]; questions: number };
export default function Content() {
  const { t } = usePrefs();
  const { data, loading } = useApiData(() => api.get<D>("/admin/content"));
  if (loading || !data) return <Spinner />;
  return (
    <>
      <PageHead eyebrow="Admin portal" title="Content" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{[["Careers", data.careers.length], ["Quiz questions", data.questions], ["Short movies uploaded", data.careers.filter(c => c.hasVideo).length]].map(([l, v]) => <div key={l} className="tile"><b>{v}</b><span>{t(String(l))}</span></div>)}</div>
      <Note>{t("Careers, majors and short-movie links are in backend/data/careers.json (video.url). Quiz questions and Myanmar translations are in backend/data/questions.json. Screen text translations are in frontend/src/lib/i18n.ts.")}</Note>
      <div className="table-wrap"><table>
        <thead><tr><th>{t("Career")}</th><th>{t("Majors")}</th><th>{t("Short movie")}</th></tr></thead>
        <tbody>{data.careers.map(c => <tr key={c.id}><td><b>{c.title}</b></td><td className="text-xs">{c.majors.join(", ")}</td><td>{c.hasVideo ? <Pill tone="ok">{t("Uploaded")}</Pill> : <Pill tone="warn">{t("Video link needed")}</Pill>} <span className="font-mono text-xs">{c.videoLength}</span></td></tr>)}</tbody>
      </table></div>
    </>
  );
}
