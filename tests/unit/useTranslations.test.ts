import { describe, test, expect } from "vitest";
import { useTranslations } from "@/lib/i18n/useTranslations";

// useTranslations is a plain function (no React hooks inside) — callable directly in tests.

describe("useTranslations", () => {
  test("returns the correct string for a known key", () => {
    const t = useTranslations("board");
    expect(t("unitMs")).toBe("ms");
    expect(t("providerAws")).toBe("AWS");
    expect(t("providerGcp")).toBe("GCP");
  });

  test("interpolates a single variable placeholder", () => {
    const t = useTranslations("board");
    expect(t("pendingSingular", { n: 1 })).toBe("1 region still measuring");
    expect(t("pendingPlural", { n: 5 })).toBe("5 regions still measuring");
  });

  test("interpolates multiple placeholders in a single string", () => {
    const t = useTranslations("board");
    // rowAriaLabel: "{rank}. {provider} {city} — {latency} milliseconds"
    expect(
      t("rowAriaLabel", { rank: "3", provider: "AWS", city: "Ireland", latency: "42" })
    ).toBe("3. AWS Ireland — 42 milliseconds");
  });

  test("works across different namespaces independently", () => {
    const tHero = useTranslations("hero");
    const tFooter = useTranslations("footer");
    // Each namespace is scoped — same key name returns different values
    expect(tHero("eyebrow")).toBe("Ping From Here");
    expect(tFooter("methodologyNote")).toContain("HTTP HEAD");
  });

  test("returns the raw key string when the key does not exist", () => {
    const t = useTranslations("board");
    // TypeScript would catch this at compile time, but we test runtime fallback
    // @ts-expect-error — deliberate unknown key
    expect(t("nonExistentKey")).toBe("nonExistentKey");
  });

  test("leaves placeholders unreplaced when no vars are provided", () => {
    const t = useTranslations("board");
    // If caller forgets vars, the raw template is returned (not a crash)
    expect(t("pendingSingular")).toBe("{n} region still measuring");
  });
});
