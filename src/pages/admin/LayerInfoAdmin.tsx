/**
 * LayerInfoAdmin
 * ------------------
 *
 * Admin page to manage Layer Info.
 *
 * Features:
 * - ✅ Display LayerInfo records in a smart table (ChangeList component)
 * - ✅ Select URL type (WMS, WFS, TMS, Web API)
 * - ✅ Input Layer Title
 * - ✅ Select an existing Layer Category (or add a new Layer Category)
 * - ✅ Input Layer URL
 * - ✅ Submit and Save new URL Layer Info via MapApi (calls DCH_ADD_URL_LAYER_INFO)
 *
 *
 * Usage:
 *
 * ```tsx
 * import AddURLLayerInfo from "@/components/admin/forms/AddURLLayerInfo";
 *
 * const snackbarRef = React.useRef<DASnackbarHandle>(null);
 * const dialogRef = React.useRef<DAFullScreenDialogHandle>(null);
 *
 * <AddURLLayerInfo snackbarRef={snackbarRef} dialogRef={dialogRef} />
 * ```
 *
 * Props:
 * - `snackbarRef`: Ref to DASnackbar component (for showing success/error messages)
 * - `dialogRef`: Ref to DAFullScreenDialog (used when opening AddLayerCategoryForm)
 *
 * Notes:
 * - When "Add Layer Info" button is clicked, it triggers `MapApi.get(DCH_ADD_URL_LAYER_INFO, {...})`.
 * - If user wants to add a new Layer Category, it opens a full screen AddLayerCategoryForm inside the same dialog.
 */

import * as React from "react";
import {useNavigate} from "react-router-dom";
import {Column, Row} from "@/types/gridTypeDeclaration";
import ChangeList, {ChangeListHandle} from "@/components/admin/ChangeList";
import {Action} from "@/components/admin/ChangeListToolbar";
import DASnackbar, {DASnackbarHandle} from "@/components/base/DASnackbar";
import DAFullScreenDialog, {DAFullScreenDialogHandle} from "@/components/base/DAFullScreenDialog";
import MapApi, {MapAPIs} from "@/api/MapApi";
import AddRasterLayerInfo from "@/components/admin/forms/AddRasterLayerInfo";
import AddVectorLayerInfo from "@/components/admin/forms/AddVectorLayerInfo";
import AddURLLayerInfo from "@/components/admin/forms/AddURLLayerInfo";
import {Box, Paper, Typography} from "@mui/material";

// Typed references
const LayerInfoAdmin = () => {
    const changeListRef = React.useRef<ChangeListHandle>(null);
    const snackbarRef = React.useRef<DASnackbarHandle>(null);
    const dialogRef = React.useRef<DAFullScreenDialogHandle>(null);

    // State
    const [columns, setColumns] = React.useState<Column[]>([]);
    const [data, setData] = React.useState<Row[]>([]);
    const [actions, setActions] = React.useState<Action[]>([]);

    const navigate = useNavigate();
    const api = React.useMemo(() => new MapApi(snackbarRef), []);

    // Fetch table data
    const getTableData = React.useCallback(() => {
        api.get(MapAPIs.DCH_ALL_LAYER_INFO).then((payload) => {
            if (payload) {
                setData(payload.rows);
                setColumns(payload.columns);
            }
        });
    }, [api]);

    // Get selected row
    const getSelectedRowData = React.useCallback(() => {
        return changeListRef.current?.getSelectedRowData();
    }, []);

    // Get selected UUID
    const getSelectedUUID = React.useCallback(() => {
        const rowData = getSelectedRowData();
        return rowData?.uuid;
    }, [getSelectedRowData]);

    // Initialize Actions
    const initActions = React.useCallback(() => {
        const actionsList: Action[] = [
            {
                name: "View Layer Designer",
                action: () => {
                    const uuid = getSelectedUUID();
                    if (uuid) navigate("/designer/" + uuid);
                },
            },
            {
                name: "Add Raster Layer",
                action: () => {
                    dialogRef.current?.handleClickOpen();
                    dialogRef.current?.setContent(
                        "Add Raster Layer",
                        <AddRasterLayerInfo
                            dialogRef={dialogRef}
                            snackbarRef={snackbarRef} // Pass the ref itself
                            onSuccess={() => {
                                dialogRef.current?.handleClose();
                                getTableData(); // ⬅️ Refresh the ChangeList
                            }}
                        />
                    );
                },
            },
            {
                name: "Add Vector Layer",
                action: () => {
                    dialogRef.current?.handleClickOpen();
                    dialogRef.current?.setContent(
                        "Add Vector Layer",
                        <AddVectorLayerInfo
                            snackbarRef={snackbarRef}
                            onLayerAdded={() => {
                                dialogRef.current?.handleClose();
                                getTableData(); // ⬅️ Refresh the ChangeList
                            }}
                        />
                    );
                },
            },
            {
                name: "Add Layer URL",
                action: () => {
                    dialogRef.current?.handleClickOpen();
                    dialogRef.current?.setContent(
                        "Add Layer URL",
                        <AddURLLayerInfo
                            snackbarRef={snackbarRef}
                            onSuccess={() => {
                                dialogRef.current?.handleClose();
                                getTableData(); // ⬅️ Refresh the ChangeList
                            }}
                        />
                    );
                },
            },
            {
                name: "Update Layer Info",
                action: () => {
                    const rowData = getSelectedRowData();
                    const id = rowData?.id;
                    if (id) {
                        const url = MapApi.getURL(MapAPIs.DCH_ADMIN_LAYER_INFO_EDIT, {id});
                        window?.open(url, "MapAdmin")?.focus();
                    }
                },
            },
            {
                name: "Delete Layer Info",
                action: async () => {
                    const uuid = getSelectedUUID();
                    if (uuid) {
                        const payload = await api.get(MapAPIs.DCH_DELETE_LAYER_INFO, {uuid});
                        if (payload) {
                            window.location.reload();
                            snackbarRef.current?.show("Layer info deleted successfully", "success");
                        }
                    } else {
                        snackbarRef.current?.show("Please select a row to delete", "warning");
                    }
                },
            },
            {
                name: "Download SLD",
                action: () => {
                    const uuid = getSelectedUUID();
                    if (uuid) {
                        const url = MapApi.getURL(MapAPIs.DCH_DOWNLOAD_SLD, {uuid});
                        window.open(url);
                    }
                },
            },
        ];
        setActions(actionsList);
    }, [getSelectedUUID, navigate, api, getSelectedRowData]);

    // On Mount
    React.useEffect(() => {
        initActions();
        getTableData();
    }, [initActions, getTableData]);

    return (
        <React.Fragment>
            {/* Table */}


            {columns.length > 0 ? (
                <ChangeList
                    ref={changeListRef}
                    columns={columns}
                    data={data}
                    pkColName="uuid"
                    tableHeight="100%"
                    tableWidth="100%"
                    api={api}
                    actions={actions}
                    buttons={[]}
                    saveURL={MapAPIs.DCH_SAVE_LAYER_INFO}
                />
            ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Paper elevation={3} sx={{padding: 3}}>
                        <Typography variant="h6" align="center" color="text.secondary">
                            No Data Available
                        </Typography>
                    </Paper>
                </Box>
            )}

            {/* Snackbar Notifications */}
            <DASnackbar ref={snackbarRef}/>

            {/* Fullscreen Dialog for Add/Edit */}
            <DAFullScreenDialog ref={dialogRef}/>
        </React.Fragment>
    );
};

export default LayerInfoAdmin;
