import  { useEffect } from "react";
import { MapToolbarHandle, useMapVM } from "@damap/damap";
import DrawPointTool from "@demo/components/gis_viewer/buttons/DrawPointTool";
import { Toolbar } from "@mui/material";

const GISViewerToolbar = () => {
    const mapVM = useMapVM();

    useEffect(() => {
        const handleToolbarReady = (evt: Event) => {
            const e = evt as CustomEvent<MapToolbarHandle>;
            console.log("Toolbar ready:", e.detail);

            const toolbar = e.detail;
            toolbar.addButton(<DrawPointTool />);
        };

        window.addEventListener("mapToolbarContainerReady", handleToolbarReady);

        return () => {
            window.removeEventListener("mapToolbarContainerReady", handleToolbarReady);
        };
    }, [mapVM]);

    return (
        <Toolbar sx={{ justifyContent: "center" }}>
            <h2>GIS Viewer Toolbar</h2>
        </Toolbar>
    );
};

export default GISViewerToolbar;
