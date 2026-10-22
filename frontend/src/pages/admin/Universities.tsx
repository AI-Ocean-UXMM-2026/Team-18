import { useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, Note, PageHead, Pill, Spinner, toast } from "@/components/ui";

type Accepts = "yes" | "no" | "confirm";
type Row = { id: string; code: string; name: string; country: string; hasScholarship: boolean; ged: Accepts; igcse: Accepts; lastChecked: string; source: string; needsCheck: boolean };
type D = { source: string; sheetConnected: boolean; adminAdded: number; g12: { universities: number; programs: number }; schools: Row[] };
type Form = {
  code: string; name: string; country: string; city: string; type: string; mode: string; established: string;
  ged: Accepts; gedNote: string; gedTests: string; igcse: Accepts; igcseNote: string;
  hasScholarship: boolean; scholarship: string; website: string; source: string; description: string; partner: string;
  programs: string; english: string; admission: string; pathway: string; duration: string; intakes: string;
};
const blank: Form = {
  code: "", name: "", country: "", city: "", type: "University", mode: "On campus", established: "",
  ged: "confirm", gedNote: "", gedTests: "", igcse: "confirm", igcseNote: "",
  hasScholarship: false, scholarship: "", website: "", source: "", description: "", partner: "",
  programs: "", english: "", admission: "", pathway: "", duration: "", intakes: "",
};
const ok = (v: Accepts) => <Pill tone={v === "yes" ? "ok" : v === "no" ? "bad" : "warn"}>{v === "yes" ? "Accepted" : v === "no" ? "Not direct" : "Confirm"}</Pill>;

