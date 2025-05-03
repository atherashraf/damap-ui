import {IconButton, Tooltip} from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import LayerSwitcherPaper from "@/components/map/layer_switcher/LayerSwitcherPaper.tsx";
import {useMapVM} from "@/components/map/models/MapVMContext.tsx";


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

    const handleClick = () => {
        openLayerSwitcher();
    };
    const openLayerSwitcher = () => {
        const leftDrawer = mapVM.getLeftDrawerRef();
        leftDrawer.current.setContent("Table of Content", <LayerSwitcherPaper mapVM={mapVM}/>);
        leftDrawer.current.openDrawer();
    };

    return (
        <Tooltip title="Create Layer Style">
            <IconButton sx={{width: 30, height: 30}} onClick={handleClick}>
                <LayersIcon/>
            </IconButton>
        </Tooltip>
    );
};

export default LayerSwitcherControl;
