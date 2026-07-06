import React, {FC, PropsWithChildren, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";

import DADialogBox, { DADialogBoxHandle } from "@damap/components/base/DADialogBox";
import DASnackbar from "@damap/components/base/DASnackbar";
import DAMapLoading, { DAMapLoadingHandle } from "@damap/components/map/widgets/DAMapLoading";
import { IDomRef } from "@damap/types/typeDeclarations";

import BottomDrawer, { BottomDrawerHandle } from "@damap/components/map/drawers/BottomDrawer";
import RightDrawer, { RightDrawerHandle } from "@damap/components/map/drawers/RightDrawer";
import LeftDrawer, { LeftDrawerHandle } from "./drawers/LeftDrawer";

import { Box, Paper, Theme, useTheme } from "@mui/material";
import CustomAlertBox from "@damap/components/base/CustomAlertBox";
import { MapVMProvider, useMapVM } from "@damap/hooks/MapVMContext";
import MapPanel from "@damap/components/map/MapPanel";
import { ThemeProvider } from "@mui/material/styles";

import "ol/ol.css";
import "ol-ext/dist/ol-ext.css";

// import ContextMenu, { ContextMenuHandle } from "@damap/components/map/layer_switcher/ContextMenu";
import { snackbarRef } from "@damap/utils/snackbarRef";
import { IdentifyResultHandle } from "@damap/components/map/widgets/IdentifyResult";
import { TimeSliderHandle } from "@damap/components/map/time_slider/TimeSlider";
import { AttributeTableToolbarHandle } from "@damap/components/map/table/AttributeTableToolbar";
import CustomConfirmBox from "@damap/components/base/CustomConfirmBox";
import CustomFeedbackBox from "@damap/components/base/CustomFeedbackBox";
// import LayerSwitcherLayerMenu, {
//     ContextMenuHandle
// } from "@damap/components/map/layer_switcher_mui/LayerSwitcherLayerMenu";


export type LayerSwitcherType = "MUI" | "OLExt"
interface MapLayoutProps {
    uuid?: string;
    isMap?: boolean;
    theme?: Theme;
    height?: string | number;
    children?: React.ReactNode;
    layerSwitcherType?: LayerSwitcherType ;
}

export const mapDivInfo = {
    mapDivId: "map",
    minMapHeight: 300,
    maxMapHeight: "100vh",
};

type DrawerSide = "left" | "right" | "bottom" | "top";

interface DrawerSizes {
    left: number;
    right: number;
    bottom: number;
    top: number;
}

const MapViewInner: FC<PropsWithChildren<MapLayoutProps>> = ({
                                                                             height = "100%",
                                                                             uuid = "-1",
                                                                             isMap = true,
                                                                             children,
                                                                             theme,
                                                                             layerSwitcherType = "MUI",
                                                                         }) => {
    const mapDivId = mapDivInfo.mapDivId;
    const mapWrapRef = useRef<HTMLDivElement | null>(null);
    const mapVM = useMapVM();
    const layoutManager = mapVM.getLayoutManager();

    const [drawerSizes, setDrawerSizes] = useState<DrawerSizes>(layoutManager.getState());
    const [padding, setPadding] = useState({ left: 0, right: 0, bottom: 0 });
    mapVM.setLayerSwitcherType(layerSwitcherType)
    useEffect(() => {
        return layoutManager.subscribe((state) => {
            setDrawerSizes(state);
        });
    }, [layoutManager]);

    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{
                side: DrawerSide;
                open: boolean;
                size: number;
            }>;

            if (!ce.detail) return;
            layoutManager.updateFromDetail(ce.detail);
        };

        window.addEventListener("drawerLayout", handler as EventListener);
        return () => {
            window.removeEventListener("drawerLayout", handler as EventListener);
        };
    }, [layoutManager]);

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

                return prev.left === next.left &&
                prev.right === next.right &&
                prev.bottom === next.bottom
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

    const muiTheme = useTheme();
    const th = theme || muiTheme;

    return (
        <ThemeProvider theme={th}>
            <Box
                id="fullscreen"
                sx={{
                    display: "flex",
                    width: "100%",
                    height,
                    flexDirection: "row",
                    position: "relative",
                    overflow: "hidden",
                    ...layoutManager.getCSSVars(),
                }}
            >
                <LeftDrawer ref={mapVM.getLeftDrawerRef()} />

                <Paper
                    sx={{
                        flex: 1,
                        height: "100%",
                        position: "relative",
                        overflow: "hidden",
                    }}
                    elevation={6}
                >
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
                        <CustomAlertBox />
                        <CustomConfirmBox />
                        <CustomFeedbackBox />

                        <MapPanel isMap={isMap} uuid={uuid}>
                            {children}
                        </MapPanel>
                        <DAMapLoading ref={mapVM.getMapLoadingRef()} />
                    </Box>

                    <BottomDrawer ref={mapVM.getBottomDrawerRef()} target={mapDivId} />
                </Paper>

                <RightDrawer ref={mapVM.getRightDrawerRef()} />

                <DADialogBox ref={mapVM.getDialogBoxRef()} />
                <DASnackbar ref={mapVM.getSnackbarRef()} />

                {/*<LayerSwitcherLayerMenu ref={mapVM.getContextMenuRef()} />*/}
            </Box>
        </ThemeProvider>
    );
};

const MapView: React.FC<React.PropsWithChildren<MapLayoutProps>> = (props) => {
    const rightDrawerRef = useRef<RightDrawerHandle>(null);
    const leftDrawerRef = useRef<LeftDrawerHandle>(null);
    const bottomDrawerRef = useRef<BottomDrawerHandle>(null);
    const dialogBoxRef = useRef<DADialogBoxHandle>(null);
    const timeSliderRef = useRef<TimeSliderHandle>(null);
    const loadingRef = useRef<DAMapLoadingHandle>(null);
    const identifyResultRef = useRef<IdentifyResultHandle>(null);
    // const contextMenuRef = useRef<ContextMenuHandle>(null);
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
            // contextMenuRef,
            attributeTableToolbarRef,
        }),
        []
    );

    return (
        <MapVMProvider domRef={domRefs}>
            <MapViewInner {...props} />
        </MapVMProvider>
    );
};

export default MapView;
