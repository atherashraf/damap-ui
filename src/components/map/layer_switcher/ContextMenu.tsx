/**
 * ContextMenu — A right-click menu component for OpenLayers layers.
 *
 * This component renders a context menu with predefined and custom options for a given `olLayer`.
 * It supports external injection of menu items via a `ref`, allowing other components to add or clear menu options dynamically.
 *
 * ✅ Usage:
 *  const mapVM = useMapVM();
 *  const contextMenuRef:RefObject<ContextMenuHandle | null>  = mapVM.getContextMenuRef()
 *
 *   useEffect(() => {
 *     contextMenuRef.current?.clearMenuItems(); // optional
 *         contextMenuRef?.current?.addMenuItem({id: "label",
 *             name:"Add Label",
 *             onClick: () => {
 *                 const layer = contextMenuRef.current?.getCurrentLayer?.();
 *                 if (layer) {
 *                     console.log("Using current layer:", layer);
 *                     // Do your logic here, e.g., add label to the layer
 *                 } else {
 *                     console.warn("Layer not set.");
 *                 }            }})
 *     }, [contextMenuRef?.current]);
 *   contextMenuRef.current?.openAt(layer, { mouseX: e.clientX, mouseY: e.clientY });
 *
 * <ContextMenu ref={contextMenuRef} />
 */

import React, { useImperativeHandle,  useState } from "react";
import { Menu, MenuItem } from "@mui/material";
import MapVM from "@/components/map/models/MapVM";
import SymbologySetting from "@/components/map/layer_styling/SymbologySetting";
import MapApi, { MapAPIs } from "@/api/MapApi";
import { useMapVM } from "@/hooks/MapVMContext";


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

const ContextMenu = React.forwardRef<ContextMenuHandle>((_props, ref) => {
    const [open, setOpen] = useState(false);
    const [contextMenuLoc, setContextMenuLoc] = useState<IContextMenuLoc | null>(null);
    const [olLayer, setOlLayer] = useState<any>(null);
    const [customItems, setCustomItems] = useState<CustomMenuItem[]>([]);
    const mapVM: MapVM = useMapVM();

    useImperativeHandle(ref, () => ({
        addMenuItem: (item: CustomMenuItem) => {
            setCustomItems((prev) => {
                // Check if the item with same id already exists
                if (prev.some(existingItem => existingItem.id === item.id)) {
                    return prev; // Don't add duplicate
                }
                return [...prev, item];
            });
        },
        clearMenuItems: () => {
            setCustomItems([]);
        },
        openAt: (layer: any, loc: IContextMenuLoc) => {
            setOlLayer(layer);
            setContextMenuLoc(loc);
            setOpen(true);
        },
        close: () => {
            setOpen(false);
        },
        getCurrentLayer: () => olLayer ?? null,
    }));

    const handleClose = () => {
        setOpen(false);
    };

    const handleClick = (option: string) => {
        if (!olLayer) return;

        const uuid = olLayer.get("name");

        switch (option) {
            case "designer":
                mapVM.setLayerOfInterest(uuid);
                const drawerRef = mapVM.getRightDrawerRef();
                drawerRef?.current?.setContent(
                    "Layer Styler",
                    <SymbologySetting key="symbology-setting" mapVM={mapVM} />
                );
                drawerRef?.current?.openDrawer();
                break;
            case "zoom":
                const extent = olLayer.getExtent?.() ?? olLayer.getSource?.()?.getExtent?.();
                if (extent && extent.length === 4) {
                    mapVM.zoomToExtent(extent);
                } else {
                    mapVM.showSnackbar("Layer extent is not available");
                }
                break;
            case "table":
                try {
                    mapVM.setLayerOfInterest(uuid);
                    setTimeout(() => mapVM?.openAttributeTable?.(), 1000);
                } catch {
                    mapVM.showSnackbar("Attribute table is not available");
                }
                break;
            case "downloadStyle":
                const url = MapApi.getURL(MapAPIs.DCH_DOWNLOAD_DA_STYLE, { uuid });
                window.open(url);
                break;
            default:
                break;
        }
    };

    const menuItems = {
        common: [
            { name: "Open Attribute Table", id: "table" },
            { name: "Zoom To Layer", id: "zoom" },
        ],
        inEditor: [
            { name: "Open Layer Designer", id: "designer" },
            { name: "Download style", id: "downloadStyle" },
        ],
    };

    const isEditor = mapVM.isMapEditor();

    return (
        <Menu
            anchorReference="anchorPosition"
            anchorPosition={
                contextMenuLoc
                    ? { top: contextMenuLoc.mouseY, left: contextMenuLoc.mouseX }
                    : undefined
            }
            id="layer-menu"
            open={open}
            onClose={handleClose}
            onClick={handleClose}
        >
            {menuItems.common.map((item) => (
                <MenuItem key={item.id} onClick={() => handleClick(item.id)}>
                    {item.name}
                </MenuItem>
            ))}
            {isEditor &&
                menuItems.inEditor.map((item) => (
                    <MenuItem key={item.id} onClick={() => handleClick(item.id)}>
                        {item.name}
                    </MenuItem>
                ))}
            {customItems.map((item) => (
                <MenuItem key={item.id} onClick={item.onClick}>
                    {item.name}
                </MenuItem>
            ))}
        </Menu>
    );
});

export default ContextMenu;
