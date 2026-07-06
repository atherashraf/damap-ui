import BaseLayer from "ol/layer/Base";
import LayerGroup from "ol/layer/Group";

import MapVM from "@damap/components/map/models/MapVM";
import MapApi, { MapAPIs } from "@damap/api/MapApi";

import AbstractDALayer from "@damap/components/map/layers/da_layers/AbstractDALayer";
import DAVectorLayer from "@damap/components/map/layers/da_layers/DAVectorLayer";
import MVTLayer from "@damap/components/map/layers/da_layers/MVTLayer";
import RasterTileLayer from "@damap/components/map/layers/da_layers/RasterTileLayer";

import OverlayVectorLayer from "@damap/components/map/layers/overlay_layers/OverlayVectorLayer";
import IDWLayer from "@damap/components/map/layers/overlay_layers/IDWLayer";
import SelectionLayer from "@damap/components/map/layers/overlay_layers/SelectionLayer";
import XYZLayer, { IXYZLayerInfo } from "@damap/components/map/layers/overlay_layers/XYZLayer";
import WMSLayer, { IGeoServerWMSInfo } from "@damap/components/map/layers/overlay_layers/WMSLayer";
import WFSLayer, { IGeoServerWFSInfo } from "@damap/components/map/layers/overlay_layers/WFSLayer";

import {
    IFeatureStyle,
    IGeoJSON,
    ILayerInfo, IMapInfo,
    isLabelableLayer,
} from "@damap/types/typeDeclarations";
import SymbologySetting from "@damap/components/map/layer_styling/SymbologySetting";

export type LayerKind =
    | "da"
    | "overlay"
    | "selection"
    | "wms"
    | "wfs"
    | "xyz"
    | "gee"
    | "group";

export type LayerWrapper =
    | AbstractDALayer
    | OverlayVectorLayer
    | IDWLayer
    | SelectionLayer
    | WMSLayer
    | WFSLayer
    | XYZLayer
    | LayerGroup;

export interface ILayerRecord {
    id: string;
    title: string;
    kind: LayerKind;
    olLayer: BaseLayer | LayerGroup;
    wrapper: LayerWrapper;
    visible: boolean;
    opacity: number;
    zIndex: number;
    groupName?: string;
    isTemporal?: boolean;
    raw?: any;
}

export interface ILayerTreeGroup {
    id: string;
    title: string;
    group: LayerGroup | null;
    layers: ILayerRecord[];
}

class LayerManager {
    private readonly mapVM: MapVM;
    private readonly api: MapApi;
    public static readonly GROUP_Z_STEP = 100;

    private registry = new Map<string, ILayerRecord>();

    private daLayerIds = new Set<string>();
    private overlayLayerIds = new Set<string>();
    private geeLayerIds = new Set<string>();
    private temporalLayerIds = new Set<string>();

    constructor(mapVM: MapVM, api?: MapApi) {
        this.mapVM = mapVM;
        this.api = api || mapVM.getApi();
    }

    public exists(id: string): boolean {
        return this.registry.has(id);
    }

    public getLayerRecord(id: string): ILayerRecord | undefined {
        return this.registry.get(id);
    }

    public getAllLayerRecords(): ILayerRecord[] {
        return Array.from(this.registry.values());
    }

    public getLayersByKind(kind: LayerKind): ILayerRecord[] {
        return this.getAllLayerRecords().filter((r) => r.kind === kind);
    }

    public findLayerByTitle(title: string): ILayerRecord | undefined {
        const normalized = title.trim().toLowerCase();
        return this.getAllLayerRecords().find(
            (r) => r.title?.trim().toLowerCase() === normalized
        );
    }

    private isLayerAttached(targetLayer: BaseLayer | LayerGroup): boolean {
        let found = false;

        this.mapVM.getMap().getLayers().forEach((layer) => {
            if (layer === targetLayer) found = true;

            if (layer instanceof LayerGroup) {
                const subLayers = layer.getLayers().getArray();
                if (subLayers.includes(targetLayer as BaseLayer)) {
                    found = true;
                }
            }
        });

        return found;
    }

    public getTemporalLayerRecords(): ILayerRecord[] {
        return this.getAllLayerRecords().filter((r) => r.isTemporal);
    }

    public getTemporalLayerTitles(): string[] {
        return this.getTemporalLayerRecords().map((r) => r.title);
    }

    public isDALayerExists(uuid: string): boolean {
        return this.daLayerIds.has(uuid) && this.exists(uuid);
    }

