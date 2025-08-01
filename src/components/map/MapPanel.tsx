import {mapDivInfo} from "@/components/map/MapView";
import {alpha, IconButton, useTheme} from "@mui/material";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import React, {Fragment, useEffect, useRef, useState} from "react";
import {useMapVM} from "@/hooks/MapVMContext";
import {MapAPIs} from "@/api/MapApi";
import {IMapInfo} from "@/types/typeDeclarations";
import {TimeSliderHandle} from "@/components/map/time_slider/TimeSlider";
import {Control} from "ol/control";

interface IMapPanelProps {
    isMap: boolean;
    uuid?: string;
    isEditor?: boolean;
    children?: React.ReactNode; // already for toolbar
}

const MapPanel = ({isMap, uuid, isEditor, children}: IMapPanelProps) => {
    const theme = useTheme();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const mapVM = useMapVM();
    const mapDivId = mapDivInfo.mapDivId;
    uuid = uuid || "-1";
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarHeight, setToolbarHeight] = useState(0);
    const timeSliderRef = useRef<TimeSliderHandle>(null!);
    const [timeSliderControl, setTimeSliderControl] = useState<Control | null>(null);

    const style = document.createElement('style');
    style.innerHTML = `.ol-control {
                background-color: ${alpha(theme.palette.secondary.dark, 0.2)} !important;
                color: ${theme.palette.secondary.contrastText} !important;
          }
          .ol-control button {
                background-color: ${theme.palette.secondary.main} !important;
                color: ${theme.palette.secondary.contrastText} !important;
                min-width: 30px;
                min-height: 30px;
                color: white !important;
            }`;
    document.head.appendChild(style);

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
                ?.get(MapAPIs.DCH_MAP_INFO, {uuid})
                .then((payload: IMapInfo) => {
                    const mapInfo: IMapInfo = {...payload, isEditor};
                    if (!mapVM.isInit) mapVM.initMap(mapInfo);
                    mapVM.setTarget(mapDivId);

                });
        } else if (isMap) {
            const mapInfo: IMapInfo = {uuid: uuid || "-1", isEditor, layers: []};
            if (!mapVM.isInit) {
                mapVM.initMap(mapInfo);
                mapVM.setTarget(mapDivId);
            }
        } else {
            const info: IMapInfo = {uuid: uuid || "-1", isEditor, layers: []};
            if (!mapVM.isInit) {
                mapVM.initMap(info);
                (async () => {
                    await mapVM.addDALayer({uuid});
                    const extent = await mapVM.getDALayer(uuid)?.getExtent();
                    mapVM.setMapFullExtent(extent);
                    mapVM.zoomToFullExtent();
                })();
                //@ts-ignore
                mapVM.setLayerOfInterest(uuid);
                mapVM.setTarget(mapDivId);
                // mapVM.setDomRef(domRefs);
            }
        }
        mapVM.setTheme(theme)
    }, [uuid, isMap, isEditor]);

    useEffect(() => {

        const handleTemporalLayerAdded = (_: any) => {

            if (mapVM.hasTemporalLayers() && !timeSliderRef.current?.hasControl) {
                // const onDateChange = (selectedDate: Date) => {
                //     console.log("Selected temporal date:", selectedDate.toISOString());
                // }
                const newControl = mapVM.addTimeSliderControl(timeSliderRef);
                setTimeSliderControl(newControl);

            }
        };

        window.addEventListener("temporalLayerAdded", handleTemporalLayerAdded);

        return () => {
            window.removeEventListener("temporalLayerAdded", handleTemporalLayerAdded);
        };
    }, [mapVM]);


    useEffect(() => {
        return () => {
            if (timeSliderControl) {
                mapVM.getMap()?.removeControl(timeSliderControl);
            }
        };
    }, [timeSliderControl]);


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

                {mapVM.getMapPanelButtons().map((button) => button)}
            </div>
        </Fragment>
    )
}
export default MapPanel