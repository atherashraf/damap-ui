import MapView from "@/components/map/MapView";
import {AppBar, Paper} from "@mui/material";
import {useEffect} from "react";
import {MapToolbarHandle} from "@/components/map/toolbar/MapToolbarContainer";
import DrawPointTool from "@/components/gis_viewer/buttons/DrawPointTool";
import AddRasterLayerTool from "@/components/gis_viewer/buttons/AddRasterLayerTool";

// import {getMapVM} from "@/damap";
// import GISViewerToolbar from "@/components/gis_viewer/GISViewerToolbar";



const GISViewer = () => {
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
                height: "100vh",
                // backgroundColor: "red",
                top: 0,
                left: 0,
                position: "absolute",
                zIndex: 9999,
            }}
        >

            <MapView  uuid={"-1"}>
                <AppBar position="static" sx={{height: appbarHeight}} color={"secondary"}>
                    {/*<GroundWaterToolbar />*/}
                    {/*<GISViewerToolbar />*/}
                </AppBar>
            </MapView>
        </Paper>
    )
}

export default GISViewer;