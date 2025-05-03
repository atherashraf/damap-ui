// MapToolbarVMContext.tsx
import { createContext, useContext } from "react";
import type MapVM from "@/components/map/models/MapVM.ts";

export const MapToolbarVMContext = createContext<MapVM | null>(null);

export const useMapVM = () => {
    const ctx = useContext(MapToolbarVMContext);
    if (!ctx) throw new Error("useMapVM must be used within MapToolbarVMContext.Provider");
    return ctx;
};
