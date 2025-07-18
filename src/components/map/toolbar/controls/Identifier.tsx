import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import IdentifyResult, { IdentifyResultHandle } from "@/components/map/widgets/IdentifyResult";
import { useMapVM } from "@/hooks/MapVMContext";

const Identifier = () => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();
    const drawerRef = mapVM.getRightDrawerRef();

    // ✅ Scoped ref — only created once per component instance
    const identifyResultRef = React.useRef<IdentifyResultHandle | null>(null);

    // ✅ On mount, assign the ref to MapVM
    React.useEffect(() => {
        mapVM.setIdentifierResultRef(identifyResultRef);
    }, [mapVM]);

    const handleClick = () => {
        drawerRef?.current?.setContent(
            "Identifier",
            <IdentifyResult ref={identifyResultRef} />
        );
        drawerRef?.current?.openDrawer();
    };

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
