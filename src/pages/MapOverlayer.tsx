import {RefObject, useEffect} from 'react';
import {AppBar, Box, IconButton, Paper, Toolbar, useTheme} from "@mui/material";
import {ContextMenuHandle, getMapVM, MapToolbarHandle, MapView, MapVM, useMapVM} from "@/damap";
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

        window.addEventListener("toolbarContainerReady", handleToolbarReady);
        return () => {
            window.removeEventListener("toolbarContainerReady", handleToolbarReady);
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
    const layerUUID = MapVM.generateUUID();
    useEffect(() => {
        fetch('/media/test.geojson')  // `public/media/` is accessible as `/media/`
            .then(res => res.json())
            .then(json => {
                const mapVM = getMapVM();
                mapVM.createOverlayLayer(layerUUID, json, "dummy")

                // console.log(mapVM.overlayLayers)
                mapVM.zoomToAllLayersExtent()

                // testing custom feature render
                const identifierRef = mapVM.getIdentifierResultRef()
                identifierRef?.current?.setFeatureRenderer(
                    (feature)=> <CustomFeatureViewer feature={feature} />)


            });
    }, []);


    return (
        <Paper elevation={3} sx={{ m: 0, height: '100%', overflow: 'hidden' }}>
            <MapView theme={theme}>
               <CustomAppBar />
            </MapView>
        </Paper>
    );
};

export default MapOverlayer;
