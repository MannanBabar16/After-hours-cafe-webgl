import { put, list, get } from "@vercel/blob";

// Immutable batches avoid lost updates between concurrent serverless instances.
export async function writeBatch(batch) {
  const day = new Date(batch.receivedAt).toISOString().slice(0, 10);
  const pathname = `analytics/v1/${batch.test ? "test" : "live"}/${day}/${batch.session}/${batch.batch}.json`;
  try {
    await put(pathname, JSON.stringify(batch), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 31536000,
    });
  } catch (error) {
    if (
      error?.constructor?.name !== "BlobPathnameMismatchError" &&
      !/already exists/i.test(error?.message ?? "")
    )
      throw error;
  }
}

const fileCache = new Map();
let cache = null;
export async function readBatches(test = false) {
  // Shared in warm functions; never a replacement for durable storage.
  if (cache && cache.test === test && Date.now() - cache.at < 25000)
    return cache.result;
  const files = [];
  let cursor;
  let truncated = false;
  do {
    const page = await list({
      prefix: `analytics/v1/${test ? "test" : "live"}/`,
      limit: 1000,
      cursor,
    });
    files.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
    if (files.length >= 5000 && cursor) {
      truncated = true;
      break;
    }
  } while (cursor);
  const batches = [];
  let failed = 0;
  // Read each immutable batch once per warm instance; bounded parallelism and cache size.
  for (let offset = 0; offset < files.length; offset += 12) {
    await Promise.all(
      files.slice(offset, offset + 12).map(async (file) => {
        try {
          let data = fileCache.get(file.pathname);
          if (!data) {
            const response = await get(file.pathname, { access: "private" });
            if (!response || response.statusCode !== 200)
              throw new Error("Unreadable batch");
            data = await new Response(response.stream).json();
            if (fileCache.size >= 5000)
              fileCache.delete(fileCache.keys().next().value);
            fileCache.set(file.pathname, data);
          }
          batches.push(data);
        } catch {
          failed++;
        }
      }),
    );
  }
  const result = { batches, truncated, failed, batchCount: files.length };
  cache = { test, at: Date.now(), result };
  return result;
}
