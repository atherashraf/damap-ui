import * as React from "react";
import MapView from "@damap/components/map/MapView";
import { useParams } from "react-router-dom";
import { useRef, useEffect, RefObject } from "react";
import { AppBar, IconButton, Toolbar, Tooltip, Typography, useTheme } from "@mui/material";
import { getMapVM } from "@damap/hooks/MapVMContext";
import SymbologyControl from "@damap/components/map/toolbar/controls/SymbologyControl";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";

import DASnackbar, { DASnackbarHandle } from "@damap/components/base/DASnackbar";
import { RightDrawerHandle } from "@damap/components/map/drawers/RightDrawer";
import AppendShpWizard from "@damap/components/admin/forms/shpfile/AppendShpWizard";
import { AddLayer } from "@/libs/damap";
import DeleteControl from "@damap/components/map/toolbar/controls/DeleteControl";

const LayerDesigner = () => {
    const { layerId } = useParams<{ layerId: string }>();
    const theme = useTheme();
    const addExampleButton = false;

    const buttonAdded = useRef(false);
    const snackbarRef = useRef<DASnackbarHandle | null>(null);

    //adding buttons in map toolbar
    useEffect(() => {
        const mapVM = getMapVM();
        if (!mapVM?.getMapToolbar || !layerId) return;

        const handleOpenAppendWizard = () => {
            const rightDrawer: RefObject<RightDrawerHandle> = mapVM.getRightDrawerRef?.();

            if (!rightDrawer) {
                snackbarRef.current?.show("Right drawer is not available", "warning");
                return;
            }

            rightDrawer.current?.setContent(
                "Append Data",
                <AppendShpWizard
                    layerUUID={layerId}
                    snackbarRef={snackbarRef}
                    rightDrawerRef={rightDrawer}
                    onSuccess={() => {
                        snackbarRef.current?.show("Append process completed", "success");
                    }}
                />,
                true,
                420
            );
        };

        if (!buttonAdded.current) {
            mapVM.getMapToolbar().addButton(<AddLayer key="add-layer" />);
            mapVM.getMapToolbar().addButton(<SymbologyControl key="symbology-control" />);
            mapVM.getMapToolbar().addButton(
                <Tooltip title="Append Data" key="append-data-btn">
                    <IconButton onClick={handleOpenAppendWizard}>
                        <LibraryAddIcon />
                    </IconButton>
                </Tooltip>
            );
            mapVM.getMapToolbar().addButton(<DeleteControl key={"delete-layer"} />);

            mapVM.setIsDesigner(true);
            buttonAdded.current = true;
        }
    }, [layerId]);

    //add button in Attribute table toolbar
    //Note: Following is an Example button for future reference set addExampleButton to true to see it
    useEffect(() => {
        if (!addExampleButton) return;
        const handleClick = () => {
            alert("working...");
        };
        const handleAttributeTableOpened = () => {
            const mapVM = getMapVM();
            if (!mapVM || !layerId) return;

            const tableManager = mapVM.getAttributeTableManager();

            tableManager.addAttributeToolbarButton({
                id: "append-btn",
                slot: "start",
                order: 0,
                node: (
                    <Tooltip title="Append Data">
                        <IconButton size="small" onClick={handleClick}>
                            <LibraryAddIcon  sx={{ color: "white" }} />
                        </IconButton>
                    </Tooltip>
                ),
            });
        };


        window.addEventListener(
            "attribute-table-opened",
            handleAttributeTableOpened as EventListener
        );

        return () => {
            window.removeEventListener(
                "attribute-table-opened",
                handleAttributeTableOpened as EventListener
            );

            const mapVM = getMapVM();
            mapVM?.getAttributeTableManager()
                ?.getAttributeTableToolbarHandle()
                ?.removeAction("append-btn");
        };
    }, [layerId]);


    const [layerTitle, setLayerTitle] = React.useState<string>("");

    useEffect(() => {
        if (!layerId) return;

        let cancelled = false;
        let attempts = 0;
        const maxAttempts = 100; // ~10 seconds if interval is 100ms

        const tryGetLayerTitle = () => {
            const mapVM = getMapVM();
            if (!mapVM) return;

            const layer = mapVM.getDALayer(layerId);
            if (layer) {
                if (!cancelled) {
                    setLayerTitle(layer.getLayerTitle() || "");
                }
                return;
            }

            attempts += 1;
            if (attempts < maxAttempts && !cancelled) {
                setTimeout(tryGetLayerTitle, 100);
            }
        };

        setLayerTitle("");
        tryGetLayerTitle();

        return () => {
            cancelled = true;
        };
    }, [layerId]);

    return (
        <>
            <MapView uuid={layerId || ""} isMap={false} theme={theme}>
                <AppBar position="static" color="secondary" elevation={2}>
                    <Toolbar variant="dense">
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Layer Designer Toolbar {layerTitle ? `for ${layerTitle}` : ""}
                        </Typography>
                    </Toolbar>
                </AppBar>
            </MapView>

            <DASnackbar ref={snackbarRef} />
        </>
    );
};

export default LayerDesigner;