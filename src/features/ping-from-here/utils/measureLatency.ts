import type { LatencyResult } from "../types";

const SAMPLES = 5;
const TIMEOUT_MS = 6000;
// Short delay between samples so TCP keep-alive isn't the only thing we measure.
// 200ms is enough to let the connection cool slightly without materially slowing
// down the overall page load (5 samples × 200ms = 1s overhead per region, all in
// parallel across regions so total wall time is still bounded by the slowest region).
const INTER_SAMPLE_DELAY_MS = 200;

// ── Pure helpers (no browser globals, fully unit-testable) ───────────────────

export function median(values: number[]): number {
  if (values.length === 0) throw new RangeError("median() requires at least one value");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Appends a timestamp query param to defeat CDN/proxy caches. */
export function bustCache(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_t=${Date.now()}`;
}

// ── Browser-side helpers ─────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fires a single GET request and returns the round-trip time in milliseconds.
 *
 * mode: no-cors + redirect: manual → browser returns an opaque (or opaque-redirect)
 * response with status 0. The actual HTTP status is never exposed to JavaScript,
 * so Chrome never logs a "404 (Not Found)" error to the DevTools Console.
 *
 * Throws:
 *  - DOMException (AbortError) if the timeout fires before the response arrives
 *  - TypeError on hard network failure
 */
async function takeSample(
  url: string,
  timeoutMs: number,
  noCors: boolean
): Promise<number> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    await fetch(url, {
      method: "GET",
      // no-cors: endpoint returns 200 without ACAO header (GCP, Cloudflare).
      //   Browser returns opaque response (status 0) — Chrome logs nothing.
      // default cors + redirect:manual: endpoint returns 302 (AWS STS).
      //   Browser stops at the redirect and returns opaque-redirect (status 0) —
      //   CORS check is skipped, Chrome logs nothing.
      ...(noCors ? { mode: "no-cors" as const } : { redirect: "manual" as const }),
      cache: "no-store",
      signal: controller.signal,
    });
    return performance.now() - t0;
  } finally {
    clearTimeout(timerId);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Measures latency to a single endpoint by collecting `samples` GET requests
 * and returning the median round-trip time.
 *
 * Design notes:
 * - All samples run sequentially within a single region so that TCP keep-alive
 *   is reused for samples 2-N, isolating HTTP overhead from connection setup.
 *   The cold-start bias of sample 1 is absorbed by the median.
 * - The caller is expected to run measureLatency() for all regions concurrently
 *   (Promise.all / Promise.allSettled) so total wall time ≈ slowest region.
 * - A hard network error (TypeError) aborts immediately — retrying is unlikely
 *   to help and would only delay the UI showing an error state for that row.
 * - Timeouts (AbortError) are treated as lost samples; we keep going unless
 *   fewer than half the samples succeed.
 */
export async function measureLatency(
  endpointUrl: string,
  {
    samples = SAMPLES,
    timeoutMs = TIMEOUT_MS,
    noCors = false,
  }: {
    samples?: number;
    timeoutMs?: number;
    noCors?: boolean;
  } = {}
): Promise<LatencyResult> {
  const collected: number[] = [];

  for (let i = 0; i < samples; i++) {
    if (i > 0) await sleep(INTER_SAMPLE_DELAY_MS);

    try {
      collected.push(await takeSample(bustCache(endpointUrl), timeoutMs, noCors));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Soft timeout — this sample is lost, try the next one.
        continue;
      }
      // Hard error (network failure): further retries won't help.
      return { status: "error", reason: "network" };
    }
  }

  // Require at least half the requested samples to produce a reliable median.
  const minRequired = Math.ceil(samples / 2);
  if (collected.length < minRequired) {
    return {
      status: "error",
      reason: collected.length === 0 ? "network" : "timeout",
    };
  }

  return {
    status: "success",
    medianMs: Math.round(median(collected)),
    samples: collected.map(Math.round),
  };
}
