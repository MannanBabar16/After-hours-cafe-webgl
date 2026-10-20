import { aggregate, authorized } from "../../server/analytics-core.js";
import { readBatches } from "../../server/analytics-storage.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (req.method !== "GET") return res.status(405).end();
  if (!authorized(req.headers.authorization, process.env.ANALYTICS_ADMIN_KEY))
    return res.status(401).json({ error: "Owner key required" });
  const today = new Date().toISOString().slice(0, 10);
  const from = String(req.query.from ?? today),
    to = String(req.query.to ?? today);
  const valid = (s) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s;
  if (
    !valid(from) ||
    !valid(to) ||
    from > to ||
    (Date.parse(to) - Date.parse(from)) / 86400000 > 92
  )
    return res
      .status(400)
      .json({ error: "Choose a valid range of up to 93 days" });
  try {
    const test = req.query.test === "1";
    const result = await readBatches(test);
    const data = aggregate(result.batches, { from, to, test });
    return res
      .status(200)
      .json({
        ...data,
        quality: {
          partial: result.truncated || result.failed > 0,
          unreadableBatches: result.failed,
          batchCount: result.batchCount,
          note: result.truncated
            ? "Scan limit reached (5,000 batches). Export/archive storage before treating these as totals."
            : result.failed
              ? "Some records could not be read. These totals are incomplete."
              : null,
        },
      });
  } catch {
    return res
      .status(503)
      .json({
        error: "Stats temporarily unavailable. Your game is unaffected.",
      });
  }
}
