import * as React from "react";
import { Box, Paper, Stack } from "@mui/material";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import PublicIcon from "@mui/icons-material/Public";
import PolylineIcon from "@mui/icons-material/Polyline";
import LayersIcon from "@mui/icons-material/Layers";
import GroupLayer from "ol/layer/Group";
import BaseLayer from "ol/layer/Base";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";

import MapVM from "@damap/components/map/models/MapVM";
import LayerSwitcherLayerMenu from "@damap/components/map/layer_switcher_mui/LayerSwitcherLayerMenu";
import LayerSwitcherBaseLayerCard from "@damap/components/map/layer_switcher_mui/LayerSwitcherBaseLayerCard";
import LayerSwitcherGroupCard from "@damap/components/map/layer_switcher_mui/LayerSwitcherGroupCard";
import { LayerItem, LayerMenuState } from "@damap/components/map/layer_switcher_mui/types";
import type { ILayerRecord, ILayerTreeGroup } from "@damap/components/map/manager/LayerManager";

interface LayerSwitcherMuiProps {
    mapVM: MapVM;
}

const getLayerTitle = (layer: BaseLayer): string => {
    return layer.get("title") || layer.get("name") || "Untitled Layer";
};

const getLayerIcon = (layer: BaseLayer, isBaseLayer: boolean): React.ReactNode => {
    if (isBaseLayer) return <PublicIcon fontSize="small" />;

    const source = (layer as any).getSource?.();
    if (source?.getFeatures) return <PolylineIcon fontSize="small" />;

    return <LayersIcon fontSize="small" />;
};

const collectBaseLayers = (mapVM: MapVM): LayerItem[] => {
    const map = mapVM.getMap();
    if (!map) return [];

    const items: LayerItem[] = [];

    map.getLayers().forEach((layer: any, groupIndex: number) => {
        if (!(layer instanceof GroupLayer)) return;
        if (layer.get("title") !== "Base Layers") return;

        layer.getLayers().forEach((baseLayer: BaseLayer, index: number) => {
            items.push({
                id: `base-${groupIndex}-${index}-${getLayerTitle(baseLayer)}`,
                layer: baseLayer,
                title: getLayerTitle(baseLayer),
                isBaseLayer: true,
                icon: getLayerIcon(baseLayer, true),
            });
        });
    });

    return items;
};

