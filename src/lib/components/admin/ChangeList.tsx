/**
 * ChangeList
 * ------------------
 * A dynamic and reusable data table component with inline editing, toolbar actions, and row selection support.
 */

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Checkbox,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import ChangeListToolbar, { Action, IToolbarButton } from "./ChangeListToolbar";
import { Column, Row } from "@/types/gridTypeDeclaration";
import MapApi from "@/api/MapApi";

export interface ChangeListHandle {
    getSelectedRowData: () => Row | null;
}

interface IProps {
    columns: Column[];
    data: Row[];              // parent state passed as props
    api: MapApi;
    tableHeight?: string | number;
    tableWidth?: string | number;
    buttons?: IToolbarButton[];
    actions?: Action[];
    modelName?: string;
    pkColName: string;
    saveURL: string;
}

const ChangeList = forwardRef<ChangeListHandle, IProps>((props, ref) => {
    const {
        columns,
        data: propData,          // ✅ avoid name clash
        api,
        buttons = [],
        actions = [],
        tableHeight = "100%",
        tableWidth = "100%",
        pkColName,
    } = props;

    // Keep a master copy for search filtering
    const masterRowsRef = useRef<Row[]>(propData ?? []);

    // Local editable/filterable state
    const [rows, setRows] = useState<Row[]>(propData ?? []);
    const [editableRowIndex, setEditableRowIndex] = useState<number | null>(null);

    // Track selection by primary key (robust across filtering/sorting)
    const [selectedPk, setSelectedPk] = useState<string | number | null>(null);

    const [copiedCell, setCopiedCell] = useState<string | null>(null);
    const toolbarRef = useRef<any>(null);

    // ✅ Sync when parent passes new data
    useEffect(() => {
        masterRowsRef.current = propData ?? [];
        setRows(masterRowsRef.current);
        setEditableRowIndex(null);
        // if the selected row no longer exists, clear selection
        if (selectedPk != null) {
            const stillExists = masterRowsRef.current.some(r => r[pkColName] === selectedPk);
            if (!stillExists) setSelectedPk(null);
        }
    }, [propData, pkColName, selectedPk]);

    useImperativeHandle(ref, () => ({
        getSelectedRowData: () =>
            selectedPk != null ? rows.find(r => r[pkColName] === selectedPk) ?? null : null,
    }));

    const handleInputChange = (rowIndex: number, columnId: string, value: any) => {
        setRows(prev => {
            const updated = [...prev];
            updated[rowIndex] = { ...updated[rowIndex], [columnId]: value };
            return updated;
        });
    };

    const saveRow = async (rowIndex: number) => {
        const rowData = rows[rowIndex];
        const payload = await api.post(props.saveURL, {
            pk: { colName: pkColName, colValue: rowData[pkColName] },
            rowData,
        });
        if (payload) {
            api.snackbarRef?.current?.show("Saved successfully", "success");
            setEditableRowIndex(null);
        } else {
            api.snackbarRef?.current?.show("Fail to save data. Please correct it.", "error");
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCell(text);
        setTimeout(() => setCopiedCell(null), 1000);
    };

    const hasSelection = selectedPk !== null;

    return (
        <div
            style={{
                width: tableWidth,
                height: tableHeight,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* Sticky Toolbar */}
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    background: "#f5f5f5",
                }}
            >
                <ChangeListToolbar
                    ref={toolbarRef}
                    parent={{ startEditing: () => setEditableRowIndex(0) }}
                    buttons={buttons}
                    actions={actions}
                    hasSelection={hasSelection}
                    onSearchChange={(text) => {
                        const q = text.toLowerCase();
                        const filtered = masterRowsRef.current.filter((row) =>
                            Object.values(row).some((val) => String(val).toLowerCase().includes(q))
                        );
                        setRows(filtered);
                    }}
                />
            </div>

            {/* Table Content */}
            <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: "auto" }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell>Actions</TableCell>
                            {columns.map((col) => (
                                <TableCell key={col.id}>{col.label}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                {/* colSpan = checkbox + actions + all columns */}
                                <TableCell
                                    colSpan={columns.length + 2}
                                    align="center"
                                    sx={{ py: 6, color: "text.secondary" }}
                                >
                                    No data available
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, rowIndex) => {
                                const pk = (row as any)[pkColName];
                                const isEditing = editableRowIndex === rowIndex;
                                const isSelected = selectedPk === pk;

                                return (
                                    <TableRow
                                        key={(row as any).id || (row as any).uuid || pk || rowIndex}
                                        hover
                                        selected={isSelected}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => setSelectedPk(isSelected ? null : pk)}
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <IconButton color="success" onClick={() => saveRow(rowIndex)}>
                                                    <SaveIcon />
                                                </IconButton>
                                            ) : (
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => setEditableRowIndex(rowIndex)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            )}
                                        </TableCell>

                                        {columns.map((col) => {
                                            const value = (row as any)[col.id];
                                            const stringValue =
                                                typeof value === "object"
                                                    ? JSON.stringify(value)
                                                    : String(value ?? "");

                                            return (
                                                <TableCell
                                                    key={col.id}
                                                    sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}
                                                >
                                                    {isEditing ? (
                                                        <textarea
                                                            style={{
                                                                width: "100%",
                                                                background: "#222",
                                                                color: "white",
                                                                border: "1px solid #555",
                                                                borderRadius: "4px",
                                                                padding: "8px",
                                                                resize: "vertical",
                                                                minHeight: "80px",
                                                                maxHeight: "200px",
                                                                overflow: "auto",
                                                            }}
                                                            value={stringValue}
                                                            onChange={(e) => handleInputChange(rowIndex, col.id, e.target.value)}
                                                        />
                                                    ) : (
                                                        <Tooltip title={stringValue}>
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 4,
                                                                    overflow: "hidden",
                                                                }}
                                                            >
                                <span
                                    style={{
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: 150,
                                    }}
                                >
                                  {stringValue}
                                </span>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleCopy(stringValue)}
                                                                >
                                                                    {copiedCell === stringValue ? (
                                                                        <CheckIcon fontSize="small" />
                                                                    ) : (
                                                                        <ContentCopyIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </div>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
});

export default ChangeList;
