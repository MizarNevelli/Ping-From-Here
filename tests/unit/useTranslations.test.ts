import { describe, test, expect } from "vitest";
import { useTranslations } from "@/lib/i18n/useTranslations";

describe("useTranslations", () => {
  test("returns the correct string for a known key", () => {
    const t = useTranslations();
    expect(t("unitMs")).toBe("ms");
    expect(t("providerAws")).toBe("AWS");
    expect(t("providerGcp")).toBe("GCP");
  });

  test("interpolates a single variable placeholder", () => {
    const t = useTranslations();
    expect(t("pendingSingular", { n: 1 })).toBe("1 region still measuring");
    expect(t("pendingPlural", { n: 5 })).toBe("5 regions still measuring");
  });

  test("interpolates multiple placeholders in a single string", () => {
    const t = useTranslations();
    // rowAriaLabel: "{rank}. {provider} {city}, {latency} milliseconds"
    expect(
      t("rowAriaLabel", { rank: "3", provider: "AWS", city: "Ireland", latency: "42" })
    ).toBe("3. AWS Ireland, 42 milliseconds");
  });

  test("returns keys from across the former namespaces", () => {
    const t = useTranslations();
    expect(t("eyebrow")).toBe("Ping From Here");
    expect(t("methodologyNote")).toContain("HTTP GET");
    expect(t("allDone")).toBe("All regions measured");
  });

  test("returns the raw key string when the key does not exist", () => {
    const t = useTranslations();
    // @ts-expect-error deliberate unknown key
    expect(t("nonExistentKey")).toBe("nonExistentKey");
  });

  test("leaves placeholders unreplaced when no vars are provided", () => {
    const t = useTranslations();
    expect(t("pendingSingular")).toBe("{n} region still measuring");
  });
});
