import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, Note, PageHead, Spinner, toast } from "@/components/ui";

type ContactData = { contact: { email: string; phone: string }; storageReady: boolean };
export default function Contact() {
  const { t } = usePrefs();
  const { data, loading, error, refresh } = useApiData(() => api.get<ContactData>("/admin/contact"));
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setContact(data.contact); }, [data]);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No data"} onRetry={refresh} />;

  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try { await api.put("/admin/contact", contact); toast(t("Saved")); refresh(); }
    catch (e) { toast((e as Error).message); }
    finally { setSaving(false); }
  }
  return <>
    <PageHead eyebrow="Admin portal" title="Contact details">{t("These details appear on the public Contact page.")}</PageHead>
    {!data.storageReady && <Note>{t("Contact details need a database update before they can be saved. Apply database/migrations/20261023_site_settings.sql.")}</Note>}
    <form className="card mx-auto w-full max-w-2xl space-y-4" onSubmit={save}>
      <label className="label">{t("Support email")}
        <input className="input" type="email" autoComplete="email" maxLength={254} required value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} />
      </label>
      <label className="label">{t("Support phone")}
        <input className="input" type="tel" autoComplete="tel" maxLength={40} required value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} />
      </label>
      <div className="flex justify-end"><button className="btn-primary" type="submit" disabled={saving || !data.storageReady}>{t(saving ? "Saving…" : "Save contact details")}</button></div>
    </form>
  </>;
}
