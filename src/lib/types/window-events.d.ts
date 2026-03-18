// src/types/window-events.d.ts
import type { MapToolbarHandle } from "@/components/map/toolbar/MapToolbarContainer";

declare global {
    interface WindowEventMap {
        mapToolbarContainerReady: CustomEvent<MapToolbarHandle>;
    }
}

export {};