    public isOverlayLayerExist(uuid: string): boolean {
        return this.overlayLayerIds.has(uuid) && this.exists(uuid);
    }

    public isGEELayerExist(uuid: string): boolean {
        const rec = this.registry.get(uuid);
        if (!rec || !this.geeLayerIds.has(uuid)) return false;
        return this.isLayerAttached(rec.olLayer);
    }

    public getDALayer(layerId: string | undefined): AbstractDALayer | undefined {
        if (!layerId) return undefined;
        const rec = this.registry.get(layerId);
        if (!rec || rec.kind !== "da") return undefined;
        return rec.wrapper as AbstractDALayer;
    }

    public getDALayerByTitle(title: string): AbstractDALayer | undefined {
        const rec = this.findLayerByTitle(title);
        if (!rec || rec.kind !== "da") return undefined;
        return rec.wrapper as AbstractDALayer;
    }

    public getOverlayLayer(key: string):
        | OverlayVectorLayer
        | IDWLayer
        | SelectionLayer
        | WMSLayer
        | WFSLayer
        | undefined {
        const rec = this.registry.get(key);
        if (!rec) return undefined;
        if (["overlay", "selection", "wms", "wfs"].includes(rec.kind)) {
            return rec.wrapper as any;
        }
        return undefined;
    }

    public getOverlayLayerByTitle(title: string):
        | OverlayVectorLayer
        | IDWLayer
        | SelectionLayer
        | WMSLayer
        | WFSLayer
        | undefined {
        const rec = this.findLayerByTitle(title);
        if (!rec) return undefined;
        if (["overlay", "selection", "wms", "wfs"].includes(rec.kind)) {
            return rec.wrapper as any;
        }
        return undefined;
    }

    public async addDALayer(
        info: {
            uuid: string;
            style?: IFeatureStyle;
            visible?: boolean;
            zoomRange?: [number, number];
            opacity?: number;
            zIndex?: number;
            groupName?: string;
        },
        index: number = 0
    ): Promise<AbstractDALayer | undefined> {
        const { uuid } = info;
        if (this.isDALayerExists(uuid)) {
            return this.getDALayer(uuid);
        }

        this.mapVM.getMapLoadingRef()?.current?.openIsLoading();

        try {
            const payload: ILayerInfo | null = await this.api.get(MapAPIs.DCH_LAYER_INFO, { uuid });
            if (!payload) return undefined;

            payload.zIndex = info.zIndex ?? index;
            if (info.style) payload.style = info.style;
            if (info.zoomRange) payload.zoomRange = info.zoomRange;

            this.mapVM.showSnackbar(`Adding ${payload.title} Layer`);

            const daLayer = this.createDALayerInternal(payload);
            if (!daLayer) return undefined;

            const olLayer = daLayer.getOlLayer();
            if (!olLayer) {
                this.mapVM.showSnackbar(`Open Layer not Found`);
                return undefined;
            }
            const visible = info.visible ?? true;
            const opacity = info.opacity ?? 1;
            const zIndex = info.zIndex ?? index;

            olLayer.setVisible(visible);
            olLayer.setOpacity(opacity);
            olLayer.setZIndex(zIndex);
            olLayer.set("uuid", payload.uuid);
            olLayer.set("title", payload.title);
            olLayer.set("name", payload.uuid);
            olLayer.set("layerType", "da");

            const record: ILayerRecord = {
                id: payload.uuid,
                title: payload.title,
                kind: "da",
                olLayer,
                wrapper: daLayer,
                visible,
                opacity,
                zIndex,
                groupName: info.groupName,
                isTemporal: !!payload.dateRangeURL,
                raw: payload,
            };

            this.registerRecord(record);

            if (record.isTemporal) {
                this.temporalLayerIds.add(record.id);
                window.dispatchEvent(new CustomEvent("temporalLayerAdded", { detail: { uuid: record.id } }));
            }

            this.attachRecord(record);
            this.dispatchLayerTreeChanged();

            return daLayer;
        } catch (error) {
            console.error("addDALayer failed:", error);
            return undefined;
        } finally {
            this.mapVM.getMapLoadingRef()?.current?.closeIsLoading();
        }
    }

