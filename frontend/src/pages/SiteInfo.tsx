import { useEffect } from "react";
import { Link } from "wouter";
import { usePrefs } from "@/lib/prefs";

export default function SiteInfo({ page }: { page: "about" | "contact" | "privacy" }) {
  const { lang, t } = usePrefs();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, [page]);
  const text = (en: string, my: string) => lang === "my" ? my : en;
  const title = page === "about" ? "About Us" : page === "contact" ? "Contact" : "Privacy Policy";
  return <article className="card mx-auto w-full max-w-3xl space-y-6">
    <header><p className="eyebrow">CareerNest</p><h1 className="mt-2 text-3xl">{t(title)}</h1></header>
    {page === "about" && <>
      <p className="leading-7 text-muted">{text("CareerNest helps students in Myanmar explore careers, choose majors, and compare universities based on their education level and interests.", "CareerNest သည် မြန်မာကျောင်းသားများအား ပညာရေးအဆင့်နှင့် စိတ်ဝင်စားမှုအလိုက် အသက်မွေးဝမ်းကျောင်း၊ အဓိကဘာသာရပ်နှင့် တက္ကသိုလ်များကို ရှာဖွေနှိုင်းယှဉ်ရန် ကူညီပေးသည်။")}</p>
      <p className="leading-7 text-muted">{text("Start with the career quiz, inspect your matches, optionally watch career videos, then explore degree pathways and universities. Pro adds AI guidance, PDF reports, and access to mentor sessions.", "အသက်မွေးဝမ်းကျောင်း စစ်တမ်းမှ စတင်ပြီး ရလဒ်များ၊ ရွေးချယ်နိုင်သော ဗီဒီယိုများ၊ ဘာသာရပ်နှင့် တက္ကသိုလ်များကို လေ့လာနိုင်သည်။ Pro တွင် AI လမ်းညွှန်မှု၊ PDF အစီရင်ခံစာနှင့် mentor ချိန်းဆိုမှုများ ပါဝင်သည်။")}</p>
      <p className="rounded-xl bg-soft p-4 text-sm leading-6">{text("Results are a starting point for exploration. Confirm admissions, fees, and scholarship information directly with each university.", "ရလဒ်များသည် လေ့လာမှုစတင်ရန် အထောက်အကူသာ ဖြစ်သည်။ ဝင်ခွင့်၊ ကျောင်းလခနှင့် ပညာသင်ဆု အချက်အလက်များကို သက်ဆိုင်ရာ တက္ကသိုလ်ထံ အတည်ပြုပါ။")}</p>
    </>}
    {page === "contact" && <>
      <p className="leading-7 text-muted">{text("For project questions, technical problems, or feedback, visit the CareerNest project repository and use its Issues section when available.", "စီမံကိန်းဆိုင်ရာ မေးခွန်း၊ နည်းပညာပြဿနာ သို့မဟုတ် အကြံပြုချက်အတွက် CareerNest repository ၏ Issues ကဏ္ဍကို အသုံးပြုနိုင်သည်။")}</p>
      <a className="btn-primary inline-flex" href="https://github.com/AI-Ocean-UXMM-2026/Team-18" target="_blank" rel="noreferrer">{text("CareerNest on GitHub", "GitHub ရှိ CareerNest")}</a>
      <p className="text-sm leading-6 text-muted">{text("Include the page and steps that caused the problem. Public issues should not contain passwords, payment screenshots, or private account details. Check your payment status inside the Pro page.", "ပြဿနာဖြစ်သော စာမျက်နှာနှင့် အဆင့်များကို ဖော်ပြပါ။ အများမြင်နိုင်သော Issues တွင် စကားဝှက်၊ ငွေပေးချေမှု screenshot နှင့် ကိုယ်ရေးအချက်အလက်များ မထည့်ပါနှင့်။ ငွေပေးချေမှုအခြေအနေကို Pro စာမျက်နှာတွင် ကြည့်နိုင်သည်။")}</p>
    </>}
    {page === "privacy" && <div className="space-y-5 text-sm leading-7 text-muted">
      <section><h2 className="text-lg text-ink">{text("Account and journey data", "အကောင့်နှင့် လေ့လာမှုအချက်အလက်")}</h2><p>{text("CareerNest stores account details, a password hash, saved quiz answers and choices, and mentor bookings to provide the service. Guest progress is temporary until you create an account. Your browser stores your sign-in token and preferences.", "ဝန်ဆောင်မှုပေးရန် အကောင့်အချက်အလက်၊ စကားဝှက် hash၊ စစ်တမ်းအဖြေ၊ ရွေးချယ်မှုနှင့် mentor ချိန်းဆိုမှုများကို သိမ်းဆည်းသည်။ အကောင့်မဖွင့်မီ ဧည့်သည်၏တိုးတက်မှုသည် ယာယီသာဖြစ်သည်။ ဘရောက်ဇာတွင် ဝင်ရောက်မှု token နှင့် စိတ်ကြိုက်ဆက်တင်များကို သိမ်းဆည်းသည်။")}</p></section>
      <section><h2 className="text-lg text-ink">{text("Payments", "ငွေပေးချေမှု")}</h2><p>{text("Payment submissions include the amount, receiving account, and uploaded proof for admin review. Screenshot deletion is scheduled after a payment decision; the default retention period is 10 days and can be configured by the operator. Payment records remain for account administration.", "ငွေပေးချေမှုတွင် ပမာဏ၊ လက်ခံအကောင့်နှင့် အထောက်အထား screenshot ပါဝင်ပြီး admin က စစ်ဆေးသည်။ ဆုံးဖြတ်ပြီးနောက် screenshot များကို မူလအားဖြင့် ၁၀ ရက်အကြာ ဖျက်ရန် စီစဉ်ထားပြီး ဝန်ဆောင်မှုစီမံသူက အချိန်ကာလကို ပြင်ဆင်နိုင်သည်။ ငွေပေးချေမှုမှတ်တမ်းများကို အကောင့်စီမံရန် ထိန်းသိမ်းထားသည်။")}</p></section>
      <section><h2 className="text-lg text-ink">{text("AI assistance", "AI အကူအညီ")}</h2><p>{text("When you use AI features, your message and relevant career or university context are sent to the configured external AI provider. Avoid including sensitive personal information in chat.", "AI အသုံးပြုသောအခါ သင့်မက်ဆေ့ချ်နှင့် သက်ဆိုင်ရာ အသက်မွေးဝမ်းကျောင်း သို့မဟုတ် တက္ကသိုလ်အချက်အလက်ကို သတ်မှတ်ထားသော ပြင်ပ AI ဝန်ဆောင်မှုထံ ပေးပို့သည်။ chat တွင် အရေးကြီးကိုယ်ရေးအချက်အလက် မထည့်ပါနှင့်။")}</p></section>
      <section><h2 className="text-lg text-ink">{text("Your account", "သင့်အကောင့်")}</h2><p>{text("You can update your name and password in Profile & settings. Contact the project team through the Contact page for data questions or requests.", "Profile & settings တွင် အမည်နှင့် စကားဝှက်ကို ပြောင်းနိုင်သည်။ အချက်အလက်ဆိုင်ရာ မေးခွန်းနှင့် တောင်းဆိုမှုများအတွက် Contact စာမျက်နှာမှ စီမံကိန်းအဖွဲ့ကို ဆက်သွယ်နိုင်သည်။")}</p></section>
    </div>}
    <Link href="/guide" className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline">{t("Guide")} →</Link>
  </article>;
}
