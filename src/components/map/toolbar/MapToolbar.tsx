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
 * <button onClick={() => alert("New tool clicked")}>New Tool</button>
 * );
 */

import "@/assets/css/ol-control.css";
import { Control } from "ol/control";
import { createRoot, Root } from "react-dom/client";
import MapVM from "@/components/map/models/MapVM";
import type { IMapToolbarProps } from "@/types/typeDeclarations";
import MapToolbarContainer, { MapToolbarHandle } from "@/components/map/toolbar/MapToolbarContainer";
import React, { JSX, RefObject, useRef, useEffect } from "react";

// Define a new functional component that will actually use the hook.
// This component acts as a bridge between the OpenLayers Control and the React components.
interface InternalToolbarRendererProps {
    mapVM: MapVM;
    dynamicButtons: JSX.Element[];
    // Callback to pass the MapToolbarContainer ref back to the OL Control.
    onContainerRefReady: (ref: MapToolbarHandle | null) => void;
}

const InternalToolbarRenderer: React.FC<InternalToolbarRendererProps> = ({
                                                                             mapVM,
                                                                             dynamicButtons,
                                                                             onContainerRefReady,
                                                                         }) => {
    // This ref will be attached to MapToolbarContainer.
    // Hooks like useRef can only be called inside functional components.
    const containerRef = useRef<MapToolbarHandle | null>(null);

    // Use useEffect to call the callback when the ref is attached or changes.
    // This ensures the OpenLayers Control gets the current instance of MapToolbarContainer.
    useEffect(() => {
        // Pass the current ref value back to the parent (MapToolbar class).
        onContainerRefReady(containerRef.current);

        // Cleanup function: When this component unmounts, clear the ref in the parent.
        return () => {
            onContainerRefReady(null);
        };
    }, [onContainerRefReady]); // Dependency array: only re-run if onContainerRefReady function changes.

    return (
        <MapToolbarContainer ref={containerRef} mapVM={mapVM} dynamicButtons={dynamicButtons} />
    );
};

class MapToolbar extends Control {
    private buttons: JSX.Element[] = [];
    private root: Root;
    private container: HTMLElement;
    private mapVM: MapVM;
    // This will hold the actual instance of MapToolbarHandle received from the React component.
    // It's updated via the `handleContainerRefReady` callback.
    // private _toolbarContainerInstance: MapToolbarHandle | null = null;
    // This is the RefObject that will be returned by getToolbarContainerRef().
    // Its 'current' property will be updated when the instance is available.
    private _toolbarContainerRefObject: RefObject<MapToolbarHandle | null> = { current: null };

    constructor(optOptions: IMapToolbarProps) {
        const container = document.createElement("nav");
        container.className = "ol-control";
        container.style.left = "3.5em";
        container.style.top = "0.5em";
        container.style.display = "flex";

        super({ element: container, target: optOptions.target });

        this.container = container;
        this.mapVM = optOptions.mapVM;

        // Create a React root to render React components into the OpenLayers control's container.
        this.root = createRoot(this.container);
        this.renderToolbar();
    }

    /**
     * Callback method passed to InternalToolbarRenderer to receive the MapToolbarContainer instance.
     * This method is a class property to ensure 'this' context is bound correctly.
     * @param instance The instance of MapToolbarHandle (from MapToolbarContainer).
     */
    private handleContainerRefReady = (instance: MapToolbarHandle | null) => {
        this._toolbarContainerRefObject.current = instance;

        if (instance) {
            const event = new CustomEvent("toolbarContainerReady", { detail: instance });
            window.dispatchEvent(event);
        }
    };


    /**
     * Re-renders the toolbar with current static and dynamic buttons.
     * This method renders the `InternalToolbarRenderer` which then renders `MapToolbarContainer`.
     */
    private renderToolbar() {
        this.root.render(
            <InternalToolbarRenderer
                mapVM={this.mapVM}
                dynamicButtons={this.buttons}
                onContainerRefReady={this.handleContainerRefReady}
            />
        );
    }

    /**
     * Returns a RefObject to the MapToolbarContainer instance.
     * This method is intended to be called by external consumers of the MapToolbar OL Control
     * who need direct access to methods or properties of the MapToolbarContainer.
     * @returns A RefObject containing the MapToolbarContainer instance.
     */
    public getToolbarContainerRef(): RefObject<MapToolbarHandle | null> {
        // Return the RefObject whose 'current' property is kept updated by the callback.
        return this._toolbarContainerRefObject;
    }

    /**
     * Allows external components to inject buttons into the toolbar.
     * After adding the button, the toolbar is re-rendered to display the new button.
     * @param btn A React JSX element (e.g., <IconButton> or <Tooltip> wrapped button)
     */
    public addButton(btn: JSX.Element) {
        this.buttons.push(btn);
        this.renderToolbar();
    }

    /**
     * Removes all dynamically added buttons.
     * The toolbar is then re-rendered to reflect the changes.
     */
    public clearButtons() {
        this.buttons = [];
        this.renderToolbar();
    }
}

export default MapToolbar;
