/**
 * MapInfo
 * ------------------
 * Admin page for managing Map configurations within the system.
 *
 * ✅ Features
 * -----------
 * - Displays a list of map entries in a smart data table (`ChangeList`)
 * - Supports CRUD actions:
 *    • Create new map
 *    • View a selected map
 *    • Update a selected map
 *    • Delete a selected map
 * - Uses `ChangeListToolbar` actions
 * - Inline snackbar notifications using `DASnackbar`
 *
 * ✅ Toolbar Actions
 * ------------------
 * - "Create Map Info"     → Navigates to map creation page
 * - "View Map"            → Opens map viewer for selected row
 * - "Update Map"          → Opens map edit form
 * - "Delete Map"          → Removes selected map (with confirmation)
 *
 * ✅ API Endpoints
 * ----------------
 * - `DCH_ALL_MAP_INFO`      → Load all map records
 * - `DCH_SAVE_MAP_INFO`     → Save updated map row
 * - `DCH_DELETE_MAP`        → Delete selected map
 *
 * ✅ Usage
 * --------
 * ```tsx
 * <Route path="/admin/map-info" element={<MapInfo />} />
 * ```
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DASnackbar, { DASnackbarHandle } from "@/components/base/DASnackbar";
import ChangeList, { ChangeListHandle } from "@/components/admin/ChangeList";
import { Column, Row } from "@/types/gridTypeDeclaration";
import { Action } from "@/components/admin/ChangeListToolbar";
import MapApi, { MapAPIs } from "@/api/MapApi";
import { Box, Paper, Typography } from "@mui/material";

const MapInfo = () => {
    const snackbarRef = useRef<DASnackbarHandle>(null);
    const changeListRef = useRef<ChangeListHandle>(null);

    const [columns, setColumns] = useState<Column[]>([]);
    const [data, setData] = useState<Row[]>([]);
    const [actions, setActions] = useState<Action[]>([]);

    const api = React.useMemo(() => new MapApi(snackbarRef), []);
    const navigate = useNavigate();

    const getSelectedUUID = useCallback(() => {
        const rowData = changeListRef.current?.getSelectedRowData();
        return (rowData as any)?.uuid;
    }, []);

    const initActions = useCallback(() => {
        const items: Action[] = [
            {
                name: "Create Map Info",
                visibleWhenEmpty: true,
                action: () => navigate("/EditMap/-1"),
            },
            {
                name: "View Map",
                requiresSelection: true,
                action: () => {
                    const uuid = getSelectedUUID();
                    uuid
                        ? navigate(`/ViewMap/${uuid}`)
                        : snackbarRef.current?.show("Please select a row", "warning");
                },
            },
            {
                name: "Update Map",
                requiresSelection: true,
                action: () => {
                    const uuid = getSelectedUUID();
                    uuid
                        ? navigate(`/EditMap/${uuid}`)
                        : snackbarRef.current?.show("Please select a row", "warning");
                },
            },
            {
                name: "Delete Map",
                requiresSelection: true,
                action: async () => {
                    const uuid = getSelectedUUID();
                    if (uuid) {
                        const payload = await api.get(MapAPIs.DCH_DELETE_MAP, { uuid });
                        if (payload) {
                            snackbarRef.current?.show("Map info deleted successfully", "success");
                            setTimeout(() => window.location.reload(), 1000);
                        }
                    } else {
                        snackbarRef.current?.show("Please select a row", "warning");
                    }
                },
            },
        ];
        setActions(items);
    }, [api, navigate, getSelectedUUID]);

    useEffect(() => {
        initActions();
        api.get(MapAPIs.DCH_ALL_MAP_INFO).then((payload) => {
            if (payload) {
                setColumns(payload.columns);
                setData(payload.rows);
            }
        });
    }, [api, initActions]);

    return (
        <>
            {columns.length > 0 ? (
                <ChangeList
                    ref={changeListRef}
                    columns={columns}
                    data={data}
                    tableHeight="100%"
                    tableWidth="100%"
                    actions={actions}
                    api={api}
                    pkColName="uuid"
                    saveURL={MapAPIs.DCH_SAVE_MAP_INFO}
                />
            ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Paper elevation={3} sx={{ padding: 3 }}>
                        <Typography variant="h6" align="center" color="text.secondary">
                            No Map Info Available
                        </Typography>
                    </Paper>
                </Box>
            )}
            <DASnackbar ref={snackbarRef} />
        </>
    );
};

export default MapInfo;
