import type { LatencyResult } from "../types";

const SAMPLES = 5;
const TIMEOUT_MS = 6000;
// 200ms between samples lets the connection cool slightly without adding much wall time
// (5 samples x 200ms = 1s overhead per region, all regions run in parallel).
const INTER_SAMPLE_DELAY_MS = 200;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fires a single GET and returns the round-trip time in milliseconds.
 *
 * no-cors: endpoint has no ACAO header (GCP, Cloudflare). Browser returns an opaque
 * response (status 0). Chrome logs nothing to the DevTools console.
 *
 * default cors + redirect:manual: endpoint returns 302 (AWS STS). Browser stops before
 * following the redirect and returns an opaque-redirect response (status 0).
 * CORS check is skipped. Chrome logs nothing.
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
      ...(noCors ? { mode: "no-cors" as const } : { redirect: "manual" as const }),
      cache: "no-store",
      signal: controller.signal,
    });
    return performance.now() - t0;
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * Measures latency to a single endpoint by collecting `samples` GET requests
 * and returning the median round-trip time.
 *
 * Samples run sequentially within a region so TCP keep-alive is reused for
 * samples 2-N, isolating HTTP overhead from connection setup. The cold-start
 * bias of sample 1 is absorbed by the median.
 *
 * A hard network error (TypeError) aborts immediately; retrying is unlikely
 * to help and would only delay the UI showing an error for that row.
 *
 * Timeouts (AbortError) are treated as lost samples; measurement continues
 * unless fewer than half the samples succeed.
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
        // Soft timeout: sample lost, try the next one.
        continue;
      }
      return { status: "error", reason: "network" };
    }
  }

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
