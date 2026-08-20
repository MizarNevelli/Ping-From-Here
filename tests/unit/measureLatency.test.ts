import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { measureLatency, median, bustCache } from "@/features/ping-from-here/utils/measureLatency";

// ── median ────────────────────────────────────────────────────────────────────

describe("median", () => {
  test("single value returns itself", () => {
    expect(median([42])).toBe(42);
  });

  test("odd-length array returns the true middle element", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  test("even-length array returns average of two middle values", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  test("already-sorted input is not mutated or miscomputed", () => {
    const input = [10, 20, 30, 40, 50];
    const result = median(input);
    expect(result).toBe(30);
    // original array must not be sorted in place
    expect(input).toEqual([10, 20, 30, 40, 50]);
  });

  test("identical values return that value", () => {
    expect(median([7, 7, 7, 7])).toBe(7);
  });

  test("throws RangeError on empty array", () => {
    expect(() => median([])).toThrow(RangeError);
  });
});

// ── bustCache ─────────────────────────────────────────────────────────────────

describe("bustCache", () => {
  test("appends ?_t= to a clean URL", () => {
    const result = bustCache("https://example.com");
    expect(result).toMatch(/^https:\/\/example\.com\?_t=\d+$/);
  });

  test("uses & separator when query string already present", () => {
    const result = bustCache("https://speed.cloudflare.com/__down?bytes=0");
    expect(result).toMatch(/\?bytes=0&_t=\d+$/);
  });

  test("embeds a current Unix timestamp (not a stale one)", () => {
    const before = Date.now();
    const url = bustCache("https://example.com");
    const ts = Number(new URL(url).searchParams.get("_t"));
    expect(ts).toBeGreaterThanOrEqual(before);
    // Sanity-check: not in the future by more than 50ms
    expect(ts).toBeLessThanOrEqual(Date.now() + 50);
  });
});

// ── measureLatency ────────────────────────────────────────────────────────────

describe("measureLatency", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /**
   * Controls what performance.now() returns for each successive call.
   * measureLatency() calls it twice per sample: once before fetch (t0) and
   * once after (t1). Elapsed = t1 - t0.
   */
  function mockPerformanceNow(samplesMs: number[]) {
    const readings = samplesMs.flatMap((ms) => [0, ms]);
    let idx = 0;
    vi.spyOn(performance, "now").mockImplementation(() => readings[idx++] ?? 0);
  }

  function stubFetch(impl: () => Promise<Response>) {
    vi.stubGlobal("fetch", vi.fn(impl));
  }

  // ── Happy path ──────────────────────────────────────────────────────────────

  test("returns the median of all 5 samples on a clean run", async () => {
    // [45, 42, 48, 46, 44] sorted → [42, 44, 45, 46, 48] → median = 45
    mockPerformanceNow([45, 42, 48, 46, 44]);
    stubFetch(() => Promise.resolve(new Response(null, { status: 200 })));

    const promise = measureLatency("https://example.com");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({
      status: "success",
      medianMs: 45,
      samples: [45, 42, 48, 46, 44],
    });
  });

  test("rounds fractional milliseconds to integers", async () => {
    mockPerformanceNow([10.4, 10.6, 10.5, 10.8, 10.3]);
    stubFetch(() => Promise.resolve(new Response(null, { status: 200 })));

    const promise = measureLatency("https://example.com");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(Number.isInteger(result.medianMs)).toBe(true);
      result.samples.forEach((s) => expect(Number.isInteger(s)).toBe(true));
    }
  });

  // ── Hard network error ──────────────────────────────────────────────────────

  test("aborts immediately on a hard network error — no retries", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    mockPerformanceNow([]);

    const promise = measureLatency("https://example.com");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ status: "error", reason: "network" });
    // Critical: we called fetch exactly once, not 5 times
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // ── Soft timeout (AbortError) ───────────────────────────────────────────────

  test("treats AbortError as a soft timeout and continues with remaining samples", async () => {
    // First sample times out; samples 2–5 succeed at 40ms each
    const timeout = new DOMException("The user aborted a request.", "AbortError");
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(timeout)
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    // Only 4 timing pairs (samples 2–5 each return 40ms; sample 1 threw before t1 was read)
    mockPerformanceNow([0, 40, 40, 40, 40]);

    const promise = measureLatency("https://example.com");
    await vi.runAllTimersAsync();
    const result = await promise;

    // 4 successful samples is still ≥ ceil(5/2)=3, so we get a result
    expect(result.status).toBe("success");
    // All 5 fetch calls were still attempted
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  test("returns timeout error when fewer than ceil(samples/2) samples succeed", async () => {
    // 4 timeouts, 1 success → only 1 sample collected, need 3 → error
    const timeout = new DOMException("Aborted", "AbortError");
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(timeout)
      .mockRejectedValueOnce(timeout)
      .mockRejectedValueOnce(timeout)
      .mockRejectedValueOnce(timeout)
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    mockPerformanceNow([50]);

    const promise = measureLatency("https://example.com");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ status: "error", reason: "timeout" });
  });

  test("returns network error when all samples timeout (zero collected)", async () => {
    const timeout = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeout));
    mockPerformanceNow([]);

    const promise = measureLatency("https://example.com");
    await vi.runAllTimersAsync();
    const result = await promise;

    // Zero collected → falls into the "network" bucket (not "timeout")
    expect(result).toEqual({ status: "error", reason: "network" });
  });

  // ── Custom sample count ─────────────────────────────────────────────────────

  test("respects a custom sample count", async () => {
    mockPerformanceNow([10, 12, 11]); // 3 samples
    stubFetch(() => Promise.resolve(new Response(null, { status: 200 })));

    const promise = measureLatency("https://example.com", { samples: 3 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.samples).toHaveLength(3);
    }
  });

  // ── Fetch options ────────────────────────────────────────────────────────────

  test("uses redirect: manual so 3xx responses become opaque-redirect (status 0) — no console errors", async () => {
    mockPerformanceNow([50, 50, 50, 50, 50]);
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const promise = measureLatency("https://example.com");
    await vi.runAllTimersAsync();
    await promise;

    for (const call of fetchMock.mock.calls) {
      expect(call[1]).toMatchObject({ redirect: "manual" });
    }
  });
});
