/**
 * ContextMenu — A right-click menu component for OpenLayers layers.
 *
 * This component renders a context menu with predefined and custom options for a given `olLayer`.
 * It supports external injection of menu items via a `ref`, allowing other components to add or clear menu options dynamically.
 *
 * ✅ Usage:
 *
 * 1. Render inside a map wrapper or toolbar:
 * ```tsx
 * const contextMenuRef = useRef<ContextMenuHandle>(null);
 *
 * useEffect(() => {
 *   mapVM.setContextMenuRef(contextMenuRef); // store globally in mapVM if needed
 * }, []);
 *
 * <ContextMenu
 *   ref={contextMenuRef}
 *   olLayer={selectedLayer}
 *   contextMenuLoc={{ mouseX: 200, mouseY: 300 }}
 *   mapVM={mapVM}
 * />
 * ```
 *
 * 2. Open the menu on right-click:

 * <div onContextMenu={(e) => {
 *   e.preventDefault();
 *   contextMenuRef.current?.addMenuItem({
 *     id: "export_csv",
 *     name: "Export to CSV",
 *     onClick: () => exportLayerData(layer)
 *   });
 *   contextMenuRef.current?.openAt({ mouseX: e.clientX, mouseY: e.clientY }, layer);
 * }}>
 * </div>
 *
 * 3. Add or clear dynamic menu items externally:

 * contextMenuRef.current?.addMenuItem({
 *   id: "custom_analysis",
 *   name: "Run Analysis",
 *   onClick: () => runAnalysis(layer)
 * });
 *
 * contextMenuRef.current?.clearMenuItems();
 *
 * 🧩 Built-in Menu Options:
 * - Open Attribute Table
 * - Zoom To Layer
 * - Open Layer Designer (if in editor mode)
 * - Download style (if in editor mode)
 *
 * Ref Methods (ContextMenuHandle):
 * - addMenuItem(item: CustomMenuItem) — Adds a custom menu item to the context menu.
 * - clearMenuItems() — Clears all injected custom menu items.
 *
 * @component
 */


import {Menu} from "@mui/material";
import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import MapVM from "@/components/map/models/MapVM";
import SymbologySetting from "@/components/map/layer_styling/SymbologySetting";
import MapApi, {MapAPIs} from "@/api/MapApi";
import {useImperativeHandle, useState} from "react";


export interface IContextMenuLoc {
    mouseX: number;
    mouseY: number;
}

interface IProps {
    olLayer: any;
    mapVM: MapVM;
    contextMenuLoc?: IContextMenuLoc;
}

// Define a reusable type for external menu items
export interface CustomMenuItem {
    id: string;
    name: string;
    onClick: () => void;
}

export interface ContextMenuHandle {
    addMenuItem: (item: CustomMenuItem) => void;
    clearMenuItems: () => void;
}

const ContextMenu = React.forwardRef<ContextMenuHandle, IProps>((props, ref) => {
    const [open, setOpen] = React.useState(false);
    const [customItems, setCustomItems] = useState<CustomMenuItem[]>([]);

    useImperativeHandle(ref, () => ({
        addMenuItem: (item: CustomMenuItem) => {
            setCustomItems((prev) => [...prev, item]);
        },
        clearMenuItems: () => {
            setCustomItems([]);
        }
    }));

    React.useEffect(() => {
        setOpen(Boolean(props.contextMenuLoc));
    }, [props.contextMenuLoc]);


    const handleClose = () => {
        setOpen(false);
    };
    const menuItems = {
        common: [
            {name: "Open Attribute Table", id: "table"},
            {name: "Zoom To Layer", id: "zoom"}
        ],
        inEditor: [
            {name: "Open Layer Designer", id: "designer"},
            {name: "Download style", id: "downloadStyle"},
        ],
    };
    const handleClick = (option: string) => {
        const uuid = props.olLayer.get("name");
        switch (option) {
            case "designer":
                props.mapVM.setLayerOfInterest(uuid);
                const drawerRef = props.mapVM.getRightDrawerRef();
                drawerRef?.current?.setContent(
                    "Layer Styler",
                    <SymbologySetting key={"symbology-setting"} mapVM={props.mapVM}/>
                );
                drawerRef?.current?.openDrawer();
                break;
            case "zoom":
                const layerExtent = props.olLayer.getExtent?.();
                const sourceExtent = props.olLayer.getSource?.()?.getExtent?.();

                const extent = layerExtent ?? sourceExtent;

                if (extent && extent.length === 4) {
                    props.mapVM.zoomToExtent(extent);
                } else {
                    props.mapVM.showSnackbar("Layer extent is not available");
                }
                break
            case "table":
                try {
                    props.mapVM.setLayerOfInterest(uuid);
                    setTimeout(() => props?.mapVM?.openAttributeTable?.(), 1000);
                } catch {
                    props.mapVM.showSnackbar("Attribute table is not available");
                }
                break;
            //@ts-ignore
            case "downloadStyle":
                const url = MapApi.getURL(MapAPIs.DCH_DOWNLOAD_DA_STYLE, {
                    uuid: uuid,
                });
                window.open(url);
                break;
            default:
                break;
        }
    };
    const isEditor = props.mapVM.isMapEditor();
    return (
        <React.Fragment>
            <Menu
                // anchorEl={props.anchorEl}
                anchorReference="anchorPosition"
                anchorPosition={
                    {
                        top: props?.contextMenuLoc?.mouseY || 0,
                        left: props?.contextMenuLoc?.mouseX || 0
                    }

                }
                id="layer-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
            >
                {menuItems["common"].map((item) => (
                    <MenuItem key={item.id} onClick={() => handleClick(item.id)}>
                        {item.name}
                    </MenuItem>
                ))}
                {isEditor &&
                    menuItems["inEditor"].map((item) => (
                        <MenuItem key={item.id} onClick={() => handleClick(item.id)}>
                            {item.name}
                        </MenuItem>
                    ))}
                {customItems.map((item) => (
                    <MenuItem key={item.id} onClick={() => item.onClick()}>
                        {item.name}
                    </MenuItem>
                ))}
            </Menu>
        </React.Fragment>
    );
});

export default ContextMenu;
