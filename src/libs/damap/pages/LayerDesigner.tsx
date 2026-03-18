import * as React from "react";
import MapView from "@damap/components/map/MapView";
import { useParams } from "react-router-dom";
import {useRef, useEffect, RefObject} from "react";
import { AppBar, IconButton, Toolbar, Tooltip, Typography, useTheme } from "@mui/material";
import { getMapVM } from "@damap/hooks/MapVMContext";
import SymbologyControl from "@damap/components/map/toolbar/controls/SymbologyControl";
import AddIcon from "@mui/icons-material/Add";

import DASnackbar, { DASnackbarHandle } from "@damap/components/base/DASnackbar";
import  {RightDrawerHandle} from "@damap/components/map/drawers/RightDrawer";
import AppendShpWizard from "@damap/components/admin/forms/shpfile/AppendShpWizard";

const LayerDesigner = () => {
    const { layerId } = useParams();
    const theme = useTheme();

    const buttonAdded = useRef(false);
    const snackbarRef = useRef<DASnackbarHandle | null>(null);

    useEffect(() => {
        const mapVM = getMapVM();
        if (!mapVM?.getMapToolbar) return;

        const handleOpenAppendWizard = () => {
            const rightDrawer:RefObject<RightDrawerHandle> = mapVM.getRightDrawerRef?.();

            if (!rightDrawer) {
                snackbarRef.current?.show("Right drawer is not available", "warning");
                return;
            }

            rightDrawer?.current?.setContent(
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
            mapVM.getMapToolbar().addButton(
                <SymbologyControl key="symbology-control" />
            );

            mapVM.getMapToolbar().addButton(
                <Tooltip title="Append Data" key="append-data-btn">
                    <IconButton onClick={handleOpenAppendWizard}>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            );

            mapVM.setIsDesigner(true);
            buttonAdded.current = true;
        }
    }, []);

    return (
        <React.Fragment>
            <MapView uuid={layerId || ""} isMap={false} theme={theme}>
                <AppBar position="static" color="secondary" elevation={2}>
                    <Toolbar variant="dense">
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Layer Designer Toolbar
                        </Typography>
                    </Toolbar>
                </AppBar>
            </MapView>

            <DASnackbar ref={snackbarRef} />
        </React.Fragment>
    );
};

export default LayerDesigner;
