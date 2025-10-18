/**
 * LayerInfoAdmin
 * ------------------
 * Admin panel for managing map layer information in DCH (Data Clearing House).
 *
 * ✅ Features
 * -----------
 * - Displays all existing Layer Info records in a smart data table (`ChangeList` component)
 * - Toolbar with searchable table and dynamic actions
 * - Add new layers via:
 *      • Raster layer upload
 *      • Vector layer upload
 *      • URL-based layer (WMS, WFS, TMS, REST API)
 * - Edit and update existing layers
 * - Delete a layer entry
 * - Open selected layer in Layer Designer
 * - Download SLD style file for a layer
 *
 * ✅ Integrated Components
 * ------------------------
 * - `ChangeList` → Smart table with row editing and selection support
 * - `ChangeListToolbar` → Actions like Add, Edit, Delete, Download SLD, etc.
 * - `DAFullScreenDialog` → Used for Add/Edit popups
 * - `DASnackbar` → Success/error feedback
 * - `MapApi` → Handles backend API integration
 *
 * ✅ Action Menu
 * --------------
 * The table includes toolbar actions:
 * - View Layer Designer
 * - Add Raster Layer
 * - Add Vector Layer
 * - Add Layer URL
 * - Update Layer Info
 * - Delete Layer Info
 * - Download SLD
 *
 * ✅ Usage
 * --------
 * ```tsx
 * import LayerInfoAdmin from "@/components/admin/LayerInfoAdmin";
 *
 * export default function AdminPage() {
 *   return <LayerInfoAdmin />;
 * }
 * ```
 *
 * ✅ Notes
 * --------
 * - A row selection is required for actions like View, Update, Delete, Download SLD.
 * - Add actions can be used even when there are no existing layers.
 * - Dialogs are context-aware and refresh the table on success.
 */

/**
 * LayerInfoAdmin
 * ------------------
 * Admin page to manage Layer Info.
 */

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Column, Row } from "@/types/gridTypeDeclaration";
import ChangeList, { ChangeListHandle } from "@/components/admin/ChangeList";
import { Action } from "@/components/admin/ChangeListToolbar";
import DASnackbar, { DASnackbarHandle } from "@/components/base/DASnackbar";
import DAFullScreenDialog, { DAFullScreenDialogHandle } from "@/components/base/DAFullScreenDialog";
import MapApi, { MapAPIs } from "@/api/MapApi";
import AddRasterLayerInfo from "@/components/admin/forms/AddRasterLayerInfo";
import AddVectorLayerInfo from "@/components/admin/forms/AddVectorLayerInfo";
import AddURLLayerInfo from "@/components/admin/forms/AddURLLayerInfo";
import {useEffect} from "react";

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
            // console.log("Layer Info", payload);
            if (payload) {
                setData(payload.rows);
                setColumns(payload.columns);

            } else {
                setData([]);
                setColumns([]);
            }
        });
    }, [api]);

    useEffect(() => {
        console.log("Layer Info data", data);
    }, [data]);

    // Get selected row
    const getSelectedRowData = React.useCallback(() => {
        return changeListRef.current?.getSelectedRowData();
    }, []);

    // Get selected UUID
    const getSelectedUUID = React.useCallback(() => {
        const rowData = getSelectedRowData();
        return (rowData as any)?.uuid;
    }, [getSelectedRowData]);

    // Initialize Actions
    const initActions = React.useCallback(() => {
        const actionsList: Action[] = [
            {
                name: "View Layer Designer",
                requiresSelection: true,
                action: () => {
                    const uuid = getSelectedUUID();
                    if (uuid) navigate("/designer/" + uuid);
                },
            },
            {
                name: "Add Raster Layer",
                visibleWhenEmpty: true,
                requiresSelection: false,
                action: () => {
                    dialogRef.current?.handleClickOpen();
                    dialogRef.current?.setContent(
                        "Add Raster Layer",
                        <AddRasterLayerInfo
                            dialogRef={dialogRef}
                            snackbarRef={snackbarRef}
                            onSuccess={() => {
                                dialogRef.current?.handleClose();
                                getTableData();
                            }}
                        />
                    );
                },
            },
            {
                name: "Add Vector Layer",
                visibleWhenEmpty: true,
                requiresSelection: false,
                action: () => {
                    dialogRef.current?.handleClickOpen();
                    dialogRef.current?.setContent(
                        "Add Vector Layer",
                        <AddVectorLayerInfo
                            snackbarRef={snackbarRef}
                            onLayerAdded={() => {
                                dialogRef.current?.handleClose();
                                getTableData();
                            }}
                        />
                    );
                },
            },
            {
                name: "Add Layer URL",
                visibleWhenEmpty: true,
                requiresSelection: false,
                action: () => {
                    dialogRef.current?.handleClickOpen();
                    dialogRef.current?.setContent(
                        "Add Layer URL",
                        <AddURLLayerInfo
                            snackbarRef={snackbarRef}
                            onSuccess={() => {
                                dialogRef.current?.handleClose();
                                getTableData();
                            }}
                        />
                    );
                },
            },
            {
                name: "Update Layer Info",
                requiresSelection: true,
                action: () => {
                    const rowData = getSelectedRowData() as any;
                    const id = rowData?.id;
                    if (id) {
                        const url = MapApi.getURL(MapAPIs.DCH_ADMIN_LAYER_INFO_EDIT, { id });
                        window?.open(url, "MapAdmin")?.focus();
                    }
                },
            },
            {
                name: "Delete Layer Info",
                requiresSelection: true,
                action: async () => {
                    const uuid = getSelectedUUID();
                    if (uuid) {
                        const payload = await api.get(MapAPIs.DCH_DELETE_LAYER_INFO, { uuid });
                        if (payload) {
                            snackbarRef.current?.show("Layer info deleted successfully", "success");
                            getTableData(); // refresh, avoids a full reload
                        }
                    } else {
                        snackbarRef.current?.show("Please select a row to delete", "warning");
                    }
                },
            },
            {
                name: "Download SLD",
                requiresSelection: true,
                action: () => {
                    const uuid = getSelectedUUID();
                    if (uuid) {
                        const url = MapApi.getURL(MapAPIs.DCH_DOWNLOAD_SLD, { uuid });
                        window.open(url, "_blank", "noopener,noreferrer");
                    }
                },
            },
        ];
        setActions(actionsList);
    }, [getSelectedUUID, navigate, api, getSelectedRowData, getTableData]);

    // On Mount
    React.useEffect(() => {
        initActions();
        getTableData();
    }, [initActions, getTableData]);

    return (
        <React.Fragment>
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

            {/* Snackbar Notifications */}
            <DASnackbar ref={snackbarRef} />

            {/* Fullscreen Dialog for Add/Edit */}
            <DAFullScreenDialog ref={dialogRef} />
        </React.Fragment>
    );
};

export default LayerInfoAdmin;
