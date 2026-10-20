import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { normalizeBatch, aggregate, authorized } from "./analytics-core.js";
const now = Date.parse("2026-10-20T12:00:00Z"),
  secret = "a-strong-owner-key-with-over-24-characters";
function raw(events, test = false) {
  const session = randomUUID();
  return {
    v: 1,
    visitor: randomUUID(),
    session,
    batch: randomUUID(),
    test,
    meta: {
      device: "desktop",
      browser: "Chrome",
      referrer: "linkedin.com",
      email: "do-not-store@example.com",
    },
    events: events.map((e, i) => ({
      id: `${session}:${i + 1}`,
      at: now - 1000,
      ...e,
    })),
  };
}
const options = { from: "2026-10-20", to: "2026-10-20", now };
describe("private analytics integrity", () => {
  it("accepts only exact owner credentials and fails closed without configuration", () => {
    expect(authorized(`Bearer ${secret}`, secret)).toBe(true);
    expect(authorized(`Bearer ${secret}x`, secret)).toBe(false);
    expect(authorized(undefined, secret)).toBe(false);
    expect(authorized("Bearer ", undefined)).toBe(false);
  });
  it("hashes browser identities and discards private/unknown fields", () => {
    const input = raw([
      {
        type: "feature_use",
        label: "private-name",
        email: "secret@example.com",
      },
    ]);
    const batch = normalizeBatch(input, secret, now);
    expect(batch.visitor).not.toBe(input.visitor);
    expect(JSON.stringify(batch)).not.toMatch(/private-name|example.com|email/);
    expect(batch.meta).toEqual({
      device: "desktop",
      browser: "Chrome",
      referrer: "linkedin.com",
    });
  });
  it("rejects forged event IDs, stale timestamps, oversized lists and unknown events", () => {
    for (const patch of [
      { type: "unknown" },
      { id: "anything" },
      { at: now + 120000 },
      { at: now - 86400001 },
    ])
      expect(() =>
        normalizeBatch(raw([{ type: "page_view", ...patch }]), secret, now),
      ).toThrow();
    expect(() =>
      normalizeBatch(
        raw(Array.from({ length: 121 }, () => ({ type: "page_view" }))),
        secret,
        now,
      ),
    ).toThrow();
  });
  it("deduplicates retried event IDs even across different batches and separates QA", () => {
    const input = raw([
      { type: "page_view" },
      { type: "game_start" },
      { type: "heartbeat", value: 60 },
      { type: "coffee_brewed", label: "latte" },
      { type: "order_served", label: "drive", value: 4.5 },
    ]);
    const batch = normalizeBatch(input, secret, now),
      duplicate = { ...batch, batch: randomUUID() };
    const test = normalizeBatch(
      raw([{ type: "page_view" }], true),
      secret,
      now,
    );
    const result = aggregate([batch, duplicate, test], options);
    expect(result.totals).toMatchObject({
      visitors: 1,
      visits: 1,
      players: 1,
      coffees: 1,
      orders: 1,
      activeSeconds: 60,
      inGameRevenue: 4.5,
    });
    expect(
      aggregate([batch, test], { ...options, test: true }).totals.visits,
    ).toBe(1);
  });
  it("counts reloads as visits but one browser, sums non-overlapping active intervals and handles ranges", () => {
    const a = raw([
      { type: "page_view" },
      { type: "game_start" },
      { type: "heartbeat", value: 20 },
      { type: "heartbeat", value: 40 },
    ]);
    const b = { ...raw([{ type: "page_view" }]), visitor: a.visitor };
    const result = aggregate(
      [normalizeBatch(a, secret, now), normalizeBatch(b, secret, now)],
      options,
    );
    expect(result.totals).toMatchObject({
      visits: 2,
      visitors: 1,
      players: 1,
      returningVisitors: 1,
      averagePlaySeconds: 60,
    });
    expect(result.daily[0]).toMatchObject({
      visits: 2,
      visitors: 1,
      players: 1,
      activeSeconds: 60,
    });
    expect(
      aggregate([normalizeBatch(a, secret, now)], {
        ...options,
        from: "2026-10-19",
        to: "2026-10-19",
      }).totals.visits,
    ).toBe(0);
  });
});

vi.mock("./analytics-storage.js", () => ({
  readBatches: vi.fn(),
  writeBatch: vi.fn(),
}));
import statsHandler from "../api/analytics/stats.js";
import eventsHandler from "../api/analytics/events.js";
import { readBatches, writeBatch } from "./analytics-storage.js";
function response() {
  return {
    code: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.code = n;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
    end() {
      return this;
    },
  };
}
describe("analytics endpoint boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANALYTICS_ADMIN_KEY = secret;
    process.env.BLOB_READ_WRITE_TOKEN = "test-only";
  });
  it("never touches storage for unauthenticated stats requests", async () => {
    const res = response();
    await statsHandler({ method: "GET", headers: {}, query: {} }, res);
    expect(res.code).toBe(401);
    expect(readBatches).not.toHaveBeenCalled();
    expect(res.headers["Cache-Control"]).toBe("private, no-store");
  });
  it("reports backend failures rather than invented zero totals", async () => {
    readBatches.mockRejectedValueOnce(new Error("offline"));
    const res = response();
    await statsHandler(
      {
        method: "GET",
        headers: { authorization: `Bearer ${secret}` },
        query: {},
      },
      res,
    );
    expect(res.code).toBe(503);
    expect(res.data.totals).toBeUndefined();
  });
  it("rejects cross-origin writes before storing anything", async () => {
    const res = response();
    await eventsHandler(
      {
        method: "POST",
        headers: {
          origin: "https://elsewhere.test",
          "content-type": "application/json",
        },
        body: raw([{ type: "page_view" }]),
      },
      res,
    );
    expect(res.code).toBe(403);
    expect(writeBatch).not.toHaveBeenCalled();
  });
  it("accepts validated writes and exposes incompleteness explicitly", async () => {
    writeBatch.mockResolvedValueOnce(undefined);
    const res = response();
    const input = raw([{ type: "page_view", at: Date.now() }]);
    await eventsHandler(
      {
        method: "POST",
        headers: {
          origin: "https://after-hours-cafe-webgl.vercel.app",
          "content-type": "application/json",
          "x-forwarded-for": "198.51.100.7",
        },
        body: input,
      },
      res,
    );
    expect(res.code).toBe(202);
    expect(writeBatch).toHaveBeenCalledOnce();
    readBatches.mockResolvedValueOnce({
      batches: [],
      truncated: true,
      failed: 1,
      batchCount: 5000,
    });
    const stats = response();
    await statsHandler(
      {
        method: "GET",
        headers: { authorization: `Bearer ${secret}` },
        query: {},
      },
      stats,
    );
    expect(stats.code).toBe(200);
    expect(stats.data.quality.partial).toBe(true);
  });
});
