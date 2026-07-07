import { AppBar, Box, Button, Paper, Toolbar } from "@mui/material";
import { useCallback, useEffect } from "react";
import { transformExtent } from "ol/proj";

import MapView from "@damap/components/map/MapView";
import { useMapVM } from "@damap/hooks/MapVMContext";

import WFSLayer from "@damap/components/map/layers/overlay_layers/WFSLayer";

import { MapToolbarHandle } from "@damap/components/map/toolbar/MapToolbarContainer";
import DrawPointTool from "@demo/components/gis_viewer/buttons/DrawPointTool";
import AddRasterLayerTool from "@demo/components/gis_viewer/buttons/AddRasterLayerTool";

function GesServerToolbar() {
    const mapVM = useMapVM();

    const wmsUUID = "wms_district_boundary";
    const wfsUUID = "wfs_district_boundary";

    const zoomToPakistan = useCallback(() => {
        if (!mapVM) return;
        const map = mapVM.getMap?.();
        if (!map) return;

        const pak4326: [number, number, number, number] = [
            60.8742484882, 23.6919650335, 77.8374507995, 37.1330309108,
        ];
        const viewProj = mapVM.getViewProjectionCode();
        const pakExtent = transformExtent(pak4326, "EPSG:4326", viewProj);
        mapVM.zoomToExtent(pakExtent, 10);
    }, [mapVM]);

    const addWMSLayer = useCallback(() => {
        if (!mapVM) return;
        const map = mapVM.getMap?.();
        if (!map) return;

        if (!mapVM.isOverlayLayerExist(wmsUUID)) {
            mapVM.createWMSLayer({
                uuid: wmsUUID,
                name:wmsUUID,
                title: "District Boundary (WMS)",
                url: "https://gis.wasalhr.pk:82/geoserver/cite/wms",
                layers: "cite:district_boundary",
                tiled: true,
                format: "image/png",
                transparent: true,
                version: "1.1.1",
                zIndex: 600,
                visible: true,
                opacity: 1,
            });
        }

        zoomToPakistan();
    }, [mapVM, zoomToPakistan]);

    const addWFSLayer = useCallback(async () => {
        if (!mapVM) return;
        const map = mapVM.getMap?.();
        if (!map) return;

        if (!mapVM.isOverlayLayerExist(wfsUUID)) {
            mapVM.createWFSLayer({
                uuid: wfsUUID,
                name:wfsUUID,
                title: "District Boundary (WFS)",
                url: "https://gis.wasalhr.pk:82/geoserver/cite/ows",
                typeName: "cite:district_boundary",
                srsName: "EPSG:4326",
                maxFeatures: 5000,

                style: {
                    type: "single",
                    style: {
                        default: {
                            strokeColor: "#00AA00",
                            strokeWidth: 2,
                            fillColor: "rgba(0,170,0,0.15)",
                        },
                    },
                },

                showLabel: true,
                labelProperty: "district_n",
                textStyle: {
                    font: "12px Calibri",
                    fillColor: "#000",
                    strokeColor: "#fff",
                    strokeWidth: 2,
                },
            });
        }

        const layer = mapVM.getOverlayLayer(wfsUUID);
        if (!layer) return;

        const wfs = layer as WFSLayer;
        wfs.setCqlFilter("division_n='Sargodha'");
        await wfs.reload(true);

        zoomToPakistan();
    }, [mapVM, zoomToPakistan]);

    useEffect(() => {
        addWMSLayer();
        addWFSLayer();
    }, [addWMSLayer, addWFSLayer]);

    return (
        <Toolbar>
            <Box sx={{ flexGrow: 1 }} />

            <Button variant="contained" onClick={addWMSLayer}>
                Add WMS
            </Button>

            <Button variant="contained" onClick={addWFSLayer} sx={{ ml: 1 }}>
                Add WFS
            </Button>
        </Toolbar>
    );
}

const GeoServerTest = () => {
    const appbarHeight = 50;

    useEffect(() => {
        const handleToolbarReady = (evt: Event) => {
            const e = evt as CustomEvent<MapToolbarHandle>;
            const toolbar = e.detail;
            toolbar.addButton(<DrawPointTool />);
            toolbar.addButton(<AddRasterLayerTool />);
        };

        window.addEventListener("mapToolbarContainerReady", handleToolbarReady);
        return () => window.removeEventListener("mapToolbarContainerReady", handleToolbarReady);
    }, []);

    return (
        <Paper
            elevation={6}
            sx={{
                width: "100vw",
                height: "100vh",
                top: 0,
                left: 0,
                position: "absolute",
                zIndex: 9999,
            }}
        >
            <MapView uuid={"-1"}>
                <AppBar position="static" sx={{ height: appbarHeight }} color={"secondary"}>
                    <GesServerToolbar />
                </AppBar>
            </MapView>
        </Paper>
    );
};

export default GeoServerTest;