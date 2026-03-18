import { IconButton } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {getMapVM, MapVM} from "@/damap";

/**
 * Draw Point tool using an IconButton with Location icon
 */
const DrawPointToolButton = () => {
    const mapVM: MapVM = getMapVM();
    const handleDrawPoint = () => {
        if (!mapVM) return;

        mapVM.tools.activateCustomExclusive(
            "draw-point",
            (on: any) => {
                on("click", (evt: any) => {
                    const coordinate = evt.coordinate;
                    const wkt = `POINT(${coordinate[0]} ${coordinate[1]})`;
                    console.log("Point drawn at:", wkt);

                    // Example:
                    mapVM.getSelectionLayer('drawing').addWKT2Selection(wkt, false);
                    // or convert to GeoJSON + OverlayVectorLayer
                });
            },
            "crosshair",
            {
                message: {
                    text: "Draw Point: click on map",
                    severity: "info",
                },
                esc: {
                    enabled: true,
                    onEsc: () => console.log("Draw Point cancelled"),
                },
            }
        );
    }
    return (
        <IconButton
            size="small"
            color="primary"
            title="Draw Point"
            onClick={handleDrawPoint}
        >
            <LocationOnIcon />
        </IconButton>
    );
};

export default DrawPointToolButton;
