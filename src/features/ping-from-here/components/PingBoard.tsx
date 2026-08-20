"use client";

import { useMemo } from "react";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { useLatencyMeasurements } from "../hooks/useLatencyMeasurements";
import { LocationBadge } from "./LocationBadge";
import { RegionRow } from "./RegionRow";
import { GlobeLoader } from "./GlobeLoader";

export function PingBoard() {
  const t = useTranslations("board");
  const tHero = useTranslations("hero");
  const tFooter = useTranslations("footer");
  const { completed, pendingCount } = useLatencyMeasurements();

  const maxLatencyMs = useMemo(() => {
    const max = completed.reduce((acc, m) => {
      if (m.result?.status === "success") return Math.max(acc, m.result.medianMs);
      return acc;
    }, 0);
    return Math.max(max, 100); // floor so the first result always shows a non-trivial line
  }, [completed]);

  const pendingLabel =
    pendingCount === 1
      ? t("pendingSingular", { n: pendingCount })
      : t("pendingPlural", { n: pendingCount });

  return (
    <div className="min-h-screen bg-ocean flex flex-col">
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex items-start justify-between mb-3">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-parchment tracking-tight leading-none">
              {tHero("eyebrow")}
            </h1>
            <p className="text-mist/80 text-sm font-sans mt-2 leading-snug">
              {tHero("tagline")}
            </p>
          </div>
          <LocationBadge />
        </header>

        {/* ── Intro description ───────────────────────────────────── */}
        <p className="text-mist/60 text-xs font-sans mb-10 max-w-md leading-relaxed">
          {tHero("description")}
        </p>

        {/* ── Region list ────────────────────────────────────────── */}
        <section aria-label="Latency measurements">
          {/* Globe loader — shown while no results have arrived yet */}
          {completed.length === 0 && pendingCount > 0 && (
            <GlobeLoader pendingLabel={pendingLabel} />
          )}

          <ol aria-live="polite" aria-label="Cloud regions sorted by latency">
            {completed.map((measurement, idx) => (
              <RegionRow
                key={measurement.region.id}
                rank={idx + 1}
                measurement={measurement}
                maxLatencyMs={maxLatencyMs}
              />
            ))}
          </ol>

          {/* Small pending dot — shown once rows start populating */}
          {pendingCount > 0 && completed.length > 0 && (
            <div
              className="flex items-center gap-2 pt-4 pb-2"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cable animate-pulse" aria-hidden />
              <span className="text-mist text-xs font-mono">{pendingLabel}</span>
            </div>
          )}

          {pendingCount === 0 && completed.length > 0 && (
            <p className="text-mist text-xs font-mono pt-4" aria-live="polite">
              {t("allDone")}
            </p>
          )}
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-10 space-y-2">
        <div className="h-px bg-white/8" />
        <p className="text-mist text-xs font-sans leading-relaxed pt-2">
          {tFooter("methodologyNote")}
        </p>
        <p className="text-mist text-xs font-sans">
          {tFooter("gcpAttribution")} {tFooter("cloudflareNote")}
        </p>
      </footer>
    </div>
  );
}
