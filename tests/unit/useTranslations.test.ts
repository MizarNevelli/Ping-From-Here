import { describe, test, expect } from "vitest";
import { t } from "@/lib/i18n/translations";

describe("t", () => {
  test("returns the correct string for a known key", () => {
    expect(t("unitMs")).toBe("ms");
    expect(t("providerAws")).toBe("AWS");
    expect(t("providerGcp")).toBe("GCP");
  });

  test("interpolates a single variable placeholder", () => {
    expect(t("pendingSingular", { n: 1 })).toBe("1 region still measuring");
    expect(t("pendingPlural", { n: 5 })).toBe("5 regions still measuring");
  });

  test("interpolates multiple placeholders in a single string", () => {
    expect(
      t("rowAriaLabel", { rank: "3", provider: "AWS", city: "Ireland", latency: "42" })
    ).toBe("3. AWS Ireland, 42 milliseconds");
  });

  test("returns strings from across the locale file", () => {
    expect(t("eyebrow")).toBe("Ping From Here");
    expect(t("methodologyNote")).toContain("HTTP GET");
    expect(t("allDone")).toBe("All regions measured");
  });

  test("returns the raw key string when the key does not exist", () => {
    // @ts-expect-error deliberate unknown key
    expect(t("nonExistentKey")).toBe("nonExistentKey");
  });

  test("leaves placeholders unreplaced when no vars are provided", () => {
    expect(t("pendingSingular")).toBe("{n} region still measuring");
  });
});
