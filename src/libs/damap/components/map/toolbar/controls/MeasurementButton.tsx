import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import StraightenIcon from "@mui/icons-material/Straighten";
import { useMapVM } from "@damap/hooks/MapVMContext";
import MeasurementPanel from "@damap/components/map/toolbar/panels/MeasurementPanel";


const MeasurementButton = () => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();
    const drawerRef = mapVM.getRightDrawerRef();

    const handleClick = React.useCallback(() => {
        mapVM.tools.offCustomTool("measure");

        drawerRef?.current?.setContent(
            "Measurement Tool",
            <MeasurementPanel />,
            true,
            360
        );
        drawerRef?.current?.openDrawer?.();
    }, [mapVM, drawerRef]);

    return (
        <Tooltip title="Measurement Tool">
            <IconButton
                sx={{ padding: "3px" }}
                style={{
                    width: 30,
                    height: 30,
                    backgroundColor: theme?.palette.secondary.main,
                    color: theme?.palette.secondary.contrastText,
                }}
                onClick={handleClick}
            >
                <StraightenIcon />
            </IconButton>
        </Tooltip>
    );
};

export default MeasurementButton;