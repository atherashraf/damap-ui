import * as React from "react";
import {IconButton, Tooltip} from "@mui/material";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";

import {useMapVM} from "@/components/map/toolbar/MapToolbarVMContext.tsx";

const Zoom2Extent = () => {
    const mapVM = useMapVM();

    return (
        <React.Fragment>
            <Tooltip title={"Zoom to Map Extent"}>
                <IconButton
                    sx={{padding: "3px"}}
                    onClick={() => mapVM.zoomToFullExtent()}
                >
                    <ZoomInMapIcon/>
                </IconButton>
            </Tooltip>
        </React.Fragment>
    );
};
export default Zoom2Extent;
