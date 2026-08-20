"use client";

import { t } from "@/lib/i18n/translations";
import { useLocation } from "../providers/LocationProvider";
import { LocationBadge } from "./LocationBadge";

export function SiteHeader() {
  const locationState = useLocation();

  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-transparent backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        <h1 className="font-display text-3xl sm:text-4xl text-parchment tracking-tight leading-none">
          {t("eyebrow")}
        </h1>
        <div className="sm:flex items-center justify-between mt-3">
          <p className="text-mist/80 text-sm font-sans leading-snug mb-2 sm:mb-0">
            {t("tagline")}
          </p>
          <LocationBadge locationState={locationState} />
        </div>
      </div>
    </header>
  );
}
