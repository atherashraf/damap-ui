import React, { useState, useEffect, useMemo } from "react";
import { Box, Button, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent } from "@mui/material";
import { DASnackbarHandle } from "@/components/base/DASnackbar";
import MapApi, { MapAPIs } from "@/api/MapApi";
import AddDBConnectionForm from "@/components/admin/forms/AddDBConnectionForm";
import LayerCategoryControl, { ILayerCategory } from "./LayerCategoryControl";
import AddLayerCategoryForm from "./AddLayerCategoryForm";

interface IDBConnection {
    id: number;
    name: string;
}

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    onSuccess?: () => void;
}

const PostGISInfo = ({ snackbarRef, onSuccess }: IProps) => {
    const [formType, setFormType] = useState<"LayerCategory" | "AddDB" | null>(null);
    const [selectedDBId, setSelectedDBId] = useState<string>("");
    const [dbConnections, setDBConnections] = useState<IDBConnection[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>("");
    const [tableList, setTableList] = useState<string[]>([]);
    const [layerCategory, setLayerCategory] = useState<ILayerCategory>();

    const mapApi = useMemo(() => new MapApi(snackbarRef), [snackbarRef]);

    const loadDBConnections = () => {
        mapApi.get(MapAPIs.DCH_DB_CONNECTION).then((payload) => {
            if (payload) setDBConnections(payload);
        });
    };

    useEffect(() => {
        loadDBConnections();
    }, []);

    const handleDBChange = (event: SelectChangeEvent) => {
        const dbId = event.target.value;
        setSelectedDBId(dbId);
        setSelectedTable("");
        mapApi.get(MapAPIs.DCH_DB_TABLE_LIST, { db_id: dbId }).then((payload) => {
            if (payload) setTableList(payload);
        });
    };

    const handleTableChange = (event: SelectChangeEvent) => {
        setSelectedTable(event.target.value);
    };

    const handleAddLayerInfo = () => {
        mapApi.get(MapAPIs.DCH_SAVE_DB_LAYER_INFO, {
            db_id: selectedDBId,
            table_name: selectedTable,
            layer_category_id: layerCategory?.pk,
        }).then((payload) => {
            if (payload) {
                snackbarRef.current?.show(payload.msg);
                onSuccess?.();
            }
        });
    };

    const getForm = () => {
        switch (formType) {
            case "LayerCategory":
                return (
                    <AddLayerCategoryForm
                        key="LayerCategoryForm"
                        snackbarRef={snackbarRef}
                        handleBack={() => setFormType(null)}
                    />
                );
            case "AddDB":
                return (
                    <AddDBConnectionForm
                        key="AddDBForm"
                        snackbarRef={snackbarRef}
                        handleBack={() => setFormType(null)}
                        onConnectionAdded={loadDBConnections}
                    />
                );
            default:
                return null;
        }
    };

    return formType !== null ? (
        getForm()
    ) : (
        <>
            <Box sx={{ margin: "30px" }}>
                <FormControl fullWidth>
                    <InputLabel id="db-select-label">Database Connection</InputLabel>
                    <Select
                        labelId="db-select-label"
                        value={selectedDBId}
                        label="Database Connection"
                        onChange={handleDBChange}
                    >
                        <MenuItem value="">Select</MenuItem>
                        {dbConnections.map((db) => (
                            <MenuItem key={db.id} value={db.id}>
                                {db.name}
                            </MenuItem>
                        ))}
                    </Select>
                    <Button sx={{ mt: 1 }} onClick={() => setFormType("AddDB")}>
                        + Add New DB Connection
                    </Button>
                </FormControl>
            </Box>

            {selectedDBId && (
                <>
                    <Box sx={{ margin: "30px" }}>
                        <FormControl fullWidth>
                            <InputLabel>Table List</InputLabel>
                            <Select
                                value={selectedTable}
                                label="Table List"
                                onChange={handleTableChange}
                            >
                                {tableList.map((table) => (
                                    <MenuItem key={table} value={table}>
                                        {table}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ margin: "30px" }}>
                        <LayerCategoryControl
                            api={mapApi}
                            setLayerCategory={setLayerCategory}
                            handleAddLayerCategory={() => setFormType("LayerCategory")}
                        />
                    </Box>

                    <Box sx={{ margin: "30px" }}>
                        <Button
                            variant="contained"
                            onClick={handleAddLayerInfo}
                            disabled={!selectedTable || !layerCategory}
                        >
                            Add Layer Info
                        </Button>
                    </Box>
                </>
            )}
        </>
    );
};

export default PostGISInfo;
