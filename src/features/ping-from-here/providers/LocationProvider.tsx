"use client";

import { createContext, useContext } from "react";
import { useDetectedLocation, type LocationState } from "../hooks/useDetectedLocation";

const LocationContext = createContext<LocationState>({ status: "detecting" });

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const locationState = useDetectedLocation();
  return (
    <LocationContext.Provider value={locationState}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationState {
  return useContext(LocationContext);
}
