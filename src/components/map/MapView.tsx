import React, {useRef} from "react";

import DADialogBox from "@/components/base/DADialogBox";
import DASnackbar from "@/components/base/DASnackbar";
import DAMapLoading from "@/components/map/widgets/DAMapLoading";
import {IDomRef} from "@/types/typeDeclarations";

import BottomDrawer from "@/components/map/drawers/BottomDrawer";
import RightDrawer from "@/components/map/drawers/RightDrawer";
import LeftDrawer from "./drawers/LeftDrawer";
import {Paper, Theme} from "@mui/material";
import CustomAlertBox from "@/components/base/CustomAlertBox";
import {MapVMProvider} from "@/hooks/MapVMContext";
import MapPanel from "@/components/map/MapPanel";
import {ThemeProvider} from "@mui/material/styles";
import 'ol/ol.css';
import 'ol-ext/dist/ol-ext.css';


interface MapLayoutProps {
    uuid?: string;
    isMap?: boolean;
    theme: Theme;
    children?: React.ReactNode;
}

export const mapDivInfo = {
    mapDivId: "map",
    minMapHeight: 300,
    maxMapHeight: "100vh",
};

const MapView: React.FC<React.PropsWithChildren<MapLayoutProps>> = ({
                                                                        uuid="-1",
                                                                        isMap=true,
                                                                        children,
                                                                        theme
                                                                    }) => {
    const mapDivId = mapDivInfo.mapDivId;


    const domRefs: IDomRef = {
        rightDrawerRef: useRef(null),
        leftDrawerRef: useRef(null),
        bottomDrawerRef: useRef(null),
        dialogBoxRef: useRef(null),
        snackBarRef: useRef(null),
        loadingRef: useRef(null),
    };

    // const mapVMRef = useRef<MapVM | null>(null);
    // if (!mapVMRef.current) {
    //     mapVMRef.current = new MapVM(domRefs, isDesigner);
    // }


    return (

        <MapVMProvider domRef={domRefs}>
            <ThemeProvider theme={theme}>
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


                    <RightDrawer ref={domRefs.rightDrawerRef}/>
                    <DADialogBox ref={domRefs.dialogBoxRef}/>
                    <DASnackbar ref={domRefs.snackBarRef}/>
                    <DAMapLoading ref={domRefs.loadingRef}/>
                </div>
            </ThemeProvider>
        </MapVMProvider>

    );
};

export default MapView;