export default function Universities() {
  const { t } = usePrefs();
  const { data, loading, error, refresh } = useApiData(() => api.get<D>("/admin/universities"));
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const set = (key: keyof Form, value: string | boolean) => setForm(previous => ({ ...previous, [key]: value }));

  async function add(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      await api.post("/admin/universities", {
        code: form.code.trim(), name: form.name.trim(), country: form.country.trim(), city: form.city.trim(),
        type: form.type.trim(), mode: form.mode.trim(), established: form.established.trim(), fields: [],
        ged: { ok: form.ged, note: form.gedNote.trim(), tests: form.gedTests.trim() },
        igcse: { ok: form.igcse, note: form.igcseNote.trim() }, hasScholarship: form.hasScholarship,
        scholarship: form.scholarship.trim(), website: form.website.trim(), source: form.source.trim(),
        description: form.description.trim(), partner: form.partner.trim(),
        programs: form.programs.split(/[;\n]/).map(value => value.trim()).filter(Boolean),
        english: form.english.trim(), admission: form.admission.trim(), pathway: form.pathway.trim(),
        duration: form.duration.trim(), intakes: form.intakes.trim(),
      });
      setForm(blank); toast(t("University added")); await refresh();
    } catch (err) { setFormError((err as Error).message); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No university data"} onRetry={refresh} />;
  const input = (key: keyof Form) => ({ value: form[key] as string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value) });
  const textarea = (key: keyof Form, rows = 2) => <textarea className="input min-h-20" rows={rows} value={form[key] as string} onChange={e => set(key, e.target.value)} />;
  const acceptance = (key: "ged" | "igcse") => <select className="input" value={form[key]} onChange={e => set(key, e.target.value as Accepts)}><option value="yes">Accepted</option><option value="confirm">Confirm</option><option value="no">Not direct</option></select>;

  return (
    <>
      <PageHead eyebrow="Admin portal" title="Universities" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[["Grade 12 universities", data.g12.universities], ["Grade 12 programmes", data.g12.programs], ["GED / IGCSE universities", data.schools.length], ["With scholarships", data.schools.filter(s => s.hasScholarship).length], ["Need re-check", data.schools.filter(s => s.needsCheck).length]].map(([label, value]) => <div key={label} className="tile"><b>{value}</b><span>{t(String(label))}</span></div>)}</div>
      <Note>{data.sheetConnected ? t("Imported GED / IGCSE entries still sync from the Google Sheet.") : t("Imported GED / IGCSE entries use the local CSV file.")} {t("Universities added here are saved in CareerNet and appear alongside imported entries. No Google Sheet is needed to add one.")} {t("Re-check every university every 6 months. Grade 12 data remains in backend/data/g12.json.")}</Note>

      <section className="card flex flex-col gap-4">
        <div><h2 className="text-lg">{t("Add a university directly")}</h2><p className="text-sm text-muted">{t("Save a GED / IGCSE university in CareerNet for students to explore and compare.")}</p></div>
        <form className="flex flex-col gap-4" onSubmit={add}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="label">{t("Code")}<input className="input font-mono" required maxLength={20} pattern="[A-Za-z0-9-]+" placeholder="e.g. abc" {...input("code")} /></label>
            <label className="label sm:col-span-2">{t("University")}<input className="input" required maxLength={180} {...input("name")} /></label>
            <label className="label">{t("Country")}<input className="input" required maxLength={100} {...input("country")} /></label>
            <label className="label">{t("City")}<input className="input" maxLength={120} {...input("city")} /></label>
            <label className="label">{t("GED acceptance")}{acceptance("ged")}</label>
            <label className="label">{t("IGCSE acceptance")}{acceptance("igcse")}</label>
            <label className="label flex-row items-center gap-2"><input type="checkbox" checked={form.hasScholarship} onChange={e => set("hasScholarship", e.target.checked)} />{t("Scholarship available")}</label>
            <label className="label sm:col-span-2">{t("GED requirements")}{textarea("gedNote")}</label>
            <label className="label sm:col-span-2">{t("IGCSE requirements")}{textarea("igcseNote")}</label>
            <label className="label sm:col-span-2">{t("Scholarship details")}{textarea("scholarship")}</label>
            <label className="label sm:col-span-2">{t("Programmes (one per line)")}{textarea("programs", 3)}</label>
          </div>

          <details className="rounded-xl border border-line p-3">
            <summary className="cursor-pointer font-semibold">{t("More student-facing details (optional)")}</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="label">{t("University type")}<input className="input" maxLength={120} {...input("type")} /></label>
              <label className="label">{t("Study mode")}<input className="input" maxLength={80} {...input("mode")} /></label>
              <label className="label">{t("Established")}<input className="input" maxLength={20} {...input("established")} /></label>
              <label className="label">{t("Degree / partner")}<input className="input" maxLength={300} {...input("partner")} /></label>
              <label className="label">{t("English requirement")}<input className="input" maxLength={500} {...input("english")} /></label>
              <label className="label">{t("Duration")}<input className="input" maxLength={100} {...input("duration")} /></label>
              <label className="label">{t("Intakes")}<input className="input" maxLength={500} {...input("intakes")} /></label>
              <label className="label">{t("Website")}<input className="input" type="url" maxLength={500} {...input("website")} /></label>
              <label className="label">{t("Source link")}<input className="input" type="url" maxLength={500} {...input("source")} /></label>
              <label className="label sm:col-span-2">{t("Description")}{textarea("description", 3)}</label>
              <label className="label sm:col-span-2">{t("Admission process")}{textarea("admission", 3)}</label>
              <label className="label sm:col-span-2">{t("Pathway")}{textarea("pathway")}</label>
            </div>
          </details>
          {formError && <p className="text-sm font-semibold text-bad">{formError}</p>}
          <div><button className="btn-primary" disabled={saving}>{saving ? t("Saving…") : t("Add university")}</button></div>
        </form>
      </section>

      <div className="table-wrap"><table>
        <thead><tr><th>{t("University")}</th><th>{t("Country")}</th><th>{t("Scholarship")}</th><th>GED</th><th>IGCSE</th><th>{t("Last checked")}</th><th>{t("Source")}</th></tr></thead>
        <tbody>{data.schools.map(s => <tr key={s.id}><td><b className="font-mono text-xs text-brand">{s.code}</b> {s.name}</td><td>{s.country}</td><td>{s.hasScholarship ? <Pill tone="ok">Yes</Pill> : <Pill tone="warn">No</Pill>}</td><td>{ok(s.ged)}</td><td>{ok(s.igcse)}</td>
          <td className="font-mono text-xs">{s.lastChecked}{s.needsCheck && <> <Pill tone="warn">{t("Re-check")}</Pill></>}</td><td>{s.source ? <a className="text-brand" href={s.source} target="_blank" rel="noreferrer">{t("Source")}</a> : <span className="text-muted">{t("Added in CareerNet")}</span>}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}
