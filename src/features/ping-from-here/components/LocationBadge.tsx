"use client";

import { useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { useDetectedLocation } from "../hooks/useDetectedLocation";

export function LocationBadge() {
  const t = useTranslations("hero");
  const locationState = useDetectedLocation();
  const [editing, setEditing] = useState(false);
  const [override, setOverride] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectedLabel =
    locationState.status === "detected"
      ? `${locationState.location.city}, ${locationState.location.countryCode}`
      : locationState.status === "detecting"
        ? "…"
        : t("locationUnavailable");

  const displayLabel = override ?? detectedLabel;

  function startEditing() {
    setEditing(true);
    // Pre-fill with current display value (but not "…")
    if (displayLabel !== "…") {
      setOverride(displayLabel);
    }
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commit(value: string) {
    const trimmed = value.trim();
    setOverride(trimmed || null);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cable flex-shrink-0" />
        <input
          ref={inputRef}
          className="bg-transparent border-b border-cable/60 text-parchment text-sm font-sans w-36 outline-none focus:border-cable caret-cable"
          defaultValue={override ?? detectedLabel}
          aria-label={t("editLocationLabel")}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(e.currentTarget.value);
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={(e) => commit(e.currentTarget.value)}
        />
      </div>
    );
  }

  return (
    <button
      className="flex items-center gap-1.5 group text-left"
      onClick={startEditing}
      aria-label={`${t("locationAriaLabel")}: ${displayLabel}. ${t("editLocationLabel")}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
          locationState.status === "detecting" ? "bg-mist animate-pulse" : "bg-cable"
        }`}
      />
      <span className="text-cable text-sm font-mono tabular-nums">{displayLabel}</span>
      <span
        className="text-mist text-xs opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
        aria-hidden
      >
        ✎
      </span>
    </button>
  );
}
