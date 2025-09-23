import React, { useRef} from "react";

import DADialogBox, {DADialogBoxHandle} from "@/components/base/DADialogBox";
import DASnackbar  from "@/components/base/DASnackbar";
import DAMapLoading, {DAMapLoadingHandle} from "@/components/map/widgets/DAMapLoading";
import {IDomRef} from "@/types/typeDeclarations";

import BottomDrawer, {BottomDrawerHandle} from "@/components/map/drawers/BottomDrawer";
import RightDrawer, { RightDrawerHandle } from "@/components/map/drawers/RightDrawer";
import LeftDrawer, {LeftDrawerHandle} from "./drawers/LeftDrawer";
import {Paper, Theme, useTheme} from "@mui/material";
import CustomAlertBox from "@/components/base/CustomAlertBox";
import {MapVMProvider} from "@/hooks/MapVMContext";
import MapPanel from "@/components/map/MapPanel";
import {ThemeProvider} from "@mui/material/styles";
import 'ol/ol.css';
import 'ol-ext/dist/ol-ext.css';


import ContextMenu, {ContextMenuHandle} from "@/components/map/layer_switcher/ContextMenu";
import {snackbarRef} from "@/utils/snackbarRef";
import {IdentifyResultHandle} from "@/components/map/widgets/IdentifyResult";
import {TimeSliderHandle} from "@/components/map/time_slider/TimeSlider";
import {AttributeTableToolbarHandle} from "@/components/map/table/AttributeTableToolbar";


interface MapLayoutProps {
    uuid?: string;
    isMap?: boolean;
    theme?: Theme;
    children?: React.ReactNode;
}

export const mapDivInfo = {
    mapDivId: "map",
    minMapHeight: 300,
    maxMapHeight: "100vh",
};

const MapView: React.FC<React.PropsWithChildren<MapLayoutProps>> = ({
                                                                        uuid = "-1",
                                                                        isMap = true,
                                                                        children,
                                                                        theme
                                                                    }) => {
    const mapDivId = mapDivInfo.mapDivId;


    const domRefs: IDomRef = {
        rightDrawerRef: useRef<RightDrawerHandle>(null),
        leftDrawerRef: useRef<LeftDrawerHandle>(null),
        bottomDrawerRef: useRef<BottomDrawerHandle>(null),
        dialogBoxRef: useRef<DADialogBoxHandle>(null),
        timeSliderRef: useRef<TimeSliderHandle>(null),
        snackBarRef: snackbarRef,
        loadingRef: useRef<DAMapLoadingHandle>(null),
        identifyResultRef: useRef<IdentifyResultHandle>(null),
        contextMenuRef: useRef<ContextMenuHandle>(null),
        attributeTableToolbarRef: useRef<AttributeTableToolbarHandle>(null)
    };

    // const mapVMRef = useRef<MapVM | null>(null);
    // if (!mapVMRef.current) {
    //     mapVMRef.current = new MapVM(domRefs, isDesigner);
    // }

    const th = theme ? theme: useTheme()

    return (

        <MapVMProvider domRef={domRefs}>
            <ThemeProvider theme={th}>
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
                    <LeftDrawer ref={domRefs.leftDrawerRef}/>

                    <Paper
                        sx={{
                            flex: 1,
                            height: "100%",
                            position: "relative",
                            overflow: "hidden",
                        }}
                        elevation={6}
                    >
                        <CustomAlertBox/>

                        <MapPanel children={children} isMap={isMap} uuid={uuid}/>

                        <BottomDrawer ref={domRefs.bottomDrawerRef} target={mapDivId}/>
                    </Paper>


                    <RightDrawer ref={domRefs.rightDrawerRef} />

                    <DADialogBox ref={domRefs.dialogBoxRef}/>
                    <DASnackbar ref={domRefs.snackBarRef}/>
                    <DAMapLoading ref={domRefs.loadingRef}/>
                    <ContextMenu ref={domRefs.contextMenuRef}/>
                </div>
            </ThemeProvider>
        </MapVMProvider>

    );
};

export default MapView;
