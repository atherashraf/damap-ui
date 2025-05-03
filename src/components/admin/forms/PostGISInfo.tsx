/**
 * PostGISInfo
 * ------------------
 *
 * Form component to add a new Layer Info based on a PostGIS table.
 *
 * Features:
 * - Select Database Connection
 * - List and Select Tables from the DB
 * - Select Layer Category
 * - Add Layer Info linked to the selected DB Table
 * - Support for adding a new Layer Category via embedded form
 *
 * Usage:
 * import PostGISInfo from '@/components/admin/forms/PostGISInfo';
 *
 * <PostGISInfo snackbarRef={snackbarRef} />
 *
 * Dependencies:
 * - DASnackbar (for notifications)
 * - MapApi (for server API calls)
 * - AddLayerCategoryForm (for adding new categories)
 * - LayerCategoryControl (for selecting existing categories)
 */

import * as React from "react";
import { Box, Button, MenuItem } from "@mui/material";
import { useState, useMemo, useEffect } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import {DASnackbarHandle} from "@/components/base/DASnackbar";
import MapApi, { MapAPIs } from "@/api/MapApi";
import LayerCategoryControl, { ILayerCategory } from "./LayerCategoryControl";
import AddLayerCategoryForm from "./AddLayerCategoryForm";

interface IDBConnection {
    id: number;
    name: string;
}

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
}

const PostGISInfo = (props: IProps) => {
    const [formType, setFormType] = useState<"LayerCategory" | null>(null);
    const [selectedDBId, setSelectedDBId] = useState<string>("");
    const [dbConnections, setDBConnections] = useState<IDBConnection[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>("");
    const [tableList, setTableList] = useState<string[]>([]);
    const [layerCategory, setLayerCategory] = useState<ILayerCategory>();

    const mapApi = useMemo(() => new MapApi(props.snackbarRef), [props.snackbarRef]);

    // Load available DB connections
    useEffect(() => {
        mapApi.get(MapAPIs.DCH_DB_CONNECTION).then((payload) => {
            if (payload) {
                setDBConnections(payload);
            }
        });
    }, [mapApi]);

    const handleDBChange = (event: SelectChangeEvent) => {
        const dbId = event.target.value as string;
        setSelectedDBId(dbId);
        setSelectedTable("");
        mapApi.get(MapAPIs.DCH_DB_TABLE_LIST, { db_id: dbId }).then((payload) => {
            if (payload) {
                setTableList(payload);
            }
        });
    };

    const handleTableChange = (event: SelectChangeEvent) => {
        setSelectedTable(event.target.value as string);
    };

    const handleAddLayerInfo = () => {
        mapApi
            .get(MapAPIs.DCH_SAVE_DB_LAYER_INFO, {
                db_id: selectedDBId,
                table_name: selectedTable,
                layer_category_id: layerCategory?.pk,
            })
            .then((payload) => {
                if (payload) {
                    props.snackbarRef.current?.show(payload.msg);
                }
            });
    };

    const getForm = () => {
        switch (formType) {
            case "LayerCategory":
                return (
                    <AddLayerCategoryForm
                        key={"LayerCategoryFormKey"}
                        snackbarRef={props.snackbarRef}
                        handleBack={() => setFormType(null)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <React.Fragment>
            {formType !== null ? (
                getForm()
            ) : (
                <React.Fragment>
                    {/* Database Connection Selector */}
                    <Box sx={{ margin: "30px" }}>
                        <FormControl fullWidth>
                            <InputLabel id="database-connection-input">
                                Database Connection
                            </InputLabel>
                            <Select
                                value={selectedDBId}
                                label="Database Connection"
                                onChange={handleDBChange}
                            >
                                <MenuItem value={""}></MenuItem>
                                {dbConnections.map((d: IDBConnection) => (
                                    <MenuItem key={d.id} value={d.id}>
                                        {d.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Table List (only if DB is selected) */}
                    {selectedDBId && (
                        <React.Fragment>
                            <Box sx={{ margin: "30px" }}>
                                <FormControl fullWidth>
                                    <InputLabel>Table List</InputLabel>
                                    <Select
                                        value={selectedTable}
                                        label="Table List"
                                        onChange={handleTableChange}
                                    >
                                        {tableList.map((name: string) => (
                                            <MenuItem key={name} value={name}>
                                                {name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Layer Category Selector */}
                            <Box sx={{ margin: "30px" }}>
                                <LayerCategoryControl
                                    api={mapApi}
                                    setLayerCategory={(layerCategory: ILayerCategory) =>
                                        setLayerCategory(layerCategory)
                                    }
                                    handleAddLayerCategory={() => setFormType("LayerCategory")}
                                />
                            </Box>

                            {/* Submit Button */}
                            <Box sx={{ margin: "30px" }}>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    onClick={handleAddLayerInfo}
                                    disabled={!selectedTable || !layerCategory}
                                >
                                    Add Layer Info
                                </Button>
                            </Box>
                        </React.Fragment>
                    )}
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

export default PostGISInfo;
