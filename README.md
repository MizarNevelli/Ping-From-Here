# Ping From Here

Measures your HTTP latency to 28 cloud regions across AWS, GCP, and Cloudflare, directly from your browser. No backend, no server-side processing, no data leaves your device.

Live at: [pingfromhere.vercel.app](https://pingfromhere.vercel.app) _(placeholder)_

---

## How it works

On page load the app fires concurrent GET requests from your browser to one endpoint per cloud region. Each region is sampled 5 times sequentially, so samples 2-5 benefit from TCP keep-alive reuse. The median of successful samples is reported. All 28 regions run in parallel, so total measurement time is bounded by the slowest region.

### Endpoints

| Provider         | Technique                                                                                    | Why it works silently                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AWS (17 regions) | `GET` to `sts.<region>.amazonaws.com`                                                        | Unauthenticated requests get a 302 redirect. With `redirect: manual`, the browser stops before following it and returns an opaque-redirect response (status 0). Chrome logs nothing. |
| GCP (10 regions) | `GET` to Cloud Run instances via [gcping.com](https://github.com/GoogleCloudPlatform/gcping) | Endpoints return 200 with no CORS header. Fetched with `mode: no-cors`, which returns an opaque response (status 0).                                                                 |
| Cloudflare (1)   | `GET` to `speed.cloudflare.com/__down?bytes=0`                                               | Anycast, always hits the nearest PoP. Same no-cors approach as GCP.                                                                                                                  |

Each request appends a `_t` timestamp parameter to prevent CDN and browser caching.

The first sample in each region includes a cold DNS + TLS handshake. Taking 5 samples and reporting the median absorbs this warm-up bias.

### Geolocation

Your approximate location is detected via [ipapi.co](https://ipapi.co) on load. This is cosmetic only (shown in the header badge). No location data is sent anywhere else.

---

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Vitest** for unit tests
- **Playwright** for end-to-end tests

---

## Project layout

```
src/
  app/                          Next.js app router (layout, page, global CSS)
  features/ping-from-here/
    components/                 UI components (PingBoard, RegionRow, GlobeLoader, ...)
    constants/regions.ts        All 28 region definitions
    hooks/                      useLatencyMeasurements, useDetectedLocation
    utils/measureLatency.ts     Core measurement logic
    utils/geolocate.ts          IP geolocation
    types.ts                    Shared TypeScript types
  lib/i18n/                     Typed translation helper
  locales/en.json               All string literals

tests/
  unit/                         Vitest unit tests (measureLatency, geolocate, i18n)
  e2e/                          Playwright end-to-end tests
```

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The dev server restarts automatically on file changes. No environment variables required.

---

## Tests

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# End-to-end tests (starts dev server automatically on port 3458)
npm run test:e2e

# End-to-end tests with the Playwright UI
npm run test:e2e:ui
```

The E2E suite intercepts all cloud endpoints with mock responses, so it runs fully offline and deterministically. Mocks use controlled delays to verify sort order and progressive rendering.

---

## Deployment

The app has no server-side logic. It deploys as a standard Next.js static export on any platform that supports Node.js builds (Vercel, Netlify, Cloudflare Pages, etc.).

```bash
npm run build
npm start
```

No environment variables, no database, no secrets.

---

## Adding or updating regions

Edit `src/features/ping-from-here/constants/regions.ts`. Each entry needs:

```ts
{
  id: "aws-us-east-1",        // unique, used as React key and display label
  provider: "aws",             // "aws" | "gcp" | "cloudflare"
  city: "N. Virginia",
  country: "US",
  lat: 38.9,
  lon: -77.5,
  endpoint: "https://sts.us-east-1.amazonaws.com",
  noCors: false,               // true for GCP and Cloudflare (no CORS headers on endpoint)
}
```

After adding a region, update the count in `src/locales/en.json` (`hero.description`) and in the E2E test that asserts `expect(count).toBe(28)`.

---

## GCP endpoint URLs

GCP endpoints are sourced from [gcping.com](https://github.com/GoogleCloudPlatform/gcping), a Google DevRel project (Apache 2.0). The URLs are Cloud Run instances that can be redeployed. If a GCP region starts timing out, re-fetch the current list:

```
https://global.gcping.com/api/endpoints
```

Then update the matching entries in `regions.ts`.

---

## License

MIT
