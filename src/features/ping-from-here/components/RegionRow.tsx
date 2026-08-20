"use client";

import { t } from "@/lib/i18n/translations";
import type { RegionMeasurement } from "../types";
import { PulseLine } from "./PulseLine";

interface RegionRowProps {
  rank: number;
  measurement: RegionMeasurement;
  maxLatencyMs: number;
}

const PROVIDER_COLORS = {
  aws: "text-signal",
  gcp: "text-cable",
  cloudflare: "text-parchment/70",
} as const;

export function RegionRow({ rank, measurement, maxLatencyMs }: RegionRowProps) {
  const { region, result } = measurement;

  const providerLabel =
    region.provider === "aws"
      ? t("providerAws")
      : region.provider === "gcp"
        ? t("providerGcp")
        : t("providerCloudflare");

  const latencyMs = result?.status === "success" ? result.medianMs : null;
  const isError = result?.status === "error";

  const cityLabel =
    region.provider === "cloudflare" ? t("cloudflareEdgeNote") : region.city;

  const ariaLabel =
    latencyMs != null
      ? t("rowAriaLabel", {
          rank: String(rank),
          provider: providerLabel,
          city: cityLabel,
          latency: String(latencyMs),
        })
      : `${rank}. ${providerLabel} ${cityLabel}, ${t("errorLabel")}`;

  return (
    <li
      className="row-enter grid items-center gap-x-3 gap-y-0 py-2.5 border-b border-white/5 last:border-0 grid-cols-[2.5rem_3rem_minmax(0,1fr)_1fr_5rem] sm:grid-cols-[2.5rem_3rem_minmax(0,7rem)_minmax(0,1fr)_1fr_5rem]"
      aria-label={ariaLabel}
    >
      <span className="text-mist text-xs font-mono tabular-nums">
        {String(rank).padStart(2, "0")}
      </span>

      <span
        className={`text-xs font-mono font-medium tracking-wide ${PROVIDER_COLORS[region.provider]}`}
      >
        {providerLabel}
      </span>

      <span className="hidden sm:block text-xs font-mono text-mist truncate">
        {region.id.replace(/^(aws|gcp|cf)-/, "")}
      </span>

      <span className="text-sm font-sans text-parchment truncate">
        {cityLabel}
      </span>

      <div className="flex items-center">
        {latencyMs != null ? (
          <PulseLine latencyMs={latencyMs} maxLatencyMs={maxLatencyMs} />
        ) : isError ? (
          <span className="text-mist text-xs font-mono">{t("errorLabel")}</span>
        ) : null}
      </div>

      <div className="text-right">
        {latencyMs != null ? (
          <span className="text-parchment font-mono text-sm tabular-nums">
            {latencyMs}
            <span className="text-mist text-xs ml-0.5">{t("unitMs")}</span>
          </span>
        ) : null}
      </div>
    </li>
  );
}
