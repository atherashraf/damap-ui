import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import MapVM from "@/components/map/models/MapVM";
import { MapAPIs } from "@/api/MapApi";
import {useMapVM} from "@/damap";

// interface IProps {
//     // mapVM: MapVM;
// }

const SaveMap = () => {
    const mapVM: MapVM = useMapVM();
    const handleClick = () => {
        const currentMapInfo = mapVM?.getMapInfo();
        const mapName = currentMapInfo?.uuid !== "-1"
            ? currentMapInfo?.title
            : prompt("Please enter map name");
        const mapUUID = currentMapInfo?.uuid ?? "-1";
        const extent = mapVM.getCurrentExtent();

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
            mapVM
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

            // const url = MapApi.getURL(MapAPIs.DCH_SAVE_MAP);
            // console.log(url)
            mapVM.getApi()
                .post(MapAPIs.DCH_SAVE_MAP, mapData)
                .then((payload) => {
                    if (payload) {
                        mapVM.showSnackbar("Map created successfully");
                    }
                });
        } else {
            mapVM.showSnackbar("Please provide name of the map");
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
