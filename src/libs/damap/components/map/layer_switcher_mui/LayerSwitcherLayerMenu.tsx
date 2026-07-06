import * as React from "react";
import { useState, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { Divider, List, ListItemButton, ListItemText, Paper } from "@mui/material";
import { LayerMenuState } from "./types";
import { getMapVM } from "@/libs/damap";
import MoveLayerToGroupPanel from "@damap/components/map/widgets/MoveLayerToGroupPanel";

export interface IContextMenuLoc {
    mouseX: number;
    mouseY: number;
}

export interface CustomMenuItem {
    id: string;
    name: string;
    onClick: () => void;
}

export interface ContextMenuHandle {
    addMenuItem: (item: CustomMenuItem) => void;
    clearMenuItems: () => void;
    openAt: (olLayer: any, contextMenuLoc: IContextMenuLoc) => void;
    close: () => void;
    getCurrentLayer: () => any;
}

interface LayerSwitcherLayerMenuProps {
    menuRef: React.RefObject<HTMLDivElement | null>;
    menuState: LayerMenuState | null;
    onCloseState?: () => void;
}

const LayerSwitcherLayerMenu = React.forwardRef<
    ContextMenuHandle,
    LayerSwitcherLayerMenuProps
>(({ menuRef, menuState, onCloseState }, ref) => {
    const [customItems, setCustomItems] = useState<CustomMenuItem[]>([]);
    const [activeLayer, setActiveLayer] = useState<any>(null);

    useImperativeHandle(ref, () => ({
        addMenuItem: (item: CustomMenuItem) => {
            setCustomItems((prev) => {
                if (prev.some((existingItem) => existingItem.id === item.id)) return prev;
                return [...prev, item];
            });
        },
        clearMenuItems: () => setCustomItems([]),
        openAt: (olLayer: any) => {
            setActiveLayer(olLayer);
        },
        close: () => {
            onCloseState?.();
        },
        getCurrentLayer: () => activeLayer ?? menuState?.item ?? null,
    }));

    if (!menuState) return null;

    const mapVM = getMapVM();
    const currentItem = menuState.item;



    const openMoveDialog = () => {
        // const layerItem = currentItem;
        // console.log("Layer Item",layerItem);

        mapVM.getRightDrawerRef().current?.setContent(
            "Move to Group",
            <MoveLayerToGroupPanel
                open={true}
                mapVM={mapVM}
                layerItem={currentItem}
            />,
            true
        );

        mapVM.layerSwitcherManager.closeContextMenu();
    };

    return createPortal(
        <Paper
            ref={menuRef}
            elevation={8}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            sx={{
                position: "fixed",
                top: menuState.top,
                left: menuState.left,
                zIndex: 9999,
                width: 220,
                maxHeight: "calc(100vh - 16px)",
                overflowY: "auto",
            }}
        >
            <List dense>
                <ListItemButton onClick={() => mapVM.layerSwitcherManager.onAboutLayer(currentItem)}>
                    <ListItemText primary="About Layer" />
                </ListItemButton>

                <ListItemButton onClick={() => mapVM.layerSwitcherManager.onAttributeTable(currentItem)}>
                    <ListItemText primary="Attribute Table" />
                </ListItemButton>

                <ListItemButton onClick={() => mapVM.layerSwitcherManager.onZoomToLayer(currentItem)}>
                    <ListItemText primary="Zoom To Layer" />
                </ListItemButton>

                {mapVM.isMapEditor && (
                    <>
                        <ListItemButton onClick={() => mapVM.layerSwitcherManager.onLayerStyle(currentItem)}>
                            <ListItemText primary="Layer Style" />
                        </ListItemButton>

                        <ListItemButton onClick={openMoveDialog}>
                            <ListItemText primary="Move to Group..." />
                        </ListItemButton>
                    </>
                )}
            </List>

            {customItems.length > 0 && (
                <>
                    <Divider />
                    <List dense>
                        {customItems.map((item) => (
                            <ListItemButton key={item.id} onClick={item.onClick}>
                                <ListItemText primary={item.name} />
                            </ListItemButton>
                        ))}
                    </List>
                </>
            )}

            <Divider />

            <List dense>
                <ListItemButton onClick={() => mapVM.layerSwitcherManager.onRemoveLayer(currentItem)}>
                    <ListItemText primary="Remove Layer" />
                </ListItemButton>

                <ListItemButton onClick={() => mapVM.layerSwitcherManager.showLayerZIndex(currentItem)}>
                    <ListItemText primary="Layer Index" />
                </ListItemButton>

                <ListItemButton
                    onClick={() => {
                        mapVM.layerSwitcherManager.closeContextMenu();
                        onCloseState?.();
                    }}
                >
                    <ListItemText primary="Close" />
                </ListItemButton>
            </List>
        </Paper>,
        document.body
    );
});

LayerSwitcherLayerMenu.displayName = "LayerSwitcherLayerMenu";

export default LayerSwitcherLayerMenu;