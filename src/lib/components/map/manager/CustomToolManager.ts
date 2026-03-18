// src/components/map/models/CustomToolManager.ts
/**
 * CustomToolManager with built-in ESC cancellation.
 *
 * Usage:
 * vm.tools.activateCustomExclusive(
 *   "measure",
 *   (on) => {
 *     on("pointermove", (e) => console.log("moving", e.coordinate));
 *     on("click", (e) => console.log("clicked", e.coordinate));
 *   },
 *   "crosshair",
 *   {
 *     message: { text: "Measuring: click to start (ESC to cancel)", severity: "info" },
 *     // esc: { enabled: true, onEsc: () => console.log("ESC pressed for measure") }
 *   }
 * );
 *
 * // later
 * vm.tools.offCustomTool("measure");
 */

import type OLMap from "ol/Map";
import { unByKey } from "ol/Observable";
import type { EventsKey } from "ol/events";
import { ReactNode } from "react";
import MapMessageChipManager from "@/components/map/manager/mapMessageChipManager";
import type {
    MapMessageAction,
    SeverityType,
} from "@/components/map/widgets/MapMessageChip";

// ----- Events ---------------------------------------------------------------

const browserEvents = [
    "click",
    "singleclick",
    "dblclick",
    "pointerdrag",
    "pointermove",
] as const;

const mapEvents = [
    "change",
    "error",
    "propertychange",
    "change:layergroup",
    "change:size",
    "change:target",
    "change:view",
    "rendercomplete",
] as const;

export type OLMapEventType =
    | (typeof browserEvents)[number]
    | (typeof mapEvents)[number];

// ----- Message & ESC options ------------------------------------------------

export type ChipMessagePayload = {
    text: string | ReactNode;
    severity?: SeverityType; // default 'info'
    actions?: MapMessageAction[]; // optional actions
};

export type EscOptions = {
    /** Enable ESC-to-cancel for this tool. Default: true */
    enabled?: boolean;
    /** Optional hook called right before the tool is turned off. */
    onEsc?: () => void;
};

export type ToolOptions = {
    /** Show a chip message immediately when this tool is armed/activated */
    message?: ChipMessagePayload;
    /** Configure ESC behavior (enabled by default) */
    esc?: EscOptions;
};

// ----- Armer types ----------------------------------------------------------
/***
 * Usage
 * const myArmerFn: ArmerFn = (on) => {
 *   on('click', (evt) => console.log('map clicked', evt));
 *   on('move',  () => console.log('map moved'));
 * };
 ***/
export type OnType = (
    type: OLMapEventType,
    handler: (...args: any[]) => void,
    options?: ToolOptions
) => void;

export type ArmerFn = (on: OnType) => void;

// ----- Manager --------------------------------------------------------------

export default class CustomToolManager {
    private _customListeners = new Map<string, EventsKey[]>();
    /** Tracks which tool has shown the chip so we can auto-hide on off(). */
    private _toolsWithChip = new Set<string>();

    /** Currently active tool id (set by activateCustomExclusive) */
    private _activeToolId?: string;

    /** One global ESC listener lifecycle */
    private _escBound = false;
    private _escHandler?: (e: KeyboardEvent) => void;

    /** Current ESC config tied to the active tool */
    private _currentEsc?: Required<Pick<EscOptions, "enabled">> & {
        toolId: string;
        onEsc?: () => void;
    };

    constructor(
        /** Lazy getter because your Map may not be ready at construction time */
        private readonly getMap: () => OLMap | null | undefined,
        /** Optional cursor setter; falls back to direct style change if omitted */
        private readonly setCursor?: (cursor: string) => void
    ) {}

    // -- Low-level message helpers --------------------------------------------

    /** Show a message chip (helper). */
    private showChip(toolId: string, payload: ChipMessagePayload) {
        let { text, severity = "info", actions } = payload;

        // Normalize to string (in case ReactNode)
        const txt = typeof text === "string" ? text : String(text);

        // only append ESC hint only if NOT already present
        const hasEsc = /esc/i.test(txt); // case insensitive match

        const finalText = hasEsc ? txt : `${txt} — Press ESC to exit`;

        MapMessageChipManager.show(finalText, severity, actions);
        this._toolsWithChip.add(toolId);
    }


    /** Hide message if it was shown by this manager (or if any chip is visible). */
    private hideChipFor(toolId?: string) {
        if (toolId) {
            if (this._toolsWithChip.has(toolId)) {
                MapMessageChipManager.hide();
                this._toolsWithChip.delete(toolId);
            }
            return;
        }
        // hide all
        if (this._toolsWithChip.size > 0) {
            MapMessageChipManager.hide();
            this._toolsWithChip.clear();
        }
    }

    // -- Cursor ----------------------------------------------------------------

    /** Safely set the map target’s cursor (uses provided setter if available). */
    public setMapCursor(cursor: string) {
        if (this.setCursor) {
            this.setCursor(cursor);
            return;
        }
        const t = this.getMap?.()?.getTargetElement?.();
        if (t) t.style.cursor = cursor;
    }

