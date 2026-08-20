import { describe, test, expect, vi, afterEach } from "vitest";
import { detectLocation } from "@/features/ping-from-here/utils/geolocate";

describe("detectLocation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function stubFetch(response: unknown, ok = true) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok,
        json: () => Promise.resolve(response),
      })
    );
  }

  test("parses a well-formed ipapi.co response", async () => {
    stubFetch({
      city: "Milan",
      country_name: "Italy",
      country_code: "IT",
      latitude: 45.46,
      longitude: 9.19,
      ip: "1.2.3.4",
    });

    const result = await detectLocation();

    expect(result).toEqual({
      city: "Milan",
      country: "Italy",
      countryCode: "IT",
      latitude: 45.46,
      longitude: 9.19,
      ip: "1.2.3.4",
    });
  });

  test("returns null when response is not ok (rate-limited, server error)", async () => {
    stubFetch({}, false /* ok = false */);
    expect(await detectLocation()).toBeNull();
  });

  test("returns null when city field is missing (common with VPN IPs)", async () => {
    stubFetch({ country_name: "Italy", country_code: "IT", latitude: 45, longitude: 9, ip: "1.2.3.4" });
    expect(await detectLocation()).toBeNull();
  });

  test("returns null when country_name field is missing", async () => {
    stubFetch({ city: "Milan", country_code: "IT", latitude: 45, longitude: 9, ip: "1.2.3.4" });
    expect(await detectLocation()).toBeNull();
  });

  test("returns null on network failure, never throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    // Must resolve (not reject); callers rely on null as the error signal.
    await expect(detectLocation()).resolves.toBeNull();
  });

  test("falls back to empty string for optional fields", async () => {
    stubFetch({
      city: "Unknown City",
      country_name: "Unknown Country",
    });

    const result = await detectLocation();
    expect(result).not.toBeNull();
    expect(result?.countryCode).toBe("");
    expect(result?.ip).toBe("");
    expect(result?.latitude).toBe(0);
    expect(result?.longitude).toBe(0);
  });
});
