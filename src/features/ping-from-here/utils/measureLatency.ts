import type { LatencyResult } from "../types";

const SAMPLES = 5;
const TIMEOUT_MS = 6000;
// 4 inter-sample pauses × 200ms = 800ms overhead; keep-alive is reused for samples 2–5.
const INTER_SAMPLE_DELAY_MS = 200;

export function median(values: number[]): number {
  if (values.length === 0) throw new RangeError("median() requires at least one value");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Appends a cache-busting timestamp query param. */
export function bustCache(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_t=${Date.now()}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// noCors=false → endpoint returns 302; redirect:manual stops before the redirect,
//   producing an opaque-redirect (status 0). No CORS error, no DevTools noise.
// noCors=true  → endpoint has no ACAO header (GCP, Cloudflare); no-cors produces
//   an opaque response (status 0). No CORS error, no DevTools noise.
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
        // Soft timeout: sample lost, continue with remaining attempts.
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
