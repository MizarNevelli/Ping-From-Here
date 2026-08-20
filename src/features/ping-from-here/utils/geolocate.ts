export interface DetectedLocation {
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  ip: string;
}

// Best-effort IP geolocation via ipapi.co (free tier, 30k req/month, no auth).
// Returns null on any failure; callers must handle the null case.
export async function detectLocation(): Promise<DetectedLocation | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const city = typeof data.city === "string" ? data.city : null;
    const country =
      typeof data.country_name === "string" ? data.country_name : null;
    if (!city || !country) return null;
    return {
      city,
      country,
      countryCode:
        typeof data.country_code === "string" ? data.country_code : "",
      latitude: typeof data.latitude === "number" ? data.latitude : 0,
      longitude: typeof data.longitude === "number" ? data.longitude : 0,
      ip: typeof data.ip === "string" ? data.ip : "",
    };
  } catch {
    return null;
  }
}
