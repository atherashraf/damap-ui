import DesignServicesIcon from "@mui/icons-material/DesignServices";
import { IconButton, Tooltip } from "@mui/material";
import { useMapVM } from "@damap/hooks/MapVMContext";

const SymbologyControl = () => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();

    const handleClick = () => {
        const layerId = mapVM.getLayerOfInterest();

        if (!layerId) {
            window.customAlert?.(
                <div>Please select a layer first.</div>
            );
            return;
        }

        mapVM.getLayerManager().openLayerDesigner(layerId);
    };

    return (
        <Tooltip title="Layer Style">
            <IconButton
                sx={{
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
                <DesignServicesIcon />
            </IconButton>
        </Tooltip>
    );
};

export default SymbologyControl;