import * as React from "react";
import {IconButton, Tooltip} from "@mui/material";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import {useMapVM} from "@/hooks/MapVMContext";


const Zoom2Extent = () => {
    const mapVM = useMapVM();

    const theme = useMapVM().getTheme();
    return (
        <React.Fragment>
            <Tooltip title={"Zoom to Map Extent"}>
                <IconButton
                    sx={{padding: "3px"}}
                    style={{width: 30, height: 30,
                        backgroundColor: theme?.palette.secondary.main,
                        color:theme?.palette.secondary.contrastText}}
                    onClick={() => mapVM.zoomToMapExtent(18)}
                >
                    <ZoomInMapIcon/>
                </IconButton>
            </Tooltip>
        </React.Fragment>
    );
};
export default Zoom2Extent;