    public addOverlayLayer(
        overlayLayer: IDWLayer | OverlayVectorLayer | SelectionLayer | WMSLayer | WFSLayer,
        options?: { kind?: LayerKind; groupName?: string }
    ) {
        const olLayer = overlayLayer.olLayer;
        const id = olLayer.get("name") || olLayer.get("uuid") || olLayer.get("title");

        if (!id) {
            console.warn("Overlay layer must have a stable name/uuid/title");
            return undefined;
        }

        if (this.exists(id)) return this.getOverlayLayer(id);

        const title = olLayer.get("title") || id;
        const kind = options?.kind || this.resolveKindFromOverlayWrapper(overlayLayer);

        // const record: ILayerRecord = {
        //     id,
        //     title,
        //     kind,
        //     olLayer,
        //     wrapper: overlayLayer,
        //     visible: olLayer.getVisible?.() ?? true,
        //     opacity: olLayer.getOpacity?.() ?? 1,
        //     zIndex: olLayer.getZIndex?.() ?? 0,
        //     groupName: options?.groupName || olLayer.get("groupName"),
        //     raw: overlayLayer,
        // };
        const record: ILayerRecord = {
            id,
            title,
            kind,
            olLayer,
            wrapper: overlayLayer,
            visible: olLayer.getVisible?.() ?? true,
            opacity: olLayer.getOpacity?.() ?? 1,
            zIndex: olLayer.getZIndex?.() ?? 0,
            groupName: (options?.groupName || olLayer.get("groupName")) ?? undefined, // <-- FIX HERE
            raw: overlayLayer,
        };

        this.registerRecord(record);
        this.attachRecord(record);

        if (olLayer.get("displayInLayerSwitcher") === true) {
            this.dispatchLayerTreeChanged();
        }

        return overlayLayer;
    }

    public addGEELayer(layerInfo: IXYZLayerInfo): XYZLayer | undefined {
        if (this.isGEELayerExist(layerInfo.uuid)) {
            this.mapVM.getSnackbarRef()?.current?.show("Layer already exists");
            return this.registry.get(layerInfo.uuid)?.wrapper as XYZLayer;
        }

        const xyzLayer = this.createXYZLayerInternal(layerInfo);

        const record: ILayerRecord = {
            id: layerInfo.uuid,
            title: layerInfo.title || layerInfo.name || layerInfo.uuid,
            kind: "gee",
            olLayer: xyzLayer.olLayer,
            wrapper: xyzLayer,
            visible: xyzLayer.olLayer.getVisible?.() ?? true,
            opacity: xyzLayer.olLayer.getOpacity?.() ?? 1,
            zIndex: xyzLayer.olLayer.getZIndex?.() ?? 0,
            groupName: xyzLayer.olLayer.get("groupName"),
            raw: layerInfo,
        };

        this.registerRecord(record);
        this.attachRecord(record);

        return xyzLayer;
    }

    public createWMSLayer(info: IGeoServerWMSInfo): WMSLayer | undefined {
        const uuid = info.uuid;
        if (!uuid) return undefined;

        if (this.exists(uuid)) {
            return this.registry.get(uuid)?.wrapper as WMSLayer;
        }

        const wms = this.createWMSLayerInternal(info);
        const olLayer = wms.olLayer;
        olLayer.set("uuid", info.uuid);
        olLayer.set("name", info.name || info.uuid);
        olLayer.set("title", info.title || info.name || info.uuid);
        olLayer.set("layerType", "wms");

        const record: ILayerRecord = {
            id: info.uuid,
            title: info.title || info.name || info.uuid,
            kind: "wms",
            olLayer,
            wrapper: wms,
            visible: olLayer.getVisible?.() ?? true,
            opacity: olLayer.getOpacity?.() ?? 1,
            zIndex: olLayer.getZIndex?.() ?? 0,
            groupName: olLayer.get("groupName"),
            raw: info,
        };

        this.registerRecord(record);
        this.attachRecord(record);

        return wms;
    }

    public createWFSLayer(info: IGeoServerWFSInfo): WFSLayer | undefined {
        const uuid = info.uuid;
        if (!uuid) return undefined;

        if (this.exists(uuid)) {
            return this.registry.get(uuid)?.wrapper as WFSLayer;
        }

        const wfs = this.createWFSLayerInternal(info);
        const olLayer = wfs.olLayer;
        olLayer.set("uuid", info.uuid);
        olLayer.set("name", info.name || info.uuid);
        olLayer.set("title", info.title);
        olLayer.set("layerType", "wfs");

        const record: ILayerRecord = {
            id: info.uuid,
            title: info.title,
            kind: "wfs",
            olLayer,
            wrapper: wfs,
            visible: olLayer.getVisible?.() ?? true,
            opacity: olLayer.getOpacity?.() ?? 1,
            zIndex: olLayer.getZIndex?.() ?? 0,
            groupName: olLayer.get("groupName"),
            raw: info,
        };

        this.registerRecord(record);
        this.attachRecord(record);

        return wfs;
    }

