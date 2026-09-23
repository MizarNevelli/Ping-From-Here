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
    detectLocation().then((result) => {
      if (cancelled) return;
      if (result && result !== "denied") {
        setState({ status: "detected", location: result });
      } else {
        setState({ status: "unavailable", reason: result === "denied" ? "denied" : "error" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
