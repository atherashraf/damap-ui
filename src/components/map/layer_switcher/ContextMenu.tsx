import {Menu} from "@mui/material";
import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import MapVM from "@/components/map/models/MapVM";
import SymbologySetting from "@/components/map/layer_styling/SymbologySetting";
import MapApi, {MapAPIs} from "@/api/MapApi";

export interface IContextMenu {
    mouseX: number;
    mouseY: number;
}

interface IProps {
    olLayer: any;
    mapVM: MapVM;
    contextMenu?: IContextMenu;
}

const ContextMenu = (props: IProps) => {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => {
        setOpen(Boolean(props.contextMenu));
    }, [props.contextMenu]);
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
                const extent = props.olLayer.getSource().getExtent()

                extent ?  props.mapVM.zoomToExtent(extent):
                    props.mapVM.showSnackbar("Layer extent is not available")
                break
            case "table":
                props.mapVM.setLayerOfInterest(uuid);
                setTimeout(() => props?.mapVM?.openAttributeTable(), 1000);
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
                        top: props?.contextMenu?.mouseY || 0,
                        left: props?.contextMenu?.mouseX || 0
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
            </Menu>
        </React.Fragment>
    );
};

export default ContextMenu;
