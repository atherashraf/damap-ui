import {RefObject, useEffect} from 'react';
import {AppBar, Box, IconButton, Paper, Toolbar, useTheme} from "@mui/material";
import {ContextMenuHandle, getMapVM, IFeatureStyle, MapToolbarHandle, MapView, MapVM, useMapVM} from "@/damap";
import CustomFeatureViewer from "@/components/map/test/CustomFeatureViewer";

import OverlayVectorLayer from "@/components/map/layers/overlay_layers/OverlayVectorLayer";
import {ITextStyle} from "@/types/typeDeclarations";
import AddTextStyle from "@/components/map/toolbar/controls/external/AddTextStyle";
import AddIcon from "@mui/icons-material/Add";

const CustomAppBar = () =>{
    const mapVM: MapVM = useMapVM();
    const contextMenuRef:RefObject<ContextMenuHandle | null>  = mapVM.getContextMenuRef()

    useEffect(() => {
        if(!mapVM) return

        const content = <IconButton
            onClick={() => alert("Custom overlay from mapVM")}
            sx={{
                position: "absolute",
                top: 60,
                right: 10,
                zIndex: 110,
                backgroundColor: "green",
                color: "white",
            }}
            size="small"
        >
            <AddIcon />
        </IconButton>
        mapVM?.setMapPanelButtons(content)
        const handleToolbarReady = (e: Event) => {
            const customEvent = e as CustomEvent<MapToolbarHandle>;
            const toolbar = customEvent.detail;
            toolbar.addButton(<AddTextStyle mapVM={mapVM} />);
        };

        window.addEventListener("mapToolbarContainerReady", handleToolbarReady);
        return () => {
            window.removeEventListener("mapToolbarContainerReady", handleToolbarReady);
        };

    }, [mapVM]);


    useEffect(() => {
        if (!contextMenuRef?.current) return;


        contextMenuRef.current.addMenuItem({
            id: "toggle_label",
            name: "Toggle Label",
            onClick: () => {
                const layer = contextMenuRef.current?.getCurrentLayer?.();
                if (!layer) {
                    console.warn("Layer not set.");
                    return;
                }

                const uuid = layer.get("name")
                const lyr: OverlayVectorLayer =  mapVM.getOverlayLayer(uuid) as OverlayVectorLayer
                // console.log(uuid, lyr)

                const textStyle: ITextStyle = {
                    font: '20px Calibri, sans-serif',
                    fillColor: "#ff0000",
                    strokeColor: "#000000",
                    strokeWidth: 1,
                    offsetX: 10,
                    offsetY: 10,
                    placement: "point"
                }
                // lyr.setTextStyle(textStyle)
                // lyr.setLabelProperty("property_type")
                // lyr.toggleShowLabel()
                lyr.updateLabelOptions("property_type", textStyle)
                // const features = layer.getSource().getFeatures();



                // console.log(`Label applied to ${features.length} features`);
            }

        });
    }, [contextMenuRef?.current]);

    return (
        <AppBar position="static" color="secondary">
            <Toolbar variant="dense">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <h3 style={{ margin: 0 }}>Survey Detail</h3>
                </Box>
            </Toolbar>
        </AppBar>
    )
}


