import React, { useState } from "react";
import { IconButton, Menu, MenuItem, Tooltip, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { AdsClick, SquareFoot, Pentagon, ArrowDropDown } from "@mui/icons-material";
import { useMapVM } from "@damap/hooks/MapVMContext";
import Draw from 'ol/interaction/Draw';
import { createBox } from 'ol/interaction/Draw';

const SelectControl = () => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeMode, setActiveMode] = useState<string | null>(null);

    const open = Boolean(anchorEl);
    const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const activateTool = (mode: 'click' | 'rectangle' | 'polygon') => {
        handleClose();
        setActiveMode(mode);

        mapVM.activateCustomExclusive(`select_${mode}`, () => {
            const map = mapVM.getMap();

            if (mode === 'click') {
                const clickHandler = (e: any) => {
                    // DELEGATE: Point selection to Manager
                    mapVM.performClickSelection(e.pixel);
                };
                return mapVM.onCustomTool("click", "select_click", clickHandler);
            }
            else {
                const interaction = new Draw({
                    type: mode === 'rectangle' ? 'Circle' : 'Polygon',
                    geometryFunction: mode === 'rectangle' ? createBox() : undefined,
                });

                interaction.on('drawend', (evt) => {
                    const geom = evt.feature.getGeometry();
                    if (geom) {
                        // DELEGATE: Spatial selection to Manager
                        mapVM.performSpatialSelection(geom);
                    }

                    setTimeout(() => {
                        map.removeInteraction(interaction);
                        mapVM.tools.offCustomTool(`select_${mode}`);
                        setActiveMode(null);
                    }, 100);
                });

                map.addInteraction(interaction);
                return () => map.removeInteraction(interaction);
            }
        }, "crosshair");
    };

    return (
        <>
            <Tooltip title="Select Features">
                <IconButton
                    onClick={handleOpen}
                    sx={{
                        padding: "3px", width: 40, height: 30, borderRadius: "4px",
                        backgroundColor: activeMode ? theme?.palette.primary.light : theme?.palette.secondary.main,
                        color: theme?.palette.secondary.contrastText,
                    }}
                >
                    <AdsClick fontSize="small" />
                    <ArrowDropDown fontSize="small" />
                </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={() => activateTool('click')}>
                    <ListItemIcon><AdsClick fontSize="small" /></ListItemIcon>
                    <ListItemText>Select by Click</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => activateTool('rectangle')}>
                    <ListItemIcon><SquareFoot fontSize="small" /></ListItemIcon>
                    <ListItemText>Select by Rectangle</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => activateTool('polygon')}>
                    <ListItemIcon><Pentagon fontSize="small" /></ListItemIcon>
                    <ListItemText>Select by Polygon</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => {
                    mapVM.getSelectionLayer().clearSelection();
                    mapVM.tools.offAllCustom();
                    setActiveMode(null);
                    handleClose();
                }}>
                    <ListItemText sx={{ color: 'error.main' }}>Clear Selection</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default SelectControl;