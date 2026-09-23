"use client";

import { useEffect, useState } from "react";
import { detectLocation, type DetectedLocation } from "../utils/geolocate";

export type LocationState =
  | { status: "detecting" }
  | { status: "detected"; location: DetectedLocation }
  | { status: "unavailable"; reason: "denied" | "error" };

export function useDetectedLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ status: "detecting" });

  useEffect(() => {
    let cancelled = false;

    function run() {
      detectLocation().then((result) => {
        if (cancelled) return;
        if (result && result !== "denied") {
          setState({ status: "detected", location: result });
        } else {
          setState({ status: "unavailable", reason: result === "denied" ? "denied" : "error" });
        }
      });
    }

    run();

    // Re-run when the browser geolocation permission changes (e.g. user enables it in settings).
    let permissionStatus: PermissionStatus | null = null;
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((ps) => {
          permissionStatus = ps;
          ps.onchange = () => { if (!cancelled) run(); };
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  return state;
}
