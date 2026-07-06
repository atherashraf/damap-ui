import {MapVM} from "@/libs/damap";
import {LayerMenuState} from "./types";
import BaseLayer from "ol/layer/Base";
import LayerGroup from "ol/layer/Group";
import * as React from "react";

type LayerItem = any;

class LayerSwitcherManager {
    private mapVM: MapVM;
    private setMenuState?: React.Dispatch<React.SetStateAction<LayerMenuState | null>>;

    constructor(mapVM: MapVM) {
        this.mapVM = mapVM;
    }

    registerContextMenuHandlers(params: {
        setMenuState: React.Dispatch<React.SetStateAction<LayerMenuState | null>>;
    }) {
        this.setMenuState = params.setMenuState;
    }


    // private normalizeItem(item: any): { layer: BaseLayer | null; title: string; raw: any } {
    //     if (!item) return {layer: null, title: "", raw: item};
    //
    //     if (item.layer) {
    //         return {
    //             layer: item.layer,
    //             title: item.title || item.layer.get("title") || item.layer.get("name") || "Layer",
    //             raw: item,
    //         };
    //     }
    //
    //     return {
    //         layer: item,
    //         title: item.get?.("title") || item.get?.("name") || "Layer",
    //         raw: item,
    //     };
    // }

    private normalizeItem(item: any): { layer: BaseLayer | null; title: string; raw: any } {
        if (!item) return { layer: null, title: "", raw: item };

        // Support both wrapper conventions (.layer or .olLayer)
        const activeLayer = item.layer || item.olLayer;

        if (activeLayer) {
            return {
                layer: activeLayer,
                title: item.title || activeLayer.get("title") || activeLayer.get("name") || "Layer",
                raw: item,
            };
        }

        if (typeof item.get === "function") {
            return {
                layer: item,
                title: item.get("title") || item.get("name") || "Layer",
                raw: item,
            };
        }

        return { layer: null, title: "", raw: item };
    }

    onAboutLayer = (item: LayerItem) => {
        const normalized = this.normalizeItem(item);
        if (!normalized.layer) return;

        const layer = normalized.layer;

        window.customAlert?.(
            <div>
                <b>Layer Information</b><br/>
                Layer: {layer.get("title") || normalized.title}<br/>
                Name: {layer.get("name")}<br/>
                Type: {layer.get("layerType")}<br/>
                Z-Index: {layer.getZIndex?.()}<br/>
            </div>
        );

        this.closeContextMenu();
    };

    onAttributeTable = (item: LayerItem) => {
        const normalized = this.normalizeItem(item);
        if (!normalized.layer) return;

        this.mapVM.setLayerOfInterest(normalized.layer.get("name"));
        this.mapVM.openAttributeTable();
        this.closeContextMenu();
    };

    onZoomToLayer = async (item: LayerItem) => {
        const normalized = this.normalizeItem(item);
        if (!normalized.layer) return;

        const layer: any = normalized.layer;

        const extent =
            layer.get("dataExtent") ||
            layer.getSource?.()?.getExtent?.() ||
            layer.getExtent?.();

        if (extent) {
            this.mapVM.zoomToExtent(extent);
        }

        this.closeContextMenu();
    };

    onRemoveLayer = async (item: LayerItem) => {
        const normalized = this.normalizeItem(item);
        if (!normalized.layer) return;

        const res = await window.customConfirm(
            "Do you want to remove layer?",
            "Yes"
        );

        if (!res) return;

        const layerId =
            normalized.layer.get("uuid") ||
            normalized.layer.get("name");

        if (!layerId) {
            window.alert("Layer id not found.");
            return;
        }

        this.mapVM.getLayerManager().removeLayer(layerId);

        this.closeContextMenu();
    };

    showLayerZIndex = (item: LayerItem) => {
        const normalized = this.normalizeItem(item);
        if (!normalized.layer) return;

        const zIndex = this.mapVM.getLayerZIndex(normalized.layer);
        window.alert("layer zIndex: " + zIndex);
    };

    onLayerStyle = (item: LayerItem) => {
        const normalized = this.normalizeItem(item);
        if (!normalized.layer) return;

        const layerId =
            normalized.layer.get("uuid") ||
            normalized.layer.get("name");

        if (!layerId) {
            window.customAlert?.("Layer id not found.");
            return;
        }

        this.mapVM.getLayerManager().openLayerDesigner(layerId);
        this.closeContextMenu();
    };

    // moveMenuItemToGroup = (
    //     item: LayerItem,
    //     group: { key: string; title: string; collapsed?: boolean }
    // ) => {
    //     const normalized = this.normalizeItem(item);
    //
    //     if (!normalized.layer) {
    //         window.alert("Layer not found");
    //         return;
    //     }
    //
    //     const layerId =
    //         normalized.layer.get("uuid") ||
    //         normalized.layer.get("name");
    //
    //     if (!layerId) {
    //         window.alert("Layer id not found");
    //         return;
    //     }
    //
    //     this.mapVM.getLayerManager().moveLayerToGroup(layerId, {
    //         key: group.key,
    //         title: group.title,
    //         collapsed: false,
    //     });
    //
    //     this.closeContextMenu();
    // };
    moveMenuItemToGroup = (
        item: LayerItem,
        group: { key: string; title: string; collapsed?: boolean }
    ) => {
        console.log("group", group);
        const normalized = this.normalizeItem(item);
        console.log("normalized item", normalized);
        if (!normalized.layer) {
            window.alert("Layer target instance not found");
            return;
        }

        // Comprehensive extraction order: explicit property value -> key bindings -> fallback title queries
        const layerId =
            normalized.layer.get("uuid") ||
            normalized.layer.get("name") ||
            item.id; // Fallback to wrapper id if passing an ILayerRecord directly
        console.log("layer uuid", layerId)
        if (!layerId) {
            window.alert("Layer unique identification missing.");
            return;
        }

        this.mapVM.getLayerManager().moveLayerToGroup(layerId, {
            key: group.key,
            title: group.title,
            collapsed: group.collapsed ?? false,
        });

        this.closeContextMenu();
    };

    getLayerGroups = (): LayerGroup[] => {
        return this.mapVM.getLayerManager().getLayerGroups();
    };

    closeContextMenu = () => {
        this.setMenuState?.(null);
    };
}

export default LayerSwitcherManager;