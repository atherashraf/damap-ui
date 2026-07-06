import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    TextField,
    Typography,
} from "@mui/material";
import { useMapVM } from "@/libs/damap";

const AttributeBulkAssignForm: React.FC = () => {
    const mapVM = useMapVM();
    const tableManager = mapVM.getAttributeTableManager();
    const dmlManager = mapVM.dmlManager;

    const tableRequest = tableManager.getTableRequest();
    const columns = tableRequest?.columns || [];
    const pkCols = tableRequest?.pkCols || [];
    const layerUuid = mapVM.getLayerOfInterest();

    const [columnId, setColumnId] = useState("");
    const [value, setValue] = useState("");

    const editableColumns = useMemo(() => {
        return columns.filter((col) => !pkCols.includes(col.id));
    }, [columns, pkCols]);

    const selectedRows = tableManager.getSelectedRows();

    const handleApply = async () => {
        if (!layerUuid) {
            mapVM.showSnackbar("Please select a layer", "warning");
            return;
        }

        if (!columnId) {
            mapVM.showSnackbar("Please select a field", "warning");
            return;
        }

        if (!selectedRows.length) {
            mapVM.showSnackbar("Please select at least one row", "warning");
            return;
        }

        const selectedColumn = columns.find((c) => c.id === columnId);
        if (!selectedColumn) {
            mapVM.showSnackbar("Invalid field selected", "warning");
            return;
        }

        let parsedValue: any;

        if (selectedColumn.type === "number") {
            parsedValue = value === "" ? null : Number(value);
            if (value !== "" && Number.isNaN(parsedValue)) {
                mapVM.showSnackbar("Please enter a valid number", "warning");
                return;
            }
        } else if (selectedColumn.type === "date") {
            parsedValue = value === "" ? null : value;
        } else {
            parsedValue = value;
        }

        const pkObjects = selectedRows.map((row) =>
            tableManager.getRowPKObject(row, pkCols)
        );

        const ok = await dmlManager.updateAttributesForMany(
            layerUuid,
            pkObjects,
            columnId,
            parsedValue
        );

        if (ok) {
            mapVM.getDialogBoxRef().current?.closeDialog();
        }
    };

    return (
        <Box sx={{ p: 2, minWidth: 420, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2">
                Selected rows: {selectedRows.length}
            </Typography>

            <FormControl fullWidth size="small">
                <InputLabel id="bulk-assign-field-label">Field</InputLabel>
                <Select
                    labelId="bulk-assign-field-label"
                    value={columnId}
                    label="Field"
                    onChange={(e: SelectChangeEvent) => setColumnId(e.target.value)}
                >
                    {editableColumns.map((col) => (
                        <MenuItem key={col.id} value={col.id}>
                            {col.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                fullWidth
                size="small"
                label="Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button onClick={() => mapVM.getDialogBoxRef().current?.closeDialog()}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleApply}>
                    Apply to Selected
                </Button>
            </Box>
        </Box>
    );
};

export default AttributeBulkAssignForm;