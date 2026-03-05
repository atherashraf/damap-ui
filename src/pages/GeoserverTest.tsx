import MapView from "@/components/map/MapView";
import {AppBar, Box, Button, Paper, Toolbar} from "@mui/material";
import {useEffect} from "react";
import {MapToolbarHandle} from "@/components/map/toolbar/MapToolbarContainer";
import DrawPointTool from "@/components/gis_viewer/buttons/DrawPointTool";
import AddRasterLayerTool from "@/components/gis_viewer/buttons/AddRasterLayerTool";

// import {getMapVM} from "@/damap";
// import GISViewerToolbar from "@/components/gis_viewer/GISViewerToolbar";


function GesServerToolbar() {
    return (
        <Toolbar>
            <Box sx={{ flexGrow: 1 }} />

            <Button variant="contained" color="primary">
                Add Layer
            </Button>
        </Toolbar>
    );
}

const GeoServerTest = () => {
    const appbarHeight = 50;

    useEffect(() => {
        const handleToolbarReady = (evt: Event) => {

            const e = evt as CustomEvent<MapToolbarHandle>;
            console.log("Toolbar ready:", e.detail);

            const toolbar = e.detail;
            toolbar.addButton(<DrawPointTool/>);
            toolbar.addButton(<AddRasterLayerTool />)
        };

        window.addEventListener("mapToolbarContainerReady", handleToolbarReady);

        return () => {
            window.removeEventListener("mapToolbarContainerReady", handleToolbarReady);
        };
    }, []);

    return (

        <Paper
            elevation={6}
            sx={{
                width: "100vw",
                // height: `calc(100vh - ${infoGridHeight}px - ${appbarHeight}px)`,
                height: "100vh",
                // minHeight: "300px",
                // backgroundColor: "red",
                top: 0,
                left: 0,
                position: "absolute",
                zIndex: 9999,
            }}
        >

            <MapView  uuid={"-1"}>
                <AppBar position="static" sx={{height: appbarHeight}} color={"secondary"}>
                    <GesServerToolbar />
                </AppBar>
            </MapView>
        </Paper>
    )
}

export default GeoServerTest;