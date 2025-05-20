import {IconButton, Tooltip} from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import LayerSwitcherPaper from "@/components/map/layer_switcher/LayerSwitcherPaper";
import {useMapVM} from "@/components/map/models/MapVMContext";
import {JSX} from "react";


/**
 * LayerSwitcherControl is a map control component that opens the layer switcher panel
 * when the user clicks the button. It uses the `useMapVM` hook to access the map view model.
 *
 * @component
 * @example
 * <LayerSwitcherControl />
 *
 * @returns {JSX.Element} A styled icon button that triggers the layer switcher.
 */
const LayerSwitcherControl = (): JSX.Element => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();

    const handleClick = () => {
        openLayerSwitcher();
    };
    const openLayerSwitcher = () => {
        const leftDrawer = mapVM.getLeftDrawerRef();
        leftDrawer.current.setContent("Table of Content", <LayerSwitcherPaper mapVM={mapVM}/>);
        leftDrawer.current.openDrawer();
    };

    return (
        <Tooltip title="Open Layer Switcher">
            <IconButton style={{width: 30, height: 30,
                backgroundColor: theme?.palette.secondary.main,
                color:theme?.palette.secondary.contrastText}} onClick={handleClick}>
                <LayersIcon/>
            </IconButton>
        </Tooltip>
    );
};

export default LayerSwitcherControl;