    public createOverlayLayer(
        uuid: string,
        geoJSON: IGeoJSON,
        title: string,
        style?: IFeatureStyle
    ): OverlayVectorLayer | undefined {
        if (this.exists(uuid)) {
            return this.registry.get(uuid)?.wrapper as OverlayVectorLayer;
        }

        const overlayVectorLayer = new OverlayVectorLayer(
            { uuid, title, style: style || MapVM.getDefaultStyle(), showLabel: false },
            this.mapVM
        );
        overlayVectorLayer.addGeojsonFeature(geoJSON);

        const olLayer = overlayVectorLayer.olLayer;
        olLayer.set("uuid", uuid);
        olLayer.set("name", uuid);
        olLayer.set("title", title);
        olLayer.set("layerType", "overlay");

        const record: ILayerRecord = {
            id: uuid,
            title,
            kind: "overlay",
            olLayer,
            wrapper: overlayVectorLayer,
            visible: olLayer.getVisible?.() ?? true,
            opacity: olLayer.getOpacity?.() ?? 1,
            zIndex: olLayer.getZIndex?.() ?? 0,
            groupName: olLayer.get("groupName"),
            raw: geoJSON,
        };

        this.registerRecord(record);
        this.attachRecord(record);

        return overlayVectorLayer;
    }

    public removeLayer(id: string): void {
        const record = this.registry.get(id);
        if (!record) return;

        this.detachLayer(record.olLayer);
        this.unregisterRecord(id);

        if (this.mapVM.getAttributeTableManager().getTableLayerUUID() === id) {
            this.mapVM.getAttributeTableManager().clearTableContext();
            this.mapVM.getBottomDrawerRef().current?.closeDrawer();
        }

        if (this.mapVM.getLayerOfInterest() === id) {
            this.mapVM.setLayerOfInterest("", false);
        }

        this.refreshLayerTree();
    }

    public removeDALayer(uuid: string): void {
        this.removeLayer(uuid);
    }

    public removeOverlayLayer(uuid: string): void {
        this.removeLayer(uuid);
    }

    private initializeGroup(
        group: LayerGroup,
        groupKey: string,
        groupName: string,
        collapsed = false
    ): void {
        group.set("title", groupName);
        group.set("name", groupKey);
        group.set("groupKey", groupKey);
        group.set("groupName", groupName);
        group.set("layerType", "group");
        group.set("fold", collapsed ? "close" : "open");
        group.set("collapsed", collapsed);
        group.set("openInLayerSwitcher", true);
        group.set("isUserGroup", true);
    }

    public findParentGroup(layer: BaseLayer): LayerGroup | null {
        if (!layer) return null;
        const targetUid = (layer as any).ol_uid;
        const targetUuid = layer.get("uuid") || layer.get("name");

        for (const group of this.getLayerGroups()) {
            const arr = group.getLayers().getArray();
            if (arr.includes(layer)) return group;

            const match = arr.some((l: any) => {
                if (targetUid && l.ol_uid === targetUid) return true;
                if (targetUuid && (l.get("uuid") === targetUuid || l.get("name") === targetUuid)) return true;
                return false;
            });
            if (match) return group;
        }
        return null;
    }

