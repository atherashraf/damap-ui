import { useState, useRef } from "react";
import {
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LayersIcon from "@mui/icons-material/Layers";
import PublicIcon from "@mui/icons-material/Public";

import AddLayerPanel from "../panels/AddLayerPanel";
import { MapAPIs } from "@damap/api/MapApi";
import { useMapVM } from "@damap/hooks/MapVMContext";
import AddWMSForm, { AddWMSFormHandle } from "../panels/AddWMSForm";

const AddLayer = () => {
    const mapVM = useMapVM();
    const drawerRef = mapVM.getRightDrawerRef();
    const snackbarRef = mapVM.getSnackbarRef();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const wmsFormRef = useRef<AddWMSFormHandle>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const openDALayerPanel = async () => {
        handleMenuClose();

        drawerRef?.current?.openDrawer();
        drawerRef?.current?.setContent(
            "Add Layer",
            <Box display="flex" sx={{ mt: 3 }} justifyContent="center" alignItems="center">
                <CircularProgress />
            </Box>
        );

        snackbarRef?.current?.show("Loading layers...");

        try {
            const payload = await mapVM.api.get(MapAPIs.DCH_GET_ALL_LAYERS);

            if (Array.isArray(payload) && payload.length > 0) {
                drawerRef?.current?.setContent(
                    "Add DA Layer",
                    <AddLayerPanel mapVM={mapVM} layers={payload} />
                );
            } else {
                drawerRef?.current?.setContent(
                    "Add DA Layer",
                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Typography>No layers available.</Typography>
                    </Box>
                );
            }
        } catch (error) {
            drawerRef?.current?.setContent(
                "Add DA Layer",
                <Box sx={{ mt: 3, textAlign: "center" }}>
                    <Typography color="error">Failed to load layers.</Typography>
                </Box>
            );
            snackbarRef?.current?.show("Failed to load layers.");
        }
    };

    const openWMSLayerPanel = () => {
        handleMenuClose();

        drawerRef?.current?.openDrawer();
        drawerRef?.current?.setContent(
            "Add WMS Layer",
            <Box sx={{ p: 1 }}>
                <AddWMSForm ref={wmsFormRef} />
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => wmsFormRef.current?.addSelectedLayers()}
                    >
                        Add Selected Layers
                    </Button>
                </Box>
            </Box>
        );
    };

    return (
        <>
            <Tooltip title="Add Layer">
                <IconButton sx={{ p: "3px" }} onClick={handleMenuOpen}>
                    <AddIcon />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
                <MenuItem onClick={openDALayerPanel}>
                    <ListItemIcon>
                        <LayersIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Add DA Layer</ListItemText>
                </MenuItem>

                <MenuItem onClick={openWMSLayerPanel}>
                    <ListItemIcon>
                        <PublicIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Add WMS Layer</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default AddLayer;