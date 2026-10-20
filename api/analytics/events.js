import { createHmac } from "node:crypto";
import { normalizeBatch } from "../../server/analytics-core.js";
import { writeBatch } from "../../server/analytics-storage.js";

const recent = new Map();
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  const secret = process.env.ANALYTICS_ADMIN_KEY;
  if (!secret || !process.env.BLOB_READ_WRITE_TOKEN)
    return res.status(503).json({ error: "Collection unavailable" });
  const origins = new Set(["https://after-hours-cafe-webgl.vercel.app"]);
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== "production")
    origins.add("http://127.0.0.1:5173");
  if (
    !origins.has(req.headers.origin) ||
    !String(req.headers["content-type"]).startsWith("application/json")
  )
    return res.status(403).end();
  if (
    /bot|crawler|spider|headless|preview|facebookexternalhit/i.test(
      req.headers["user-agent"] ?? "",
    )
  )
    return res.status(204).end();
  if (Number(req.headers["content-length"]) > 24576)
    return res.status(413).end();
  const ip = createHmac("sha256", secret)
    .update(String(req.headers["x-forwarded-for"] ?? "unknown").split(",")[0])
    .digest("hex")
    .slice(0, 16);
  const now = Date.now(),
    previous = recent.get(ip);
  if (previous && now - previous < 1000) return res.status(429).end();
  if (recent.size > 2000) recent.clear();
  recent.set(ip, now);
  let batch;
  try {
    const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (JSON.stringify(raw).length > 24576) return res.status(413).end();
    batch = normalizeBatch(raw, process.env.ANALYTICS_HASH_KEY || secret, now);
  } catch {
    return res.status(400).json({ error: "Invalid batch" });
  }
  try {
    await writeBatch(batch);
    return res.status(202).json({ accepted: true });
  } catch {
    return res
      .status(503)
      .json({ error: "Collection temporarily unavailable" });
  }
}
