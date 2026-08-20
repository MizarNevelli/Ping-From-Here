"use client";

import { useTranslations } from "@/lib/i18n/useTranslations";
import type { LocationState } from "../hooks/useDetectedLocation";

interface Props {
  locationState: LocationState;
}

export function LocationBadge({ locationState }: Props) {
  const t = useTranslations();

  const label =
    locationState.status === "detected"
      ? `${locationState.location.city}, ${locationState.location.countryCode}`
      : locationState.status === "detecting"
        ? "…"
        : t("locationUnavailable");

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
          locationState.status === "detecting"
            ? "bg-mist animate-pulse"
            : locationState.status === "unavailable"
              ? "bg-mist"
              : "bg-cable"
        }`}
      />
      <span className="text-cable text-sm font-mono tabular-nums">{label}</span>
    </div>
  );
}
