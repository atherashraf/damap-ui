
import { Box, Button } from "@mui/material";
import MapVM from "@damap/components/map/models/MapVM";
import VectorStyling from "./VectorStyling";
import RasterStyling from "./RasterStyling";
import MapApi, {MapAPIs} from "@damap/api/MapApi";
// import ZoomVisibilitySetting from "@damap/components/map/layer_styling/ZoomVisibilitySettings";

export interface SymbologySettingProps {
    mapVM: MapVM;
    layerId?: string;
}

const SymbologySetting = (props: SymbologySettingProps) => {
    const activeUuid = props.layerId ?? props.mapVM.getLayerOfInterest();

    if (!activeUuid) {
        return null;
    }

    const daLayer = props.mapVM.getDALayer(activeUuid);

    const handleDownloadStyle = () => {
        const url = MapApi.getURL(MapAPIs.DCH_DOWNLOAD_DA_STYLE, {uuid: activeUuid});
        window.open(url);
    };

    return (
        <Box sx={{width: "100%", boxSizing: "border-box", p: 1}}>


            {daLayer?.layerInfo?.dataModel === "R" ? (
                <RasterStyling mapVM={props.mapVM}/>
            ) : (
                <VectorStyling mapVM={props.mapVM}/>
            )}

            <Button
                sx={{mt: 2}}
                fullWidth={true}
                color={"primary"}
                variant={"contained"}
                onClick={handleDownloadStyle}
            >
                Download Style
            </Button>
        </Box>
    );
};

export default SymbologySetting;