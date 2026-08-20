import { test, expect, type Page, type Route } from "@playwright/test";

async function mockGeoIP(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      city: "Milan",
      country_name: "Italy",
      country_code: "IT",
      latitude: 45.46,
      longitude: 9.19,
      ip: "203.0.113.1",
    }),
  });
}

/**
 * Intercept all cloud latency endpoints and fulfill them after a controlled delay.
 * Different delays for three specific regions let us assert relative ordering.
 *
 * Playwright evaluates routes LIFO: register catch-all first, specifics last.
 */
async function mockLatencyEndpoints(page: Page) {
  await page.route((url: URL) => url.hostname === "ipapi.co", mockGeoIP);

  // All remaining AWS STS endpoints, 40ms (catch-all, lowest priority)
  await page.route(
    (url: URL) => url.hostname.startsWith("sts.") && url.hostname.endsWith(".amazonaws.com"),
    async (route: Route) => { await delay(40); await route.fulfill({ status: 302, headers: { Location: "https://aws.amazon.com/iam" } }); }
  );

  // AWS eu-west-1: clearly slower (300ms), ordering test is unambiguous
  await page.route(
    (url: URL) => url.hostname === "sts.eu-west-1.amazonaws.com",
    async (route: Route) => { await delay(300); await route.fulfill({ status: 302, headers: { Location: "https://aws.amazon.com/iam" } }); }
  );

  // AWS us-east-1: fastest in test suite (5ms), registered last = highest priority
  await page.route(
    (url: URL) => url.hostname === "sts.us-east-1.amazonaws.com",
    async (route: Route) => { await delay(5); await route.fulfill({ status: 302, headers: { Location: "https://aws.amazon.com/iam" } }); }
  );

  // GCP Cloud Run endpoints, 40ms
  await page.route(
    (url: URL) => url.hostname.endsWith(".run.app"),
    async (route: Route) => { await delay(40); await route.fulfill({ status: 302, headers: { Location: "https://aws.amazon.com/iam" } }); }
  );

  // Cloudflare speed endpoint, 40ms
  await page.route(
    (url: URL) => url.hostname === "speed.cloudflare.com",
    async (route: Route) => { await delay(40); await route.fulfill({ status: 302, headers: { Location: "https://aws.amazon.com/iam" } }); }
  );
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

test.describe("PingBoard", () => {
  test.beforeEach(async ({ page }) => {
    await mockLatencyEndpoints(page);
  });

  test("renders the brand heading on load", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Ping From Here" })).toBeVisible();
  });

  test("starts measuring automatically, no button press required", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/regions still measuring/)).toBeVisible();
  });

  test("displays the detected location from the geolocation API", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Milan, IT")).toBeVisible({ timeout: 5_000 });
  });

  test("rows appear progressively as measurements complete", async ({ page }) => {
    await page.goto("/");
    const firstRow = page.locator("ol > li").first();
    await expect(firstRow).toBeVisible({ timeout: 8_000 });
  });

  test("all 28 regions eventually complete and show a result", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("All regions measured")).toBeVisible({ timeout: 20_000 });
    const rows = page.locator("ol > li");
    const count = await rows.count();
    expect(count).toBe(28);
  });

  test("completed rows are sorted ascending by latency", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("All regions measured")).toBeVisible({ timeout: 20_000 });

    const latencies = await page.locator("ol > li").evaluateAll((rows) =>
      rows
        .map((el) => {
          const match = el.textContent?.match(/(\d+)ms/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((v): v is number => v !== null)
    );

    expect(latencies.length).toBeGreaterThan(0);

    for (let i = 1; i < latencies.length; i++) {
      expect(latencies[i]).toBeGreaterThanOrEqual(latencies[i - 1]);
    }
  });

  test("us-east-1 (10ms mock) ranks above eu-west-1 (80ms mock)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("All regions measured")).toBeVisible({ timeout: 20_000 });

    const rows = page.locator("ol > li");
    const texts = await rows.evaluateAll((els) => els.map((el) => el.textContent ?? ""));

    const eastIdx = texts.findIndex((t) => t.includes("us-east-1"));
    const westIdx = texts.findIndex((t) => t.includes("eu-west-1"));

    expect(eastIdx).toBeGreaterThanOrEqual(0);
    expect(westIdx).toBeGreaterThanOrEqual(0);
    expect(eastIdx).toBeLessThan(westIdx);
  });

  // accessibility

  test("the region list has aria-live=polite for screen reader announcements", async ({
    page,
  }) => {
    await page.goto("/");
    const list = page.locator("ol[aria-live='polite']");
    await expect(list).toBeAttached();
  });

  // reduced motion

  test("pulse-tip dot is hidden when prefers-reduced-motion is set", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator("ol > li").first()).toBeVisible({ timeout: 10_000 });

    const tip = page.locator(".pulse-tip").first();
    await expect(tip).toBeHidden();
  });
});
