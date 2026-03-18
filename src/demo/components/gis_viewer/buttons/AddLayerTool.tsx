import { useEffect, useRef, useState } from 'react';
import {
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

// Importing your forms
import AddWFSForm, { AddWFSFormHandle } from '@demo/components/gis_viewer/form/AddWFSForm';
import AddWMSForm, { AddWMSFormHandle } from '@demo/components/gis_viewer/form/AddWMSForm';
import AddRasterForm from "@demo/components/gis_viewer/form/AddRasterForm";

export default function AddLayerTool() {
    // 1. Define Refs for both WMS and WFS
    const wmsRef = useRef<AddWMSFormHandle>(null);
    const wfsRef = useRef<AddWFSFormHandle>(null);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeForm, setActiveForm] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey) {
                const key = e.key.toLowerCase();
                if (key === "w") { e.preventDefault(); handleOpenForm("WMS"); }
                if (key === "f") { e.preventDefault(); handleOpenForm("WFS"); }
                if (key === "r") { e.preventDefault(); handleOpenForm("Raster"); }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleOpenForm = (formType: string) => {
        setActiveForm(formType);
        handleMenuClose();
    };

    const handleFormClose = () => setActiveForm(null);

    // 2. Logic to handle "Add" button click based on active form
    // const handleAddClick = () => {
    //     if (activeForm === "WMS") {
    //         wmsRef.current?.addSelectedLayers();
    //     } else if (activeForm === "WFS") {
    //         wfsRef.current?.addSelectedLayers();
    //     }
    //     handleFormClose();
    // };
    const handleAddClick = async () => {
        // 1. Enter "Loading" state
        setIsSubmitting(true);

        try {
            if (activeForm === "WMS") {
                // WMS is usually fast (just metadata), but we still await it
                await wmsRef.current?.addSelectedLayers();
            } else if (activeForm === "WFS") {
                // This will wait for every 'await wfsLayer.reload(true)'
                // inside your AddWFSForm loop to finish.
                await wfsRef.current?.addSelectedLayers();
            }

            // 2. Only close the form IF the processing succeeded
            handleFormClose();
        } catch (error) {
            console.error("Error adding layers:", error);
            // Optional: mapVM.showSnackbar("Failed to add layers", "error");
        } finally {
            // 3. Reset the button state
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <IconButton onClick={handleClick} color="primary">
                <ArrowDropDownIcon />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                slotProps={{ root: { style: { zIndex: 9999 } } }}
            >
                <MenuItem onClick={() => handleOpenForm("WFS")}>Add WFS (Ctrl+Shift+F)</MenuItem>
                <MenuItem onClick={() => handleOpenForm("WMS")}>Add WMS (Ctrl+Shift+W)</MenuItem>
                <MenuItem onClick={() => handleOpenForm("Raster")}>Add Raster (Ctrl+Shift+R)</MenuItem>
            </Menu>

            <Dialog
                open={Boolean(activeForm)}
                onClose={handleFormClose}
                fullWidth
                maxWidth="sm"
                sx={{ zIndex: 10000 }}
            >
                <DialogTitle>
                    {activeForm === 'WFS' && 'Add WFS Layer'}
                    {activeForm === 'WMS' && 'Add WMS Layer'}
                    {activeForm === 'Raster' && 'Add Raster Layer'}
                </DialogTitle>

                <DialogContent dividers>
                    {/* 3. Pass Refs to the components */}
                    {activeForm === 'WFS' && <AddWFSForm ref={wfsRef} />}
                    {activeForm === 'WMS' && <AddWMSForm ref={wmsRef} />}
                    {activeForm === 'Raster' && <AddRasterForm />}
                </DialogContent>

                {/*<DialogActions>*/}
                {/*    /!* 4. Unified Add Button for WMS and WFS *!/*/}
                {/*    {(activeForm === "WMS" || activeForm === "WFS") && (*/}
                {/*        <Button variant="contained" onClick={handleAddClick}>*/}
                {/*            Add Selected Layers*/}
                {/*        </Button>*/}
                {/*    )}*/}
                {/*    <Button onClick={handleFormClose}>Close</Button>*/}
                {/*</DialogActions>*/}
                <DialogActions>
                    {(activeForm === "WMS" || activeForm === "WFS") && (
                        <Button
                            variant="contained"
                            onClick={handleAddClick}
                            disabled={isSubmitting} // Disable while loading
                            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
                        >
                            {isSubmitting ? "Adding Layers..." : "Add Selected Layers"}
                        </Button>
                    )}

                    <Button
                        onClick={handleFormClose}
                        disabled={isSubmitting} // Prevent closing mid-process
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}