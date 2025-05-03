import React, { useEffect, useRef, useState } from "react";
import MapVM from "@/components/map/models/MapVM";
import DADialogBox from "@/components/base/DADialogBox";
import DASnackbar from "@/components/base/DASnackbar";
import DAMapLoading from "@/components/map/widgets/DAMapLoading";
import { IDomRef, IMapInfo } from "@/types/typeDeclarations";
import { MapAPIs } from "@/api/MapApi";
import BottomDrawer from "@/components/map/drawers/BottomDrawer";
import RightDrawer from "@/components/map/drawers/RightDrawer";
import LeftDrawer from "./drawers/LeftDrawer";
import { Paper, IconButton } from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useTheme } from "@mui/material/styles";
import CustomAlertBox from "@/components/base/CustomAlertBox.tsx";

interface MapLayoutProps {
    uuid?: string;
    isMap: boolean;
    isDesigner?: boolean;
    isEditor?: boolean;
    children?: React.ReactNode; // <- For Appbar / toolbar composition
}

export const mapDivInfo = {
    mapDivId: "map",
    minMapHeight: 300,
    maxMapHeight: "100vh",
};

const MapView: React.FC<React.PropsWithChildren<MapLayoutProps>> = ({
                                                                        uuid,
                                                                        isMap,
                                                                        isDesigner = false,
                                                                        isEditor = false,
                                                                        children,
                                                                    }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const theme = useTheme();
    const mapDivId = mapDivInfo.mapDivId;

    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarHeight, setToolbarHeight] = useState(0);


    const domRefs: IDomRef = {
        rightDrawerRef: useRef(null),
        leftDrawerRef: useRef(null),
        bottomDrawerRef: useRef(null),
        dialogBoxRef: useRef(null),
        snackBarRef: useRef(null),
        mapPanelRef: useRef(null),
        loadingRef: useRef(null),
    };

    const mapVMRef = useRef<MapVM | null>(null);
    if (!mapVMRef.current) {
        mapVMRef.current = new MapVM(domRefs, isDesigner);
    }

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

    useEffect(() => {
        const mapVM = mapVMRef.current!;
        if (isMap && uuid && uuid !== "-1") {
            mapVM.getApi()
                ?.get(MapAPIs.DCH_MAP_INFO, { uuid })
                .then((payload: IMapInfo) => {
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
                mapVM.setDomRef(domRefs);
            }
        }
    }, [uuid, isMap, isEditor]);

    useEffect(() => {
        if (toolbarRef.current) {
            const height = toolbarRef.current.getBoundingClientRect().height;
            setToolbarHeight(height);
        } else {
            setToolbarHeight(0);
        }
    }, [children]);


    return (
        <div
            id="fullscreen"
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                flexDirection: "row",
                position: "relative",
            }}
        >
            <LeftDrawer ref={domRefs.leftDrawerRef} />

            <Paper
                sx={{
                    flex: 1,
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                }}
                elevation={6}
            >
                <CustomAlertBox />
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
                <div
                    id={mapDivId}
                    style={{
                        position: "absolute",
                        top: `${toolbarHeight}px`,
                        width: "100%",
                        height: "100%",
                        minHeight: mapDivInfo.minMapHeight,
                        transition: "top 0.2s ease-out, height 0.2s ease-out",
                    }}
                >

                {/* Fullscreen Button inside mapDiv */}
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
                        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    </IconButton>
                </div>

                <BottomDrawer ref={domRefs.bottomDrawerRef} target={mapDivId} />
            </Paper>


            <RightDrawer ref={domRefs.rightDrawerRef} />
            <DADialogBox ref={domRefs.dialogBoxRef} />
            <DASnackbar ref={domRefs.snackBarRef} />
            <DAMapLoading ref={domRefs.loadingRef} />
        </div>
    );
};

export default MapView;