    public getLayerTree(): ILayerTreeGroup[] {
        const groups = new Map<string, ILayerTreeGroup>();

        this.getAllLayerRecords()
            .filter((r) => r.kind !== "group" && r.kind !== "selection")
            .forEach((record) => {
                const parent = this.findParentGroup(record.olLayer as BaseLayer);
                const isBase = record.olLayer.get("baseLayer") === true || parent?.get("title") === "Base Layers";
                if (isBase) return;

                const rawKey = parent?.get("groupKey") || parent?.get("name");
                const key: string = (typeof rawKey === 'string' ? rawKey : null) ?? "__ungrouped__";

                // const key = parent?.get("groupKey") || parent?.get("name") || "__ungrouped__";

                if (!groups.has(key)) {
                    groups.set(key, {
                        id: key,
                        title: parent?.get("title") || "Layers",
                        group: parent,
                        layers: [],
                    });
                }
                groups.get(key)!.layers.push(record);
            });

        const result = Array.from(groups.values());

        result.forEach((g) => {
            g.layers.sort((a, b) => {
                const zA = a.olLayer.getZIndex?.() ?? 0;
                const zB = b.olLayer.getZIndex?.() ?? 0;
                if (zB !== zA) return zB - zA;
                return b.id.localeCompare(a.id);
            });
        });

        result.sort((a, b) => {
            const za = a.group?.getZIndex?.() ?? Math.max(...a.layers.map(l => l.olLayer.getZIndex?.() ?? 0), 0);
            const zb = b.group?.getZIndex?.() ?? Math.max(...b.layers.map(l => l.olLayer.getZIndex?.() ?? 0), 0);
            return zb - za;
        });

        return result;
    }

    public getLayerGroups = (): LayerGroup[] => {
        return this.mapVM
            .getMap()
            .getLayers()
            .getArray()
            .filter((layer: any) => layer instanceof LayerGroup && layer.get("title") !== "Base Layers") as LayerGroup[];
    };

    public getOrCreateGroup(
        groupName: string,
        options?: { groupKey?: string; collapsed?: boolean; zIndex?: number }
    ): LayerGroup {
        const rawKey = options?.groupKey || groupName;
        const groupKey = rawKey.replace(/^group:/, ""); // Strip explicit layout prefix leaks
        const collapsed = options?.collapsed ?? false;

        // const existing = this.getLayerGroups().find(
        //     (g) => g.get("groupKey") === groupKey || g.get("name") === groupKey || g.get("title") === groupName
        // );

        const existing = this.getLayerGroups().find(
            (g) => {
                const gk = g.get("groupKey");
                const nm = g.get("name");
                const tt = g.get("title");
                return gk === groupKey || nm === groupKey || tt === groupName;
            }
        );

        if (existing) {
            this.initializeGroup(existing, groupKey, groupName, collapsed);
            if (options?.zIndex !== undefined) {
                existing.setZIndex(options.zIndex);
                existing.set("zIndex", options.zIndex);
            }
            existing.changed();
            return existing;
        }

        const group = new LayerGroup({ layers: [], visible: true, opacity: 1 });
        this.initializeGroup(group, groupKey, groupName, collapsed);

        if (options?.zIndex !== undefined) {
            group.setZIndex(options.zIndex);
            group.set("zIndex", options.zIndex);
        }

        this.mapVM.getMap().addLayer(group);
        group.changed();

        const record: ILayerRecord = {
            id: groupKey, // Keep clean structural matching alignment keys
            title: groupName,
            kind: "group",
            olLayer: group,
            wrapper: group,
            visible: true,
            opacity: 1,
            zIndex: group.getZIndex?.() ?? 0,
            groupName,
            raw: { groupKey, groupName },
        };

        if (!this.registry.has(record.id)) {
            this.registry.set(record.id, record);
        }

        return group;
    }

    public moveLayerToGroup(
        id: string,
        groupInfo?: { key: string; title: string; collapsed?: boolean } | string
    ): void {
        const currentRecord = this.registry.get(id);
        if (!currentRecord) {
            console.warn("moveLayerToGroup: layer record not found", id);
            return;
        }

        const groupTitle = typeof groupInfo === "string" ? groupInfo : groupInfo?.title;
        const groupKey = typeof groupInfo === "string" ? groupInfo : groupInfo?.key;

        // 1. Physically break out the OpenLayers array linkages
        this.detachLayer(currentRecord.olLayer);

        let targetZ = 1;
        const nextGroupName = groupTitle ?? undefined;

        if (groupTitle) {
            const cleanGroupKey = groupKey ? groupKey.replace(/^group:/, "") : groupTitle;
            const group = this.getOrCreateGroup(groupTitle, { groupKey: cleanGroupKey, collapsed: false });

            currentRecord.olLayer.set("groupName", groupTitle);
            currentRecord.olLayer.set("groupKey", cleanGroupKey);
            currentRecord.olLayer.set("groupTitle", groupTitle);

            this.attachToGroup(currentRecord.olLayer, group);

            const groupBaseZ = group.getZIndex?.() ?? group.get("zIndex") ?? 100;
            const siblingCount = group.getLayers().getLength();
            targetZ = groupBaseZ + siblingCount + 1;

            group.set("fold", "open");
            group.set("collapsed", false);
            group.set("openInLayerSwitcher", true);
            group.changed();
        } else {
            currentRecord.olLayer.unset?.("groupName", true);
            currentRecord.olLayer.unset?.("groupKey", true);
            currentRecord.olLayer.unset?.("groupTitle", true);

            this.attachToRoot(currentRecord.olLayer);
        }

        currentRecord.olLayer.setZIndex(targetZ);
        currentRecord.olLayer.set("zIndex", targetZ);
        currentRecord.olLayer.changed();

        // 2. IMMUTABLE UPDATE: Create a completely new object reference for the registry record
        const updatedRecord: ILayerRecord = {
            ...currentRecord,
            groupName: nextGroupName,
            zIndex: targetZ,
            visible: currentRecord.olLayer.getVisible?.() ?? currentRecord.visible,
            opacity: currentRecord.olLayer.getOpacity?.() ?? currentRecord.opacity
        };

        // 3. Write back the distinct reference clone to trigger downstream component changes
        this.registry.set(id, updatedRecord);

        // 4. Force global broadcast synchronization pass
        this.refreshLayerTree();
    }