    // -- ESC lifecycle ---------------------------------------------------------

    /** Attach one global ESC listener if not already attached. */
    private _ensureEscListener() {
        if (this._escBound) return;

        this._escHandler = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            const cfg = this._currentEsc;
            if (!cfg?.toolId || !cfg.enabled) return;

            try {
                // Optional hook for the active tool
                cfg.onEsc?.();
            } finally {
                // Always hide the chip when ESC is pressed
                MapMessageChipManager.hide();

                // Turn off the currently active tool & reset cursor
                this.offCustomTool(cfg.toolId);
            }
        };

        window.addEventListener("keydown", this._escHandler);
        this._escBound = true;
    }

    /** Remove ESC listener if no tools remain. */
    private _teardownEscIfIdle() {
        if (this._customListeners.size > 0) return;
        if (!this._escBound) return;

        if (this._escHandler) {
            window.removeEventListener("keydown", this._escHandler);
        }
        this._escBound = false;
        this._escHandler = undefined;
        this._currentEsc = undefined;
    }

    /** Apply/refresh ESC config for a tool (default enabled). */
    private _configureEsc(toolId: string, esc?: EscOptions) {
        const enabled = esc?.enabled !== false; // default true
        if (!enabled) {
            if (this._currentEsc?.toolId === toolId) this._currentEsc = undefined;
            this._teardownEscIfIdle();
            return;
        }
        this._currentEsc = {
            toolId,
            enabled: true,
            onEsc: esc?.onEsc ?? undefined,
        };
        this._ensureEscListener();
    }

    // -- Listener management ---------------------------------------------------

    /** Arm a handler with map.on(type, handler) and register it under a tool id. */
    public onCustomTool(
        type: OLMapEventType,
        toolId: string,
        handler: (...args: any[]) => void,
        options?: ToolOptions
    ) {
        const map = this.getMap?.();
        if (!map) return null as EventsKey | null;

        // Optional message shown at the moment the first listener for this tool is added
        if (options?.message && !this._toolsWithChip.has(toolId)) {
            this.showChip(toolId, options.message);
        }

        // Per-listener ESC options can refine/override current tool's ESC behavior
        if (options?.esc) this._configureEsc(toolId, options.esc);

        // @ts-ignore - OL overloads are loose here
        const key: EventsKey = map.on(type, handler);
        const arr = this._customListeners.get(toolId) ?? [];
        arr.push(key);
        this._customListeners.set(toolId, arr);
        return key;
    }

    /** Disarm all handlers registered for a specific tool id. */
    public offCustomTool(toolId: string, resetCursor: boolean = true) {
        const arr = this._customListeners.get(toolId);
        if (!arr?.length) {
            // Still ensure message is hidden if it came from this tool
            this.hideChipFor(toolId);
            if (resetCursor) this.setMapCursor("auto");
            if (this._activeToolId === toolId) this._activeToolId = undefined;
            this._teardownEscIfIdle();
            return;
        }

        arr.forEach((k) => unByKey(k));
        this._customListeners.delete(toolId);

        // Hide chip if this tool had shown one
        this.hideChipFor(toolId);

        if (resetCursor) this.setMapCursor("auto");
        if (this._activeToolId === toolId) this._activeToolId = undefined;

        this._teardownEscIfIdle();
    }

    /** Disarm ALL handlers registered via this manager. */
    public offAllCustom(resetCursor: boolean = true) {
        for (const [, keys] of this._customListeners) keys.forEach((k) => unByKey(k));
        this._customListeners.clear();

        this._activeToolId = undefined;

        // Hide any chip we showed
        this.hideChipFor();

        if (resetCursor) this.setMapCursor("auto");
        this._teardownEscIfIdle();
    }

    /** Count listeners armed (per tool or total). */
    public countCustom(toolId?: string) {
        if (toolId) return this._customListeners.get(toolId)?.length ?? 0;
        let n = 0;
        for (const [, arr] of this._customListeners) n += arr.length;
        return n;
    }

    // -- High-level API --------------------------------------------------------

    /**
     * Exclusive activate: turn off all custom handlers, arm new ones via callback,
     * set cursor, (optionally) show a chip message, and enable ESC by default.
     */
    public activateCustomExclusive(
        toolId: string,
        armer: ArmerFn,
        cursor?: string,
        options?: ToolOptions
    ) {
        this.offAllCustom(false); // keep cursor until we set new one

        this._activeToolId = toolId;

        // If caller passed a message at the activation level, show it up front
        if (options?.message) {
            this.showChip(toolId, options.message);
        }

        // Default: ESC enabled unless explicitly disabled
        this._configureEsc(toolId, options?.esc);

        const on: OnType = (type, handler, onOptions) => {
            // Allow esc/message to be provided at handler-arm time too
            return this.onCustomTool(type, toolId, handler, onOptions);
        };

        armer(on);
        this.setMapCursor(cursor ?? "auto");
    }

    /** Optional: for cleanup on VM dispose. */
    public destroy() {
        this.offAllCustom();
    }
}
