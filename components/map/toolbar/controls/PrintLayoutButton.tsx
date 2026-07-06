import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { useMapVM } from "@damap/hooks/MapVMContext";
import PrintLayoutPanel from "@damap/components/map/map_layout/PrintLayoutPanel";

const PrintLayoutButton = (): React.ReactElement => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();
    const drawerRef = mapVM.getRightDrawerRef();

    const handleClick = React.useCallback(() => {
        const drawer = drawerRef?.current;
        if (!drawer) return;

        drawer.setContent(
            "Print Layout",
            <PrintLayoutPanel />,
            true,
            360
        );

        drawer.openDrawer?.();
    }, [drawerRef]);

    return (
        <Tooltip title="Print Layout">
            <IconButton
                sx={{
                    p: "3px",
                    width: 30,
                    height: 30,
                    backgroundColor: theme?.palette.secondary.main,
                    color: theme?.palette.secondary.contrastText,
                    "&:hover": {
                        backgroundColor: theme?.palette.secondary.dark,
                    },
                }}
                onClick={handleClick}
            >
                <PrintIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
};

export default PrintLayoutButton;