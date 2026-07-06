import React, { useState } from "react";
import {
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    ListItemIcon,
    ListItemText,
    Divider,
} from "@mui/material";
import { AdsClick, SquareFoot, Pentagon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import Draw, { createBox } from "ol/interaction/Draw";
import { useMapVM } from "@damap/hooks/MapVMContext";



const DeleteControl: React.FC = () => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeMode, setActiveMode] = useState<"click" | "rectangle" | "polygon" | null>(null);

    const open = Boolean(anchorEl);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const cleanupTool = (mode: "click" | "rectangle" | "polygon") => {
        mapVM.getSelectionLayer().clearSelection();

        if (mode === "click") {
            mapVM.tools.offCustomTool("select_click");
        } else {
            mapVM.tools.offCustomTool(`select_${mode}`);
        }

        setActiveMode(null);
    };

    const handlePostSelection = async (
        mode: "click" | "rectangle" | "polygon"
    ) => {
        const confirmed = await window.customConfirm(
            mode === "click"
                ? "Do you want to delete the selected feature?"
                : "Do you want to delete the selected features?",
            "Delete"
        );

        if (confirmed) {
            // 1. Get the list of PK column names from the backend (e.g., ["id"] or ["city_code", "district_id"])
            const pkColsResponse= await mapVM.dmlManager.getLayerPkCols();
            console.log(pkColsResponse);
            if (pkColsResponse) {
                const pkCols = pkColsResponse.pkCols
                const selectLayer = mapVM.getSelectionLayer();
                const features = selectLayer.getFeatures();
                if(!features) return
                // 2. Map through features to extract the actual data values
                const featureIds = features.map((feature) => {
                    // Create an object containing only the PK keys and their values
                    const pkData: Record<string, any> = {};
                    pkCols.forEach(col => {
                        pkData[col] = feature.get(col);
                    });
                    return pkData;
                });
                console.log(featureIds)


                // If you need a simple list of values (assuming single PK)
                // const simpleIds = features.map(f => f.get(pkCols[0]));

                // console.log("Identifying features for deletion:", featureIds);
                await mapVM.dmlManager.deleteFeatures(pkColsResponse.meta.uuid, featureIds)
                // 3. Proceed with deletion using the identified IDs
                // await mapVM.deleteSelectedFeatures(featureIds);

                // await window.customAlert(`${features.length} feature(s) deleted successfully.`);
            } else {
                console.error("Could not retrieve PK columns for this layer.");
            }
        }

        cleanupTool(mode);
    };

    const activateTool = (mode: "click" | "rectangle" | "polygon") => {
        handleClose();
        setActiveMode(mode);

        mapVM.activateCustomExclusive(
            `select_${mode}`,
            () => {
                const map = mapVM.getMap();

                if (mode === "click") {
                    const clickHandler = async (e: any) => {
                        try {
                            await mapVM.performClickSelection(e.pixel);
                            await handlePostSelection(mode);
                        } catch (error) {
                            console.error("Delete by click failed:", error);
                            cleanupTool(mode);
                        }
                    };

                    return mapVM.onCustomTool("click", "select_click", clickHandler);
                }

                const interaction = new Draw({
                    type: mode === "rectangle" ? "Circle" : "Polygon",
                    geometryFunction: mode === "rectangle" ? createBox() : undefined,
                });

                interaction.on("drawend", async (evt) => {
                    try {
                        const geom = evt.feature.getGeometry();
                        if (!geom) {
                            map.removeInteraction(interaction);
                            cleanupTool(mode);
                            return;
                        }

                        await mapVM.performSpatialSelection(geom);
                        map.removeInteraction(interaction);

                        await handlePostSelection(mode);
                    } catch (error) {
                        console.error(`Delete by ${mode} failed:`, error);
                        map.removeInteraction(interaction);
                        cleanupTool(mode);
                    }
                });

                map.addInteraction(interaction);

                return () => {
                    map.removeInteraction(interaction);
                };
            },
            "crosshair"
        );
    };

    const clearSelectionAndExit = () => {
        mapVM.getSelectionLayer().clearSelection();
        mapVM.tools.offAllCustom();
        setActiveMode(null);
        handleClose();
    };

    return (
        <>
            <Tooltip title="Delete Features">
                <IconButton
                    onClick={handleOpen}
                    sx={{
                        padding: "3px",
                        width: 40,
                        height: 30,
                        borderRadius: "4px",
                        backgroundColor: activeMode
                            ? theme?.palette.primary.light
                            : theme?.palette.secondary.main,
                        color: theme?.palette.secondary.contrastText,
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={() => activateTool("click")}>
                    <ListItemIcon>
                        <AdsClick fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete by Click</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => activateTool("rectangle")}>
                    <ListItemIcon>
                        <SquareFoot fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete by Rectangle</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => activateTool("polygon")}>
                    <ListItemIcon>
                        <Pentagon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete by Polygon</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={clearSelectionAndExit}>
                    <ListItemText sx={{ color: "error.main" }}>
                        Clear Selection
                    </ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default DeleteControl;