const LayerSwitcherMUIPaper = ({ mapVM }: LayerSwitcherMuiProps): React.ReactElement => {
    const [layerGroups, setLayerGroups] = React.useState<ILayerTreeGroup[]>([]);
    const [baseLayers, setBaseLayers] = React.useState<LayerItem[]>([]);
    const [menuState, setMenuState] = React.useState<LayerMenuState | null>(null);
    const [isInteracting, setIsInteracting] = React.useState(false);

    const [, forceUpdate] = React.useState({});
    const triggerRefresh = React.useCallback(() => forceUpdate({}), []);

    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const suppressRefreshRef = React.useRef(false);

    const refreshLayerTree = React.useCallback(() => {
        setLayerGroups(mapVM.getLayerManager().getLayerTree());
        setBaseLayers(collectBaseLayers(mapVM));
    }, [mapVM]);

    // Completely revamped synchronization lifecycle block
    React.useEffect(() => {
        const map = mapVM.getMap();
        if (!map) return;

        const collection = map.getLayers();
        let propertyKeys: EventsKey[] = [];

        const handleUpdate = () => {
            if (suppressRefreshRef.current) return;

            // Push execution to the end of the macro task queue.
            // This allows OpenLayers collections to complete re-parenting changes.
            setTimeout(() => {
                refreshLayerTree();
                bindListeners();
                triggerRefresh();
            }, 0);
        };

        const bindListeners = () => {
            unByKey(propertyKeys);
            propertyKeys = [];

            const manager = mapVM.getLayerManager();

            // 1. Listen to discrete property changes on all discrete records
            manager.getAllLayerRecords().forEach((record) => {
                if (!record.olLayer) return;
                propertyKeys.push(record.olLayer.on("change:visible", handleUpdate));
                propertyKeys.push(record.olLayer.on("change:opacity", handleUpdate));
                propertyKeys.push(record.olLayer.on("change:zIndex", handleUpdate));
            });

            // 2. Listen to collection changes on sub-groups (e.g. layers jumping between groups)
            manager.getLayerGroups().forEach((group) => {
                const innerCollection = group.getLayers();
                propertyKeys.push(innerCollection.on("add", handleUpdate));
                propertyKeys.push(innerCollection.on("remove", handleUpdate));
            });
        };

        // Root level changes
        const addKey = collection.on("add", handleUpdate);
        const removeKey = collection.on("remove", handleUpdate);

        // Explicit structural broadcast bridge from custom manager actions
        window.addEventListener("LayerTreeChanged", handleUpdate);

        // Initial setup
        refreshLayerTree();
        bindListeners();

        return () => {
            unByKey([addKey, removeKey, ...propertyKeys]);
            window.removeEventListener("LayerTreeChanged", handleUpdate);
        };
    }, [mapVM, refreshLayerTree, triggerRefresh]);

    React.useEffect(() => {
        mapVM.layerSwitcherManager.registerContextMenuHandlers({
            setMenuState,
        });
    }, [mapVM]);

    React.useEffect(() => {
        if (!menuState) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node | null;

            if (menuRef.current && target && !menuRef.current.contains(target)) {
                setMenuState(null);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuState(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [menuState]);

    const selectedBaseLayer = React.useMemo(
        () => baseLayers.find((i) => i.layer.getVisible()) || baseLayers[0],
        [baseLayers]
    );

    const setBaseLayerVisibility = (targetLayer: BaseLayer, visible: boolean) => {
        const mapLayers = mapVM.getMap().getLayers().getArray();

        const baseGroup = mapLayers.find(
            (l) => l instanceof GroupLayer && l.get("title") === "Base Layers"
        ) as GroupLayer | undefined;

        if (!baseGroup) {
            targetLayer.setVisible(visible);
            refreshLayerTree();
            return;
        }

        if (!visible) {
            targetLayer.setVisible(false);
        } else {
            baseGroup.getLayers().forEach((l) => l.setVisible(l === targetLayer));
            baseGroup.setVisible(true);
        }

        mapVM.getMap().render();
        refreshLayerTree();
    };

    const handleToggleVisibility = (item: LayerItem) => {
        if (item.isBaseLayer) {
            setBaseLayerVisibility(item.layer, !item.layer.getVisible());
            return;
        }

        item.layer.setVisible(!item.layer.getVisible());
        item.layer.changed();
        mapVM.getMap().render();
        refreshLayerTree();
    };

    const handleOpacityChange = (item: LayerItem, value: number | number[]) => {
        item.layer.setOpacity(Number(Array.isArray(value) ? value[0] : value));
        item.layer.changed();
        mapVM.getMap().render();
        refreshLayerTree();
    };

    const onOpenMenu = (e: React.MouseEvent<HTMLElement>, item: LayerItem) => {
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const menuWidth = 220;
        const estimatedMenuHeight = 260;
        const gap = 6;
        const padding = 8;

        let top = rect.bottom + gap;
        let left = rect.right - menuWidth;

        if (top + estimatedMenuHeight > window.innerHeight - padding) {
            top = rect.top - estimatedMenuHeight - gap;
        }

        if (top < padding) top = padding;
        if (left < padding) left = padding;
        if (left + menuWidth > window.innerWidth - padding) {
            left = window.innerWidth - menuWidth - padding;
        }

        setMenuState({
            item,
            top,
            left,
        });
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;
        if (!destination) return;

        suppressRefreshRef.current = true;

        try {
            if (type === "GROUP") {
                const reordered = Array.from(layerGroups);
                const [moved] = reordered.splice(source.index, 1);
                reordered.splice(destination.index, 0, moved);

                mapVM.getLayerManager().reorderRootGroups(
                    reordered.map((g) => g.id)
                );
            }

            if (type === "LAYER") {
                const sourceGroup = layerGroups.find((g) => g.id === source.droppableId);
                const destGroup = layerGroups.find((g) => g.id === destination.droppableId);

                if (!sourceGroup || !destGroup) return;

                const sourceLayers: ILayerRecord[] = [...sourceGroup.layers];
                const [moved] = sourceLayers.splice(source.index, 1);
                if (!moved) return;

                if (source.droppableId === destination.droppableId) {
                    sourceLayers.splice(destination.index, 0, moved);

                    mapVM.getLayerManager().reorderLayersInGroup(
                        sourceGroup.id,
                        sourceLayers.map((r) => r.id)
                    );
                } else {
                    mapVM.getLayerManager().moveLayerToGroup(moved.id, {
                        key: destGroup.id,
                        title: destGroup.title,
                        collapsed: false,
                    });

                    const destLayers: ILayerRecord[] = [...destGroup.layers];
                    destLayers.splice(destination.index, 0, moved);

                    mapVM.getLayerManager().reorderLayersInGroup(
                        destGroup.id,
                        destLayers.map((r) => r.id)
                    );
                }
            }
        } finally {
            suppressRefreshRef.current = false;
            mapVM.getMap().renderSync?.();
            mapVM.getMap().render();
            refreshLayerTree();
        }
    };

    return (
        <Paper
            elevation={2}
            sx={{
                height: "100%",
                width: "100%",
                p: 1.5,
                overflowY: "auto",
            }}
        >
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="groups" type="GROUP">
                    {(provided) => (
                        <Stack
                            spacing={1.25}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {layerGroups.map((group, index) => (
                                <Draggable
                                    key={group.id}
                                    draggableId={`group-${group.id}`}
                                    index={index}
                                    isDragDisabled={!!menuState || isInteracting}
                                >
                                    {(provided) => (
                                        <Box
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                        >
                                            <LayerSwitcherGroupCard
                                                groupId={group.id}
                                                group={group.group}
                                                title={group.title}
                                                childrenItems={group.layers.map((record: ILayerRecord) => ({
                                                    id: record.id,
                                                    layer: record.olLayer as BaseLayer,
                                                    title: record.title,
                                                    isBaseLayer: false,
                                                    icon: getLayerIcon(record.olLayer as BaseLayer, false),
                                                }))}
                                                dragHandleProps={provided.dragHandleProps}
                                                onToggleVisibility={handleToggleVisibility}
                                                onOpacityChange={handleOpacityChange}
                                                onOpenMenu={onOpenMenu}
                                                onOpenLegend={() => {}}
                                                onInteractionStart={() => setIsInteracting(true)}
                                                onInteractionEnd={() => setIsInteracting(false)}
                                            />
                                        </Box>
                                    )}
                                </Draggable>
                            ))}

                            {provided.placeholder}

                            {selectedBaseLayer && (
                                <LayerSwitcherBaseLayerCard
                                    baseLayers={baseLayers}
                                    selectedBaseLayer={selectedBaseLayer}
                                    onSelectBaseLayer={(id) => {
                                        const target = baseLayers.find((l) => l.id === id);
                                        if (target) setBaseLayerVisibility(target.layer, true);
                                    }}
                                    onToggleVisibility={handleToggleVisibility}
                                    onOpacityChange={handleOpacityChange}
                                    onOpenMenu={() => {}}
                                />
                            )}
                        </Stack>
                    )}
                </Droppable>
            </DragDropContext>

            <LayerSwitcherLayerMenu
                menuRef={menuRef}
                menuState={menuState}
            />
        </Paper>
    );
};

export default LayerSwitcherMUIPaper;