const MapOverlayer = () => {
    const theme = useTheme();
    const pakLayerUUID = MapVM.generateUUID();
    const provinceLayerUUID = MapVM.generateUUID();
    const add_pak_boundary = () =>{

        fetch('/media/pak_boundary.geojson')  // `public/media/` is accessible as `/media/`
            .then(res => res.json())
            .then(json => {
                const mapVM = getMapVM();
                mapVM.createOverlayLayer(pakLayerUUID, json, "pak_boundary");
                const overlayLayer = mapVM.getOverlayLayer(pakLayerUUID) as OverlayVectorLayer
                const newStyle: IFeatureStyle = {
                    type: "single",
                    style: {
                        default: {
                            strokeColor: "#00AA00",   // green stroke
                            strokeWidth: 4,
                            lineDash: [6, 10],
                            fillColor: "rgba(0,0,0,0)"       // transparent
                        }
                    }
                };
                setTimeout(() =>overlayLayer.setStyle(newStyle, true), 2000 )
                // console.log(mapVM.overlayLayers)
                mapVM.zoomToAllLayersExtent()
                mapVM.setCustomIdentifyRenderer((feature) => <CustomFeatureViewer feature={feature} />);

            });

    }
    const add_province_boundary = () =>{
        fetch('/media/pak_provinces.geojson')  // `public/media/` is accessible as `/media/`
            .then(res => res.json())
            .then(json => {
                const mapVM = getMapVM();
                mapVM.createOverlayLayer(provinceLayerUUID, json, "province")
                const overlayLayer = mapVM.getOverlayLayer(provinceLayerUUID) as OverlayVectorLayer
                const provinceStyle: IFeatureStyle = {
                    type: "multiple",
                    style: {
                        default: {
                            strokeColor: "#666",
                            strokeWidth: 1,
                            fillColor: "rgba(200,200,200,0.2)"
                        },
                        rules: [
                            {
                                title: "Punjab",
                                filter: { field: "adm1_en", op: "==", value: "Punjab" },
                                style: {
                                    strokeColor: "#2ecc71",
                                    strokeWidth: 2,
                                    fillColor: "rgba(46,204,113,0.3)"
                                }
                            },
                            {
                                title: "Sindh",
                                filter: { field: "adm1_en", op: "==", value: "Sindh" },
                                style: {
                                    strokeColor: "#3498db",
                                    strokeWidth: 2,
                                    fillColor: "rgba(52,152,219,0.3)"
                                }
                            },
                            {
                                title: "Balochistan",
                                filter: { field: "adm1_en", op: "==", value: "Balochistan" },
                                style: {
                                    strokeColor: "#e67e22",
                                    strokeWidth: 2,
                                    fillColor: "rgba(230,126,34,0.3)"
                                }
                            },
                            {
                                title: "Khyber Pakhtunkhwa",
                                filter: { field: "adm1_en", op: "==", value: "Khyber Pakhtunkhwa" },
                                style: {
                                    strokeColor: "#9b59b6",
                                    strokeWidth: 2,
                                    fillColor: "rgba(155,89,182,0.3)"
                                }
                            },
                            {
                                title: "Gilgit Baltistan",
                                filter: { field: "adm1_en", op: "==", value: "Gilgit Baltistan" },
                                style: {
                                    strokeColor: "#e74c3c",
                                    strokeWidth: 2,
                                    fillColor: "rgba(231,76,60,0.3)"
                                }
                            },
                            {
                                title: "Azad Kashmir",
                                filter: { field: "adm1_en", op: "==", value: "Azad Kashmir" },
                                style: {
                                    strokeColor: "#16a085",
                                    strokeWidth: 2,
                                    fillColor: "rgba(22,160,133,0.3)"
                                }
                            },
                            {
                                title: "Islamabad",
                                filter: { field: "adm1_en", op: "==", value: "Islamabad" },
                                style: {
                                    strokeColor: "#f1c40f",
                                    strokeWidth: 2,
                                    fillColor: "rgba(241,196,15,0.3)"
                                }
                            }
                        ]
                    }
                };
                overlayLayer.setStyle(provinceStyle, true)
                // console.log(mapVM.overlayLayers)
                mapVM.zoomToAllLayersExtent()
                mapVM.setCustomIdentifyRenderer((feature) => <CustomFeatureViewer feature={feature} />);

            });
    }
    useEffect(() => {
        add_province_boundary()
        add_pak_boundary();
    }, []);


    return (
        <Paper elevation={3} sx={{ m: 0, height: "100%", overflow: 'auto' }}>
            <MapView theme={theme}>
               <CustomAppBar />
            </MapView>
        </Paper>
    );
};

export default MapOverlayer;
