import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    FormGroup,
    TextField,
    Typography,
} from "@mui/material";
import { useMapVM } from "@/libs/damap";

const AttributeFieldSelectorForm: React.FC = () => {
    const mapVM = useMapVM();
    const tableManager = mapVM.getAttributeTableManager();

    const tableRequest = tableManager.getTableRequest();
    const columns = tableRequest?.columns || [];
    const visibleColumnIds = tableManager.getVisibleColumnIds();

    const [searchText, setSearchText] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        const initialIds =
            visibleColumnIds && visibleColumnIds.length
                ? visibleColumnIds
                : columns.map((col) => col.id);

        setSelectedIds(initialIds);
    }, [columns, visibleColumnIds]);

    const filteredColumns = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return columns;

        return columns.filter(
            (col) =>
                String(col.label).toLowerCase().includes(q) ||
                String(col.id).toLowerCase().includes(q)
        );
    }, [columns, searchText]);

    const handleToggle = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedIds(columns.map((col) => col.id));
    };

    const handleClearAll = () => {
        setSelectedIds([]);
    };

    const handleApply = () => {
        if (selectedIds.length === 0) {
            mapVM.showSnackbar("Please select at least one field", "warning");
            return;
        }

        const orderedIds = columns
            .map((col) => col.id)
            .filter((id) => selectedIds.includes(id));

        const isAllSelected = orderedIds.length === columns.length;

        tableManager.setVisibleColumnIds(isAllSelected ? null : orderedIds);
        mapVM.getDialogBoxRef().current?.closeDialog();
    };

    const handleShowAll = () => {
        tableManager.showAllColumns();
        mapVM.getDialogBoxRef().current?.closeDialog();
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    label="Search fields"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </Box>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                    gap: 1,
                    flexWrap: "wrap",
                }}
            >
                <Button size="small" onClick={handleSelectAll}>
                    Select All
                </Button>

                <Button size="small" onClick={handleClearAll}>
                    Clear All
                </Button>

                <Button size="small" onClick={handleShowAll}>
                    Show All Fields
                </Button>

                <Button variant="contained" size="small" onClick={handleApply}>
                    Apply
                </Button>
            </Box>

            <Typography variant="body2" sx={{ mb: 1 }}>
                Selected: {selectedIds.length} / {columns.length}
            </Typography>

            <Box
                sx={{
                    maxHeight: 300,
                    overflowY: "auto",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1,
                }}
            >
                <FormGroup>
                    {filteredColumns.map((col) => (
                        <FormControlLabel
                            key={col.id}
                            control={
                                <Checkbox
                                    checked={selectedIds.includes(col.id)}
                                    onChange={() => handleToggle(col.id)}
                                />
                            }
                            label={col.label || col.id}
                        />
                    ))}
                </FormGroup>
            </Box>
        </Box>
    );
};

export default AttributeFieldSelectorForm;