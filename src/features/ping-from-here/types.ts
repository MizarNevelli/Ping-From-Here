export type CloudProvider = "aws" | "gcp" | "cloudflare";

export interface Region {
  id: string;
  provider: CloudProvider;
  city: string;
  country: string;
  lat: number;
  lon: number;
  endpoint: string;
  noCors?: boolean;
}

export type MeasurementStatus = "measuring" | "done" | "error";

export interface LatencySuccess {
  status: "success";
  medianMs: number;
  samples: number[];
}

export interface LatencyError {
  status: "error";
  reason: "network" | "timeout";
}

export type LatencyResult = LatencySuccess | LatencyError;

export interface RegionMeasurement {
  region: Region;
  measurementStatus: MeasurementStatus;
  result: LatencyResult | null;
}
