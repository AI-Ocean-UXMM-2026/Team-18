// ===========================================================================
//  retention.ts — housekeeping that runs every minute:
//    * deletes payment screenshots PROOF_RETENTION_HOURS after the decision
//      (pending / disputed proofs are always kept)
//    * expires booking requests the mentor did not answer within 24 hours
//    * expires pending requests whose slot has already started
// ===========================================================================
import { ENV } from "./env.js";
import { query } from "./db.js";

export async function sweep() {
  await query(`UPDATE payments SET proof_data = NULL
    WHERE proof_data IS NOT NULL AND status IN ('approved', 'rejected') AND decided_at < now() - make_interval(hours => $1)`, [ENV.proofRetentionHours]);
  await query(`UPDATE bookings b SET status = 'expired', responded_at = now()
    FROM mentor_slots s WHERE b.slot_id = s.id AND b.status = 'pending'
    AND (b.created_at < now() - interval '24 hours' OR s.starts_at < now())`);
}
export function startSweeper() {
  const run = () => sweep().catch(e => console.warn("[sweep]", (e as Error).message));
  setTimeout(run, 5_000);
  return setInterval(run, 60_000);
}
