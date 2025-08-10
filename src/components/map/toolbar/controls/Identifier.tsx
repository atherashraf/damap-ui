// @/components/map/toolbar/controls/identifier.tsx
import {IconButton, Tooltip} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import {useMapVM} from "@/hooks/MapVMContext";
import IdentifyResult from "@/components/map/widgets/IdentifyResult";

// import {useCallback} from "react";

const Identifier = () => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();
    const drawerRef = mapVM.getRightDrawerRef();
    const identifyResultRef = mapVM.getIdentifierResultRef()


    const handleClick = () => {
        mapVM.showSnackbar("Click on feature to view its details.");
        drawerRef?.current?.setContent("Identify Feature",  <IdentifyResult ref={identifyResultRef}/>)
        // showIdentifyResult();
    };


    return (
        <Tooltip title="Identify Feature">
            <IconButton
                sx={{padding: "3px"}}
                style={{
                    width: 30,
                    height: 30,
                    backgroundColor: theme?.palette.secondary.main,
                    color: theme?.palette.secondary.contrastText,
                }}
                onClick={handleClick}
            >
                <InfoIcon/>
            </IconButton>
        </Tooltip>
    );
};

export default Identifier;
