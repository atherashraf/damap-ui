import {IconButton, Tooltip} from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
// import LayerSwitcherMUIPaper from "@damap/components/map/layer_switcher_mui/LayerSwitcherMUIPaper";
import {useMapVM} from "@damap/hooks/MapVMContext";
import {JSX} from "react";
import {LayerSwitcherMUIPaper} from "@/libs/damap";
import LayerSwitcherPaper from "@damap/components/map/layer_switcher/LayerSwitcherPaper";


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
        const layerSwitcherType = mapVM.getLayerSwitcherType();
        if (layerSwitcherType === "OLExt") {
            leftDrawer.current.setContent("Table of Content", <LayerSwitcherPaper mapVM={mapVM}/>);
        }else {
            leftDrawer.current.setContent("Table of Content", <LayerSwitcherMUIPaper mapVM={mapVM}/>);
        }
        leftDrawer.current.openDrawer(350);
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