    private refreshLayerTree() {
        this.mapVM.getMap().getLayers().changed();
        this.mapVM.getMap().renderSync?.();
        this.mapVM.getMap().render();

        setTimeout(() => {
            this.dispatchLayerTreeChanged();
        }, 50);
    }

    public reorderRootGroups(groupIds: string[]): void {
        const totalGroups = groupIds.length;

        groupIds.forEach((groupId, groupIndex) => {
            const group = this.getLayerGroups().find(
                (g) =>
                    g.get("groupKey") === groupId ||
                    g.get("name") === groupId ||
                    `group-${g.get("groupKey")}` === groupId
            );

            if (!group) return;

            const groupBaseZ = LayerManager.GROUP_Z_STEP * (totalGroups - groupIndex);

            group.setZIndex(groupBaseZ);
            group.set("zIndex", groupBaseZ);

            // IMPORTANT:
            // preserve existing child order instead of using raw collection order
            const children = group
                .getLayers()
                .getArray()
                .slice()
                .sort(
                    (a: any, b: any) =>
                        (b.getZIndex?.() ?? 0) - (a.getZIndex?.() ?? 0)
                );

            children.forEach((layer: any, layerIndex: number) => {
                const childZ = groupBaseZ + (children.length - layerIndex);

                layer.setZIndex(childZ);
                layer.set("zIndex", childZ);
                layer.changed();

                const id = layer.get("uuid") || layer.get("name");
                const record = id ? this.getLayerRecord(id) : undefined;

                if (record) {
                    record.zIndex = childZ;
                }
            });

            group.changed();
        });


        this.refreshLayerTree();
    }

    public reorderLayersInGroup(groupId: string, layerIds: string[]): void {
        const cleanGroupId = groupId.replace(/^group:/, "");
        const group = this.getLayerGroups().find(
            (g) => g.get("groupKey") === cleanGroupId || g.get("name") === cleanGroupId || g.get("title") === cleanGroupId
        );

        const isUngrouped = cleanGroupId === "__ungrouped__";
        const groupBaseZ = isUngrouped
            ? LayerManager.GROUP_Z_STEP * (this.getLayerGroups().length + 1)
            : group?.getZIndex?.() ?? group?.get("zIndex") ?? 100;

        const total = layerIds.length;

        layerIds.forEach((layerId, index) => {
            const record = this.getLayerRecord(layerId);
            if (!record) return;

            const z = groupBaseZ + (total - index);
            record.zIndex = z;
            record.olLayer.setZIndex(z);
            record.olLayer.set("zIndex", z);
            record.olLayer.changed();
        });

        if (group) group.changed();
        this.refreshLayerTree();
    }

