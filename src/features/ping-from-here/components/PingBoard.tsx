"use client";

import { useMemo } from "react";
import { t } from "@/lib/i18n/translations";
import { useLocation } from "../providers/LocationProvider";
import { useLatencyMeasurements } from "../hooks/useLatencyMeasurements";
import { RegionRow } from "./RegionRow";
import { GlobeLoader } from "./GlobeLoader";

export function PingBoard() {
  const locationState = useLocation();
  const { completed, pendingCount } = useLatencyMeasurements(
    locationState.status === "detected"
  );

  const maxLatencyMs = useMemo(() => {
    const max = completed.reduce((acc, m) => {
      if (m.result?.status === "success")
        return Math.max(acc, m.result.medianMs);
      return acc;
    }, 0);
    return Math.max(max, 100);
  }, [completed]);

  const pendingLabel =
    pendingCount === 1
      ? t("pendingSingular", { n: pendingCount })
      : t("pendingPlural", { n: pendingCount });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-8">
      <p className="text-mist/60 text-xs font-sans max-w-md leading-relaxed mb-3">
        {t("description")}
      </p>
      <section aria-label="Latency measurements">
        {locationState.status === "detecting" && (
          <div className="flex items-center gap-2 py-8">
            <span
              className="w-1.5 h-1.5 rounded-full bg-mist animate-pulse"
              aria-hidden
            />
            <span className="text-mist text-xs font-mono">{t("locating")}</span>
          </div>
        )}

        {locationState.status === "unavailable" && (
          <div className="flex flex-col items-center py-20 gap-6 text-center">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-mist/20" />
              <div className="w-5 h-px bg-mist/40" />
              <div className="absolute w-px h-5 bg-mist/40" />
            </div>
            <div className="space-y-2 max-w-xs">
              <p className="text-parchment text-sm font-sans">
                {t("locationUnavailableTitle")}
              </p>
              <p className="text-mist text-xs font-sans leading-relaxed">
                {t("locationUnavailableBody")}
              </p>
            </div>
          </div>
        )}

        {locationState.status === "detected" && (
          <>
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

            {pendingCount > 0 && completed.length > 0 && (
              <div
                className="flex items-center gap-2 pt-4 pb-2"
                aria-live="polite"
                aria-atomic="true"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-cable animate-pulse"
                  aria-hidden
                />
                <span className="text-mist text-xs font-mono">
                  {pendingLabel}
                </span>
              </div>
            )}

            {pendingCount === 0 && completed.length > 0 && (
              <p
                className="text-mist text-xs font-mono pt-4"
                aria-live="polite"
              >
                {t("allDone")}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
