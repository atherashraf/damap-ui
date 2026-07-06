// import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import MapVM from "@damap/components/map/models/MapVM";
import { MapAPIs } from "@damap/api/MapApi";
import { useMapVM } from "@damap/damap";
// import { Group } from "ol/layer";
import LayerGroup from "ol/layer/Group";

interface GroupData {
    key: string;
    title: string;
    order: number;
    collapsed: boolean;
}

interface LayerData {
    uuid: string;
    name: string;
    title: string;
    visible: boolean;
    opacity: number;
    zIndex: number;
    style?: any;
    groupKey?: string | null;
    groupTitle?: string | null;
}

interface OtherLayerData {
    uuid: string;
    name: string;
    title: string;
    type: string;
    visible: boolean;
    opacity: number;
    zIndex: number;
    params: Record<string, any>;
    groupKey?: string | null;
    groupTitle?: string | null;
}

const SaveMap = () => {
    const mapVM: MapVM = useMapVM();

    const getMapName = (): string | null => {
        const currentMapInfo = mapVM.getMapInfo();

        if (currentMapInfo?.uuid && currentMapInfo.uuid !== "-1") {
            return currentMapInfo.title ?? "Untitled Map";
        }

        return prompt("Please enter map name");
    };

    const getMapUUID = (): string => {
        return mapVM.getMapInfo()?.uuid ?? "-1";
    };

    const getBaseLayerName = (): string => {
        let baseLayerName = "Google Hybrid";

        mapVM
            .getMap()
            .getLayers()
            .forEach((layer: any) => {
                if (layer instanceof LayerGroup && layer.get("title") === "Base Layers") {
                    layer.getLayers().forEach((base: any) => {
                        if (base.getVisible()) {
                            baseLayerName = base.get("title") || "Google Hybrid";
                        }
                    });
                }
            });

        return baseLayerName;
    };

    const collectGroups = (): GroupData[] => {
        const groups: GroupData[] = [];

        mapVM
            .getMap()
            .getLayers()
            .forEach((layer: any) => {
                if (!(layer instanceof LayerGroup)) return;
                if (layer.get("title") === "Base Layers") return;

                groups.push({
                    key: layer.get("groupKey") || layer.get("name") || layer.get("title"),
                    title: layer.get("title"),
                    order: layer.getZIndex?.() ?? groups.length + 1,
                    collapsed: layer.get("fold") === "close",
                });
            });

        return groups.sort((a, b) => a.order - b.order);
    };

    const collectDALayers = (): LayerData[] => {
        const daLayers: LayerData[] = [];

        const readLayer = (layer: any, group?: any) => {
            // console.log("reading layer", layer.get('title'))
            // console.log({
            //     layer,
            //     constructor: layer.constructor?.name,
            //     instanceofLayerGroup: layer instanceof LayerGroup,
            //     hasGetLayers: typeof layer.getLayers === "function",
            //     title: layer.get?.("title"),
            // });

            if (layer instanceof LayerGroup) {
                if (layer.get("title") === "Base Layers") return;

                layer.getLayers().forEach((child: any) => {
                    readLayer(child, layer);
                });

                return;
            }

            // const uuid = layer.get("name");
            const uuid = layer.get("uuid") || layer.get("name");
            const layerType = layer.get("layerType");

            if (!uuid || uuid === "selection_layer") return;
            if (layerType === "wms") return;
            // if (!mapVM.isDALayerExists(uuid)) return;

            const daLayer = mapVM.getDALayer(uuid);
            const layerInfo = daLayer?.layerInfo;
            if (layerType !== "da") return;
            console.log("SAVE DA", {
                title: layer.get("title"),
                uuid,
                parentGroup: group?.get("title"),
                parentGroupKey: group?.get("groupKey"),
                layerGroupKey: layer.get("groupKey"),
                layerGroupTitle: layer.get("groupTitle"),
            });

            daLayers.push({
                uuid,
                name: layerInfo?.name ?? uuid,
                title: layerInfo?.title ?? layer.get("title") ?? uuid,
                visible: layer.getVisible(),
                opacity: layer.getOpacity(),
                zIndex: layer.getZIndex() || 0,
                style: layerInfo?.style ?? null,
                groupKey: group?.get("groupKey") ?? layer.get("groupKey") ?? layer.get("groupName") ?? null,
                groupTitle: group?.get("title") ?? layer.get("groupTitle") ?? layer.get("groupName") ?? null,
            });
        };

        mapVM.getMap().getLayers().forEach((layer: any) => readLayer(layer));

        return daLayers.sort((a, b) => a.zIndex - b.zIndex);
    };

    const collectOtherLayers = (): OtherLayerData[] => {
        const otherLayers: OtherLayerData[] = [];

        const readLayer = (layer: any, group?: any) => {
            if (layer instanceof LayerGroup) {
                if (layer.get("title") === "Base Layers") return;

                layer.getLayers().forEach((child: any) => {
                    readLayer(child, layer);
                });

                return;
            }

            const layerType = layer.get("layerType");

            if (layerType !== "wms") return;

            const source: any = layer.getSource();
            const params = source?.params_ || {};

            otherLayers.push({
                uuid: "-1",
                name: layer.get("name"),
                title: layer.get("title"),
                type: "wms",
                visible: layer.getVisible(),
                opacity: layer.getOpacity(),
                zIndex: layer.getZIndex() || 0,
                groupKey: group?.get("groupKey") ?? layer.get("groupKey") ?? null,
                groupTitle: group?.get("title") ?? layer.get("groupTitle") ?? null,
                params: {
                    title: layer.get("title"),
                    url: source?.url_,
                    layers: params.LAYERS,
                    tiled: params.TILED ?? true,
                    format: params.FORMAT ?? "image/png",
                    transparent: params.TRANSPARENT ?? true,
                    version: params.VERSION ?? "1.3.0",
                    style: params.STYLES ?? "",
                },
            });
        };

        mapVM.getMap().getLayers().forEach((layer: any) => readLayer(layer));

        return otherLayers.sort((a, b) => a.zIndex - b.zIndex);
    };

    const handleClick = async () => {
        const mapName = getMapName();

        if (!mapName) {
            mapVM.showSnackbar("Map save cancelled: Name required", "warning");
            return;
        }

        const mapData = {
            uuid: getMapUUID(),
            mapName,
            extent: mapVM.getCurrentExtent(),
            baseLayer: getBaseLayerName(),
            groups: collectGroups(),
            daLayers: collectDALayers(),
            otherLayers: collectOtherLayers(),
        };
        console.log("updated", mapData);
        try {
            const payload = await mapVM.getApi().post(MapAPIs.DCH_SAVE_MAP, mapData);

            if (payload) {
                if (mapData.uuid === "-1" && payload?.uuid) {
                    mapVM.setMapUUID(payload.uuid);
                }

                mapVM.showSnackbar("Map saved successfully", "success");
            }
        } catch (error) {
            console.error(error);
            mapVM.showSnackbar("Failed to save map", "error");
        }
    };

    return (
        <Tooltip title="Save Map">
            <IconButton sx={{ padding: "3px" }} onClick={handleClick}>
                <SaveIcon />
            </IconButton>
        </Tooltip>
    );
};

export default SaveMap;