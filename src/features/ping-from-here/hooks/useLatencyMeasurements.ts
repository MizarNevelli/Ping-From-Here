"use client";

import { useEffect, useMemo, useState } from "react";
import { measureLatency } from "../utils/measureLatency";
import { REGIONS } from "../constants/regions";
import type { RegionMeasurement } from "../types";

type MeasurementMap = Record<string, RegionMeasurement>;

const initialState = (): MeasurementMap =>
  Object.fromEntries(
    REGIONS.map((r) => [
      r.id,
      { region: r, measurementStatus: "measuring" as const, result: null },
    ])
  );

export interface LatencyMeasurementsResult {
  /** Completed measurements (success or error), sorted by latency ascending. */
  completed: RegionMeasurement[];
  /** Count of regions still in progress. */
  pendingCount: number;
}

export function useLatencyMeasurements(): LatencyMeasurementsResult {
  const [state, setState] = useState<MeasurementMap>(initialState);

  useEffect(() => {
    let cancelled = false;

    // All regions measured concurrently. Within each region, measureLatency()
    // runs its samples sequentially to benefit from TCP keep-alive.
    for (const region of REGIONS) {
      measureLatency(region.endpoint, { noCors: region.noCors }).then((result) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          [region.id]: {
            region,
            measurementStatus: result.status === "success" ? "done" : "error",
            result,
          },
        }));
      });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const all = Object.values(state);
    const completed = all
      .filter((m) => m.measurementStatus !== "measuring")
      .sort((a, b) => {
        const msA = a.result?.status === "success" ? a.result.medianMs : Infinity;
        const msB = b.result?.status === "success" ? b.result.medianMs : Infinity;
        return msA - msB;
      });
    return {
      completed,
      pendingCount: all.length - completed.length,
    };
  }, [state]);
}
