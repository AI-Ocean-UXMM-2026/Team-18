import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { PageHead, Spinner, toast } from "@/components/ui";

type P = { name: string; email: string; title: string; years: number; fields: number[]; languages: string; bio: string | null; status: string };
export default function Profile() {
  const { t } = usePrefs(); const { content } = useJourney();
  const { data, loading } = useApiData(() => api.get<{ profile: P }>("/mentor/profile"));
  const [f, setF] = useState({ languages: "", bio: "" });
  useEffect(() => { if (data) setF({ languages: data.profile.languages, bio: data.profile.bio ?? "" }); }, [data]);
  if (loading || !data) return <Spinner />;
  const p = data.profile;
  async function save() { try { await api.put("/mentor/profile", f); toast(t("Saved")); } catch (e) { toast((e as Error).message); } }
  return (
    <>
      <PageHead eyebrow="Mentor portal" title="Profile" />
      <section className="card grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
        <b className="text-muted">{t("Name")}</b><span>{p.name}</span><b className="text-muted">{t("Email")}</b><span>{p.email}</span>
        <b className="text-muted">{t("Job title")}</b><span>{p.title}</span><b className="text-muted">{t("Experience")}</b><span>{p.years} {t("years")}</span>
        <b className="text-muted">{t("Fields")}</b><span>{p.fields.map(x => content?.fields[x]).join(", ")}</span>
        <p className="text-xs text-muted sm:col-span-2">{t("Job title and fields are changed by the CareerNet team.")}</p>
      </section>
      <section className="card flex flex-col gap-3">
        <label className="label">{t("Languages")}<input className="input" value={f.languages} onChange={e => setF({ ...f, languages: e.target.value })} /></label>
        <label className="label">{t("Short bio")}<textarea className="input" rows={4} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} /></label>
        <button className="btn-primary self-start" onClick={save}>{t("Save")}</button>
      </section>
    </>
  );
}
