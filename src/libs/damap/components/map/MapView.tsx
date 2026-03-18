import {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";

import DADialogBox, {DADialogBoxHandle} from "@damap/components/base/DADialogBox";
import DASnackbar from "@damap/components/base/DASnackbar";
import DAMapLoading, {DAMapLoadingHandle} from "@damap/components/map/widgets/DAMapLoading";
import {IDomRef} from "@damap/types/typeDeclarations";

import BottomDrawer, {BottomDrawerHandle} from "@damap/components/map/drawers/BottomDrawer";
import RightDrawer, {RightDrawerHandle} from "@damap/components/map/drawers/RightDrawer";
import LeftDrawer, {LeftDrawerHandle} from "./drawers/LeftDrawer";

import {Box, Paper, Theme, useTheme} from "@mui/material";
import CustomAlertBox from "@damap/components/base/CustomAlertBox";
import {MapVMProvider} from "@damap/hooks/MapVMContext";
import MapPanel from "@damap/components/map/MapPanel";
import {ThemeProvider} from "@mui/material/styles";

import "ol/ol.css";
import "ol-ext/dist/ol-ext.css";

import ContextMenu, {ContextMenuHandle} from "@damap/components/map/layer_switcher/ContextMenu";
import {snackbarRef} from "@damap/utils/snackbarRef";
import {IdentifyResultHandle} from "@damap/components/map/widgets/IdentifyResult";
import {TimeSliderHandle} from "@damap/components/map/time_slider/TimeSlider";
import {AttributeTableToolbarHandle} from "@damap/components/map/table/AttributeTableToolbar";

interface MapLayoutProps {
    uuid?: string;
    isMap?: boolean;
    theme?: Theme;
    height?: string | number;
    children?: React.ReactNode;
}

export const mapDivInfo = {
    mapDivId: "map", minMapHeight: 300, maxMapHeight: "100vh",
};

const MapView: React.FC<React.PropsWithChildren<MapLayoutProps>> = ({
                                                                        height="100%",
                                                                        uuid = "-1",
                                                                        isMap = true,
                                                                        children, theme
                                                                    }) => {
    const mapDivId = mapDivInfo.mapDivId;
    const mapWrapRef = useRef<HTMLDivElement | null>(null);
    const [padding, setPadding] = useState({left: 0, right: 0, bottom: 0});
    const [drawerSizes, setDrawerSizes] = useState({left: 0, right: 0, bottom: 0});

    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{ side: "left" | "right" | "bottom"; size: number }>;
            const {side, size} = ce.detail;
            setDrawerSizes((prev) => ({...prev, [side]: size}));
        };

        window.addEventListener("drawerLayout", handler as EventListener);
        return () => window.removeEventListener("drawerLayout", handler as EventListener);
    }, []);


    useLayoutEffect(() => {
        const el = mapWrapRef.current;
        if (!el) return;

        const compute = () => {
            const r = el.getBoundingClientRect();
            const leftPad = Math.max(0, drawerSizes.left - r.left);
            const rightPad = Math.max(0, drawerSizes.right - (window.innerWidth - r.right));
            const bottomPad = Math.max(0, drawerSizes.bottom - (window.innerHeight - r.bottom));

            setPadding((prev) => {
                const next = {
                    left: Math.round(leftPad),
                    right: Math.round(rightPad),
                    bottom: Math.round(bottomPad),
                };
                return (prev.left === next.left && prev.right === next.right && prev.bottom === next.bottom)
                    ? prev
                    : next;
            });

        };

        compute();

        const onResize = () => compute();
        const onScroll = () => compute();

        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onScroll, true);

        const ro = new ResizeObserver(compute);
        ro.observe(el);

        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("scroll", onScroll, true);
            ro.disconnect();
        };
    }, [drawerSizes.left, drawerSizes.right, drawerSizes.bottom]);


    // useEffect(() => {
    //     const handler = (e: any) => {
    //         const { side, size } = e.detail as { side: "left" | "right" | "bottom"; size: number };
    //
    //         setOffsets((prev) => ({ ...prev, [side]: size }));
    //     };
    //
    //     window.addEventListener("drawerLayout", handler);
    //     return () => window.removeEventListener("drawerLayout", handler);
    // }, []);

    const rightDrawerRef = useRef<RightDrawerHandle>(null);
    const leftDrawerRef = useRef<LeftDrawerHandle>(null);
    const bottomDrawerRef = useRef<BottomDrawerHandle>(null);
    const dialogBoxRef = useRef<DADialogBoxHandle>(null);
    const timeSliderRef = useRef<TimeSliderHandle>(null);
    const loadingRef = useRef<DAMapLoadingHandle>(null);
    const identifyResultRef = useRef<IdentifyResultHandle>(null);
    const contextMenuRef = useRef<ContextMenuHandle>(null);
    const attributeTableToolbarRef = useRef<AttributeTableToolbarHandle>(null);

    const domRefs: IDomRef = useMemo(
        () => ({
            rightDrawerRef,
            leftDrawerRef,
            bottomDrawerRef,
            dialogBoxRef,
            timeSliderRef,
            snackBarRef: snackbarRef,
            loadingRef,
            identifyResultRef,
            contextMenuRef,
            attributeTableToolbarRef,
        }),
        []
    );


    const th = theme ? theme : useTheme();

    return (<MapVMProvider domRef={domRefs}>
            <ThemeProvider theme={th}>
                {/* Use 100vh so layout is stable even if parents don't set height */}
                <Box
                    id="fullscreen"
                    sx={{
                        display: "flex",
                        width: "100%",
                        height: height,
                        flexDirection: "row",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <LeftDrawer ref={domRefs.leftDrawerRef}/>

                    {/* Map container */}
                    <Paper sx={{flex: 1, height: "100%", position: "relative", overflow: "hidden"}} elevation={6}>
                        <Box
                            ref={mapWrapRef}
                            sx={{
                                position: "relative",
                                height: "100%",
                                width: "100%",
                                pl: `${padding.left}px`,
                                pr: `${padding.right}px`,
                                pb: `${padding.bottom}px`,
                                boxSizing: "border-box",
                            }}
                        >

                            <CustomAlertBox/>

                            <MapPanel isMap={isMap} uuid={uuid}>
                                {children}
                            </MapPanel>

                        </Box>

                        <BottomDrawer ref={domRefs.bottomDrawerRef} target={mapDivId}/>
                    </Paper>


                    <RightDrawer ref={domRefs.rightDrawerRef}/>

                    {/* Global overlays */}
                    <DADialogBox ref={domRefs.dialogBoxRef}/>
                    <DASnackbar ref={domRefs.snackBarRef}/>
                    <DAMapLoading ref={domRefs.loadingRef}/>
                    <ContextMenu ref={domRefs.contextMenuRef}/>
                </Box>
            </ThemeProvider>
        </MapVMProvider>);
};

//@ts-ignore
export default MapView;
