/**
 * AddLayer — A toolbar button component for opening the "Add Layer" panel.
 *
 * This button integrates with the MapToolbar via `useMapVM()` and opens
 * the right drawer to fetch and display available layers from the server.
 *
 * Requirements:
 * - Must be rendered inside <MapToolbarVMContext.Provider>
 *   (automatically provided in MapToolbarContainer)
 *
 * @example
 * // Usage inside MapToolbarContainer
 * import AddLayer from "@/components/map/controls/AddLayer";
 * import MapToolbarContainer from "@/components/map/toolbar/MapToolbarContainer";
 * import MapVM from "@/components/map/models/MapVM";
 *
 * <MapToolbarContainer mapVM={myMapVM} />
 *
 * // AddLayer will use the mapVM from context and open the drawer
 */

import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddLayerPanel from "../../AddLayerPanel";
import { MapAPIs } from "@/api/MapApi";
import { useMapVM } from "@/components/map/toolbar/MapToolbarVMContext";

const AddLayer = () => {
    const mapVM = useMapVM(); // Access the MapVM from context
    const drawerRef = mapVM.getRightDrawerRef();

    const handleClick = () => {
        // Open the drawer and show loading spinner
        drawerRef?.current?.openDrawer();
        drawerRef?.current?.setContent(
            "Add Layer",
            <Box display="flex" sx={{ mt: 3 }} justifyContent="center" alignItems="center">
                <CircularProgress />
            </Box>
        );

        // Notify user and load layers
        mapVM.getSnackbarRef()?.current?.show("Getting Layer List...");

        mapVM.api.get(MapAPIs.DCH_GET_ALL_LAYERS).then((payload) => {
            if (payload) {
                drawerRef?.current?.setContent("Add Layer", <AddLayerPanel mapVM={mapVM} layers={payload} />);
            } else {
                drawerRef?.current?.setContent("Add Layer", <Box>No Layer Found</Box>);
            }
        });
    };

    return (
        <Tooltip title="Add Layer">
            <IconButton sx={{ padding: "3px" }} onClick={handleClick}>
                <AddIcon />
            </IconButton>
        </Tooltip>
    );
};

export default AddLayer;
