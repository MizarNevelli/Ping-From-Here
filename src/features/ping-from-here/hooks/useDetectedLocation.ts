"use client";

import { useEffect, useState } from "react";
import { detectLocation, type DetectedLocation } from "../utils/geolocate";

export type LocationState =
  | { status: "detecting" }
  | { status: "detected"; location: DetectedLocation }
  | { status: "unavailable" };

export function useDetectedLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ status: "detecting" });

  useEffect(() => {
    let cancelled = false;
    detectLocation().then((loc) => {
      if (cancelled) return;
      setState(loc ? { status: "detected", location: loc } : { status: "unavailable" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