    public async restoreFromMapInfo(mapInfo: IMapInfo): Promise<void> {
        const savedLayers = mapInfo.layers || [];
        const savedGroups = mapInfo.groups || [];
        const groupTitleByKey = new Map<string, string>();

        savedGroups.forEach((g: any) => {
            const cleanKey = g.key.replace(/^group:/, "");
            groupTitleByKey.set(cleanKey, g.title);
            this.getOrCreateGroup(g.title, { groupKey: cleanKey });
            this.getOrCreateGroup(g.title).set("fold", g.collapsed ? "close" : "open");
        });

        // Find this block inside restoreFromMapInfo:
        for (const [index, layerInfo] of savedLayers.entries()) {
            if (layerInfo.isBase) continue;

            const cleanGroupKey = layerInfo.groupKey ? layerInfo.groupKey.replace(/^group:/, "") : undefined;

            // --- FIX HERE ---
            // Ensure that if it evaluates to null, it safely defaults to undefined (or your fallback string)
            const groupName: string | undefined = (cleanGroupKey ? groupTitleByKey.get(cleanGroupKey) : undefined)
                || layerInfo.groupTitle
                || undefined; // forces any trailing null values into undefined

            if (layerInfo.uuid && layerInfo.uuid !== "-1" && layerInfo.type !== "wms") {
                const daLayer = await this.addDALayer({
                    uuid: layerInfo.uuid,
                    style: layerInfo.style,
                    visible: layerInfo.visible,
                    opacity: layerInfo.opacity,
                    zIndex: layerInfo.zIndex === 0 ? index + 1 : layerInfo.zIndex ?? index,
                    groupName, // Now cleanly matches string | undefined
                    zoomRange: layerInfo.zoomRange,
                }, index);

                this.applySavedTextStyleToLayer(daLayer, layerInfo.style);
                continue;
            }



            if (layerInfo.type === "wms") {
                const params = layerInfo.params || {};
                const uuid = layerInfo.name || params.uuid || MapVM.generateUUID();

                const wms = this.createWMSLayer({
                    uuid,
                    name: uuid,
                    title: params.title || layerInfo.key || layerInfo.title || "WMS Layer",
                    url: params.url,
                    layers: params.layers,
                    tiled: params.tiled ?? true,
                    format: params.format ?? "image/png",
                    transparent: params.transparent ?? true,
                    version: params.version ?? "1.3.0",
                    visible: layerInfo.visible ?? params.visible ?? true,
                    opacity: layerInfo.opacity ?? params.opacity ?? 1,
                    zIndex: layerInfo.zIndex ?? params.zIndex ?? 600 + index,
                });

                if (wms?.olLayer && groupName) {
                    this.moveLayerToGroup(uuid, { key: cleanGroupKey || groupName, title: groupName });
                }
            }
        }
    }

    // =========================================================
    //  Layer Styling / Designer
    // =========================================================
    public openLayerDesigner(layerId: string): void {
        const record = this.getLayerRecord(layerId);
        if (!record) {
            window.customAlert?.("Layer not found.");
            return;
        }

        if (record.kind !== "da") {
            window.customAlert?.(
                <div>
                    <b>Style not available</b><br />
                    Symbology editing is currently available only for DA layers.
                </div>
            );
            return;
        }

        this.mapVM.setLayerOfInterest(layerId);
        this.mapVM.getRightDrawerRef()?.current?.setContent(
            `Style: ${record.title}`,
            <SymbologySetting key={`symbology-${layerId}`} mapVM={this.mapVM} layerId={layerId} />
        );
        this.mapVM.getRightDrawerRef()?.current?.openDrawer();
    }

    // =========================================================
    // State updates
    // =========================================================

    public setVisible(id: string, visible: boolean): void {
        const rec = this.registry.get(id);
        if (!rec) return;
        rec.visible = visible;
        rec.olLayer.setVisible(visible);
    }

    public setOpacity(id: string, opacity: number): void {
        const rec = this.registry.get(id);
        if (!rec) return;
        rec.opacity = opacity;
        rec.olLayer.setOpacity(opacity);
    }

    public setZIndex(id: string, zIndex: number): void {
        const rec = this.registry.get(id);
        if (!rec) return;
        rec.zIndex = zIndex;
        rec.olLayer.setZIndex(zIndex);
    }

    public refreshDALayer(id: string): void {
        this.getDALayer(id)?.refreshLayer();
    }

    public refreshAllDALayers(): void {
        for (const id of this.daLayerIds) {
            this.getDALayer(id)?.refreshLayer();
        }
    }

    // =========================================================
    // Internal factory methods
    // =========================================================

    private createDALayerInternal(payload: ILayerInfo): AbstractDALayer {
        if (payload?.dataModel === "V") {
            return payload.format === "WFS" ? new DAVectorLayer(payload, this.mapVM) : new MVTLayer(payload, this.mapVM);
        }
        return new RasterTileLayer(payload, this.mapVM);
    }

    private createWMSLayerInternal(info: IGeoServerWMSInfo): WMSLayer {
        return new WMSLayer(info, this.mapVM);
    }

