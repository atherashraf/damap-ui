import { useEffect } from 'react';
import { AppBar, Box, Paper, Toolbar, useTheme } from "@mui/material";
import {getMapVM, MapView, MapVM} from "@/damap";




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
            });
    }, []);

    return (
        <Paper elevation={3} sx={{ m: 0, height: '100%', overflow: 'hidden' }}>
            <MapView theme={theme}>
                <AppBar position="static" color="secondary">
                    <Toolbar variant="dense">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <h3 style={{ margin: 0 }}>Survey Detail</h3>
                        </Box>
                    </Toolbar>
                </AppBar>
            </MapView>
        </Paper>
    );
};

export default MapOverlayer;
