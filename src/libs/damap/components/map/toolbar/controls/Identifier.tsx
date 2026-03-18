// @damap/components/map/toolbar/controls/identifier.tsx
import { IconButton, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useMapVM } from "@damap/hooks/MapVMContext";
import IdentifyResult from "@damap/components/map/widgets/IdentifyResult";
import { useState, useCallback } from "react";

const Identifier = () => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();
    const drawerRef = mapVM.getRightDrawerRef();
    const identifyResultRef = mapVM.getIdentifierResultRef();

    const [mountId, setMountId] = useState(0);

    const handleClick = useCallback(() => {
        // ensure old tool is fully stopped (safe even if not active)
        mapVM.tools.offCustomTool("identify");

        // force IdentifyResult remount so it re-arms tool
        setMountId((x) => x + 1);

        mapVM.showSnackbar("Click on feature to view its details.");
        drawerRef?.current?.setContent(
            "Identify Feature",
            <IdentifyResult key={mountId + 1} ref={identifyResultRef} />,
            true
        );
        drawerRef?.current?.openDrawer?.();
    }, [mapVM, drawerRef, identifyResultRef, mountId]);

    return (
        <Tooltip title="Identify Feature">
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
                <InfoIcon />
            </IconButton>
        </Tooltip>
    );
};

export default Identifier;