    private createWFSLayerInternal(info: IGeoServerWFSInfo): WFSLayer {
        return new WFSLayer(info, this.mapVM);
    }

    private createXYZLayerInternal(info: IXYZLayerInfo): XYZLayer {
        return new XYZLayer(info, this.mapVM);
    }

    // =========================================================
    // Internal helpers
    // =========================================================

    private registerRecord(record: ILayerRecord): void {
        this.registry.set(record.id, record);

        if (record.kind === "da") this.daLayerIds.add(record.id);
        if (
            record.kind === "overlay" ||
            record.kind === "selection" ||
            record.kind === "wms" ||
            record.kind === "wfs"
        ) {
            this.overlayLayerIds.add(record.id);
        }
        if (record.kind === "gee") this.geeLayerIds.add(record.id);
    }

    private unregisterRecord(id: string): void {
        const rec = this.registry.get(id);
        if (!rec) return;

        this.daLayerIds.delete(id);
        this.overlayLayerIds.delete(id);
        this.geeLayerIds.delete(id);
        this.temporalLayerIds.delete(id);

        this.registry.delete(id);
    }

    private attachRecord(record: ILayerRecord): void {
        if (record.groupName) {
            const group = this.getOrCreateGroup(record.groupName);
            this.attachToGroup(record.olLayer, group);
        } else {
            this.attachToRoot(record.olLayer);
        }
    }



    private attachToGroup(layer: BaseLayer | LayerGroup, group: LayerGroup): void {
        const rootLayers = this.mapVM.getMap().getLayers();
        if (rootLayers.getArray().includes(layer)) rootLayers.remove(layer);

        const groupLayers = group.getLayers();
        if (!groupLayers.getArray().includes(layer)) groupLayers.push(layer);

        groupLayers.changed();
        group.changed();
        layer.changed();
    }

    private attachToRoot(layer: BaseLayer | LayerGroup): void {
        const rootLayers = this.mapVM.getMap().getLayers();
        if (!rootLayers.getArray().includes(layer)) rootLayers.push(layer);
        rootLayers.changed();
        layer.changed();
    }

    private detachLayer(layer: BaseLayer | LayerGroup): void {
        this.mapVM.getMap().getLayers().remove(layer);
        this.getLayerGroups().forEach((group) => group.getLayers().remove(layer));
    }

    private resolveKindFromOverlayWrapper(wrapper: any): LayerKind {
        if (wrapper instanceof WMSLayer) return "wms";
        if (wrapper instanceof WFSLayer) return "wfs";
        if (wrapper instanceof SelectionLayer) return "selection";
        return "overlay";
    }

    private dispatchLayerTreeChanged() {
        window.dispatchEvent(new Event("LayerTreeChanged"));
    }

    private applySavedTextStyleToLayer(daLayer: AbstractDALayer | undefined, style?: IFeatureStyle) {
        if (!daLayer || !style?.text || !isLabelableLayer(daLayer)) return;
        daLayer.setLabelProperty(style.text.labelField || "");
        daLayer.setTextStyle(style.text.style || {});
        daLayer.setShowLabel(style.text.showLabel ?? true);
        if (style.text.minLabelZoom !== undefined) daLayer.layerInfo.minLabelZoom = style.text.minLabelZoom;
        if (style.text.maxLabelZoom !== undefined) daLayer.layerInfo.maxLabelZoom = style.text.maxLabelZoom;
        daLayer.updateStyle();
    }

    public registerExistingDALayer(daLayer: AbstractDALayer, options?: {
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
        groupName?: string;
    }) {
        const olLayer = daLayer.getOlLayer();
        if (!olLayer) {
            this.mapVM.showSnackbar("OpenLayer Not found")
            return
        }
        const id = olLayer.get("uuid") || MapVM.generateUUID();

        olLayer.set("uuid", id);

        const record: ILayerRecord = {
            id,
            title: daLayer.getLayerTitle?.() || id,
            kind: "da",
            olLayer,
            wrapper: daLayer,
            visible: options?.visible ?? true,
            opacity: options?.opacity ?? 1,
            zIndex: options?.zIndex ?? 0,
            groupName: options?.groupName,
            raw: daLayer,
        };

        this.registerRecord(record);
        this.attachRecord(record);

        return daLayer;
    }

    public hasTemporalLayers(): boolean { return this.temporalLayerIds.size > 0; }
}

export default LayerManager;