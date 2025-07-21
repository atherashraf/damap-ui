import {IconButton, Tooltip} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import {useMapVM} from "@/hooks/MapVMContext";
import {useCallback} from "react";

const Identifier = () => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();
    const drawerRef = mapVM.getRightDrawerRef();


    const identifyResultRef = mapVM.getIdentifierResultRef();


    const showIdentifyResult = useCallback(() => {
        console.log("showIdentifyResult", identifyResultRef?.current);

        identifyResultRef?.current?.render()
        drawerRef?.current?.openDrawer();
    }, [identifyResultRef?.current, drawerRef?.current]);

    const handleClick = () => {
        drawerRef?.current?.setContent("Identify Feature", null)
        showIdentifyResult();
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
