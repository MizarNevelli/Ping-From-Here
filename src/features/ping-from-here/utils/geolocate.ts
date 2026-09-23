export interface DetectedLocation {
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  ip: string;
}

export type LocationResult = DetectedLocation | "denied" | null;

const SESSION_KEY = "pfh:location";

// In-flight deduplication: concurrent callers share the same promise.
let inflight: Promise<LocationResult> | null = null;

function persist(location: DetectedLocation): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(location));
  } catch {
    // ignore storage errors
  }
}

async function fetchIpapi(): Promise<DetectedLocation | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (data.error === true) return null;
    const city = typeof data.city === "string" ? data.city : null;
    const country = typeof data.country_name === "string" ? data.country_name : null;
    if (!city || !country) return null;
    return {
      city,
      country,
      countryCode: typeof data.country_code === "string" ? data.country_code : "",
      latitude: typeof data.latitude === "number" ? data.latitude : 0,
      longitude: typeof data.longitude === "number" ? data.longitude : 0,
      ip: typeof data.ip === "string" ? data.ip : "",
    };
  } catch {
    return null;
  }
}

async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ city: string; country: string; countryCode: string }> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { city: "", country: "", countryCode: "" };
    const data = (await res.json()) as Record<string, unknown>;
    return {
      city: typeof data.city === "string" ? data.city : (typeof data.locality === "string" ? data.locality : ""),
      country: typeof data.countryName === "string" ? data.countryName : "",
      countryCode: typeof data.countryCode === "string" ? data.countryCode : "",
    };
  } catch {
    return { city: "", country: "", countryCode: "" };
  }
}

function getBrowserPosition(): Promise<GeolocationPosition | "denied" | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) =>
        resolve(err.code === GeolocationPositionError.PERMISSION_DENIED ? "denied" : null),
      { timeout: 8000, maximumAge: 300_000 }
    );
  });
}

async function fetchBrowserGeolocation(): Promise<LocationResult> {
  const pos = await getBrowserPosition();
  if (pos === "denied") return "denied";
  if (!pos) return null;
  const { latitude, longitude } = pos.coords;
  const { city, country, countryCode } = await reverseGeocode(latitude, longitude);
  return { city, country, countryCode, latitude, longitude, ip: "" };
}

// Best-effort geolocation: tries ipapi.co first, falls back to browser Geolocation API.
// "denied" means the user explicitly refused the browser permission prompt.
// Successful results are cached in sessionStorage so each tab calls external services at most once.
export async function detectLocation(): Promise<LocationResult> {
  try {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) return JSON.parse(cached) as DetectedLocation;
  } catch {
    // sessionStorage unavailable (SSR, private mode restrictions) — fall through
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const ipapiResult = await fetchIpapi();
      if (ipapiResult) {
        persist(ipapiResult);
        return ipapiResult;
      }

      const browserResult = await fetchBrowserGeolocation();
      if (browserResult && browserResult !== "denied") {
        persist(browserResult);
      }
      return browserResult;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
