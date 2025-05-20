import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import MapVM from "@/components/map/models/MapVM";
import MapApi, { MapAPIs } from "@/api/MapApi";

interface IProps {
    mapVM: MapVM;
}

const SaveMap = (props: IProps) => {
    const handleClick = () => {
        const currentMapInfo = props.mapVM?.getMapInfo();
        const mapName = currentMapInfo?.uuid !== "-1"
            ? currentMapInfo?.title
            : prompt("Please enter map name");
        const mapUUID = currentMapInfo?.uuid ?? "-1";
        const extent = props.mapVM.getCurrentExtent();

        interface LayerData {
            uuid: string;
            visible: boolean;
            opacity: number;
        }

        const mapData = {
            uuid: mapUUID,
            mapName: mapName,
            extent: extent,
            baseLayer: null,
            daLayers: [] as LayerData[],
        };

        if (mapName) {
            props.mapVM
                .getMap()
                .getAllLayers()
                .forEach((layer) => {
                    const uuid: string = layer.get("name");
                    const title = layer.get("title");

                    if (!uuid && layer.get("baseLayer")) {
                        if (layer.getVisible()) {
                            mapData["baseLayer"] = title;
                        }
                    } else if (uuid) {
                        mapData["daLayers"].push({
                            uuid: uuid,
                            visible: layer.getVisible(),
                            opacity: layer.getOpacity(),
                        });
                    }
                });

            const url = MapApi.getURL(MapAPIs.DCH_SAVE_MAP);

            props.mapVM
                .getApi()
                .post(url, mapData)
                .then((payload) => {
                    if (payload) {
                        props.mapVM.showSnackbar("Map created successfully");
                    }
                });
        } else {
            props.mapVM.showSnackbar("Please provide name of the map");
        }
    };

    return (
        <React.Fragment>
            <Tooltip title={"Save Map"}>
                <IconButton sx={{ padding: "3px" }} onClick={handleClick}>
                    <SaveIcon />
                </IconButton>
            </Tooltip>
        </React.Fragment>
    );
};

export default SaveMap;
