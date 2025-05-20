/**
 * MapToolbar — OpenLayers control for rendering a customizable React-based toolbar.
 *
 * Renders common buttons like AddLayer, LayerSwitcher, etc., using React, and allows
 * external applications to inject more buttons dynamically using `addButton(...)`.
 *
 * Internally, it uses MapToolbarContainer and passes mapVM via context.
 *
 * @example
 * // 1. Create and add the toolbar to your OL map:
 * import MapToolbar from "@/components/map/toolbar/MapToolbar";
 * const toolbar = new MapToolbar({ mapVM, target: document.getElementById("map") });
 * map.addControl(toolbar);
 *
 * // 2. Add dynamic button later (from your app, plugin, etc.)
 * toolbar.addButton(
 *   <button onClick={() => alert("New tool clicked")}>New Tool</button>
 * );
 */

import "@/assets/css/ol-control.css";
import { Control } from "ol/control";
import { createRoot, Root } from "react-dom/client";
import MapVM from "@/components/map/models/MapVM";
import type { IMapToolbarProps } from "@/types/typeDeclarations";
import MapToolbarContainer from "@/components/map/toolbar/MapToolbarContainer";
import {JSX} from "react";

class MapToolbar extends Control {
    private buttons: JSX.Element[] = [];
    private root: Root;
    private container: HTMLElement;
    private mapVM: MapVM;

    constructor(optOptions: IMapToolbarProps) {
        const container = document.createElement("nav");
        container.className = "ol-control";
        container.style.left = "3.5em";
        container.style.top = "0.5em";
        container.style.display = "flex";

        super({ element: container, target: optOptions.target });

        this.container = container;
        this.mapVM = optOptions.mapVM;

        this.root = createRoot(this.container);
        this.renderToolbar();
    }

    /**
     * Re-renders the toolbar with current static and dynamic buttons.
     */
    private renderToolbar() {
        this.root.render(
            <MapToolbarContainer mapVM={this.mapVM} dynamicButtons={this.buttons} />
        );
    }

    /**
     * Allows external components to inject buttons into the toolbar.
     * @param btn A React JSX element (e.g., <IconButton> or <Tooltip> wrapped button)
     */
    public addButton(btn: JSX.Element) {
        this.buttons.push(btn);
        this.renderToolbar();
    }

    /**
     * Removes all dynamically added buttons.
     */
    public clearButtons() {
        this.buttons = [];
        this.renderToolbar();
    }
}

export default MapToolbar;
