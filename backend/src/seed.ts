// ===========================================================================
//  seed.ts — demo accounts so the three portals work on first start.
//  Runs on startup when SEED_ON_START=true (also: npm run seed).
//  Every seeded account uses SEED_PASSWORD. Turn seeding off and change the
//  passwords before real students use the site.
// ===========================================================================
import { pathToFileURL } from "node:url";
import { ENV } from "./env.js";
import { hashPassword } from "./auth.js";
import { closeDatabase, one, query } from "./db.js";

const ADMINS = [
  { email: "super@careernet.local", name: "Super admin", adminRole: "super" },
  { email: "ops@careernet.local", name: "Operations admin", adminRole: "ops" },
  { email: "content@careernet.local", name: "Content editor", adminRole: "content" },
];
const MENTORS = [
  { email: "hnin@mentor.careernet.local", name: "Daw Hnin Ei Phyu", title: "Senior Software Engineer, fintech", years: 9, fields: [1] },
  { email: "kyawzin@mentor.careernet.local", name: "U Kyaw Zin Htet", title: "Data Analytics Lead, telecom", years: 7, fields: [1, 6, 4] },
  { email: "aungmin@mentor.careernet.local", name: "U Aung Min Thant", title: "Structural Engineer", years: 12, fields: [2] },
  { email: "thiri@mentor.careernet.local", name: "Dr. Thiri Aung", title: "Physician, internal medicine", years: 10, fields: [3, 5] },
  { email: "maythu@mentor.careernet.local", name: "Daw May Thu Kyaw", title: "Chartered Accountant (ACCA)", years: 8, fields: [4] },
  { email: "zawlin@mentor.careernet.local", name: "U Zaw Lin Oo", title: "Chief Engineer, merchant navy", years: 15, fields: [11, 2] },
  { email: "eimon@mentor.careernet.local", name: "Daw Ei Mon Kyaw", title: "Teacher trainer & linguist", years: 11, fields: [7, 10, 8] },
  { email: "htetnaing@mentor.careernet.local", name: "U Htet Naing", title: "Product (UX) Designer", years: 6, fields: [8, 1, 9] },
];
export const DEMO_STUDENT = { email: "student@careernet.local", name: "Demo Student (Normal)", isPro: false };
export const DEMO_PRO_STUDENT = { email: "pro@careernet.local", name: "Demo Student (Pro)", isPro: true };

// A complete starter profile makes Results, the AI coach, and the Pro PDF
// available immediately after signing in. Keep existing demo progress intact.
const DEMO_JOURNEY = {
  level: "g12",
  answers: { "0": 5, "1": 3, "2": 3, "3": 3, "4": 4, "5": 5, "6": 5, "7": 3, "8": 3, "9": 3, "10": 5, "11": 5, "12": 4, "13": 3, "14": 3, "15": 4, "16": 3, "17": 5, "18": 3, "19": 5 },
  careerId: "swe",
  majors: ["Computer Science"],
  shortlist: [],
  compare: [],
  videoChoice: "skip",
  watched: {},
};

async function upsertUser(email: string, name: string, role: string, adminRole: string | null, isPro = false) {
  const found = await one<{ id: number }>("SELECT id FROM users WHERE email = $1", [email]);
  if (found) {
    await one("UPDATE users SET password_hash = $1, name = $2, role = $3, admin_role = $4, is_pro = $5, ai_used = 0, active = TRUE WHERE id = $6",
      [hashPassword(ENV.seedPassword), name, role, adminRole, isPro, found.id]);
    return found.id;
  }
  const row = await one<{ id: number }>(
    "INSERT INTO users (email, password_hash, name, role, admin_role, is_pro, ai_used) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING id",
    [email, hashPassword(ENV.seedPassword), name, role, adminRole, isPro]);
  return row!.id;
}

export async function seedDatabase() {
  for (const a of ADMINS) await upsertUser(a.email, a.name, "admin", a.adminRole);
  for (const student of [DEMO_STUDENT, DEMO_PRO_STUDENT]) {
    const id = await upsertUser(student.email, student.name, "student", null, student.isPro);
    await query("INSERT INTO journeys (student_id, data) VALUES ($1, $2) ON CONFLICT (student_id) DO NOTHING", [id, JSON.stringify(DEMO_JOURNEY)]);
  }
  for (const m of MENTORS) {
    const id = await upsertUser(m.email, m.name, "mentor", null);
    await query(`INSERT INTO mentors (user_id, title, years, fields, status) VALUES ($1, $2, $3, $4, 'active') ON CONFLICT (user_id) DO NOTHING`,
      [id, m.title, m.years, m.fields]);
    // free 1-hour slots for the next 10 days (10:00, 14:00, 17:30 Myanmar time), skipping Sundays
    const existing = await one<{ n: number }>("SELECT count(*)::int AS n FROM mentor_slots WHERE mentor_id = $1 AND starts_at > now()", [id]);
    if ((existing?.n ?? 0) === 0) {
      for (let d = 1; d <= 10; d++) {
        for (const t of ["10:00", "14:00", "17:30"]) {
          await query(`INSERT INTO mentor_slots (mentor_id, starts_at)
            SELECT $1, ((now() AT TIME ZONE 'Asia/Yangon')::date + $2::int + $3::time) AT TIME ZONE 'Asia/Yangon'
            WHERE extract(dow FROM (now() AT TIME ZONE 'Asia/Yangon')::date + $2::int) <> 0
            ON CONFLICT DO NOTHING`, [id, d, t]);
        }
      }
    }
  }
  console.log(`[seed] demo accounts ready (password: SEED_PASSWORD). Admins: ${ADMINS.map(a => a.email).join(", ")} · Mentor: ${MENTORS[0].email} · Students: ${DEMO_STUDENT.email} (normal), ${DEMO_PRO_STUDENT.email} (Pro)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  seedDatabase().then(closeDatabase).catch(e => { console.error(e); process.exit(1); });
}
