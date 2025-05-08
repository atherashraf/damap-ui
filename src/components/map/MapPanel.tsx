import {mapDivInfo} from "@/components/map/MapView.tsx";
import {IconButton, useTheme} from "@mui/material";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import React, {Fragment, useEffect, useRef, useState} from "react";
import {useMapVM} from "@/components/map/models/MapVMContext.tsx";
import {MapAPIs} from "@/api/MapApi.ts";
import {IMapInfo} from "@/types/typeDeclarations.ts";

interface IMapPanelProps {
    isMap: boolean;
    uuid?: string;
    isEditor?: boolean;
    children?: React.ReactNode;
}

const MapPanel = ({isMap, uuid, isEditor,children}: IMapPanelProps) => {
    const theme = useTheme();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const mapVM = useMapVM();
    const mapDivId = mapDivInfo.mapDivId;
    uuid = uuid || "-1";
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarHeight, setToolbarHeight] = useState(0);

    useEffect(() => {
        if (toolbarRef.current) {
            const height = toolbarRef.current.getBoundingClientRect().height;
            setToolbarHeight(height);
        } else {
            setToolbarHeight(0);
        }
    }, [children]);

    useEffect(() => {

        if (isMap && uuid && uuid !== "-1") {
            mapVM.getApi()
                ?.get(MapAPIs.DCH_MAP_INFO, { uuid })
                .then((payload: IMapInfo) => {
                    console.log(payload);
                    const mapInfo: IMapInfo = { ...payload, isEditor };
                    if (!mapVM.isInit) mapVM.initMap(mapInfo);
                    mapVM.setTarget(mapDivId);
                });
        } else if (isMap) {
            const mapInfo: IMapInfo = { uuid: uuid || "-1", isEditor, layers: [] };
            if (!mapVM.isInit) {
                mapVM.initMap(mapInfo);
                mapVM.setTarget(mapDivId);
            }
        } else {
            const info: IMapInfo = { uuid: uuid || "-1", isEditor, layers: [] };
            if (!mapVM.isInit) {
                mapVM.initMap(info);
                (async () => {
                    //@ts-ignore
                    await mapVM.addDALayer({ uuid });
                    //@ts-ignore
                    const extent = await mapVM.getDALayer(uuid)?.getExtent();
                    //@ts-ignore
                    mapVM.setMapFullExtent(extent);
                    mapVM.zoomToFullExtent();
                })();
                //@ts-ignore
                mapVM.setLayerOfInterest(uuid);
                mapVM.setTarget(mapDivId);
                // mapVM.setDomRef(domRefs);
            }
        }
    }, [uuid, isMap, isEditor]);


    const toggleFullscreen = () => {
        const elem = document.getElementById("fullscreen");
        if (!document.fullscreenElement) {
            elem?.requestFullscreen()
                .then(() => setIsFullscreen(true))
                .catch((err) => console.error(`Fullscreen error: ${err.message}`));
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };
    return (
        <Fragment>
            {/* Toolbar or Appbar outside the mapDiv, but within layout */}
            {children && (
                <div
                    ref={toolbarRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        zIndex: 100,
                    }}
                >
                    {children}
                </div>
            )}


            {/* The map container */}
            <div id={mapDivInfo.mapDivId}
                 style={{
                     position: "relative",
                     top: `${toolbarHeight}px`,
                     width: "100%",
                     height: "100%",
                     minHeight: mapDivInfo.minMapHeight,
                     transition: "top 0.2s ease-out, height 0.2s ease-out",
                 }}
            >
                <IconButton
                    onClick={toggleFullscreen}
                    sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 110,
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.secondary.contrastText,
                        "&:hover": {
                            backgroundColor: theme.palette.secondary.dark,
                        },
                    }}
                    size="small"
                >
                    {isFullscreen ? <FullscreenExitIcon/> : <FullscreenIcon/>}
                </IconButton>

            </div>
        </Fragment>
    )
}
export default MapPanel