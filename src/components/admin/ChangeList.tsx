import {useState, useRef, forwardRef, useImperativeHandle} from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Checkbox,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import ChangeListToolbar, {Action, IToolbarButton} from "./ChangeListToolbar";
import {Column, Row} from "@/types/gridTypeDeclaration";
import MapApi from "@/api/MapApi";

export interface ChangeListHandle {
    getSelectedRowData: () => Row | null;
}

interface IProps {
    columns: Column[];
    data: Row[];
    api: MapApi;
    tableHeight?: string | number;
    tableWidth?: string | number;
    buttons?: IToolbarButton[];
    actions?: Action[];
    modelName?: string;
    pkColName: string;
    saveURL: string
}

const ChangeList = forwardRef<ChangeListHandle, IProps>((props, ref) => {
    const {
        columns,
        data: initialData,
        api,
        buttons = [],
        actions = [],
        tableHeight = "100%",
        tableWidth = "100%",
        pkColName
    } = props;

    const [data, setData] = useState<Row[]>(initialData);
    const [editableRowIndex, setEditableRowIndex] = useState<number | null>(null);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [copiedCell, setCopiedCell] = useState<string | null>(null);

    const toolbarRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        getSelectedRowData: () => (selectedRow !== null ? data[selectedRow] : null)
    }));

    const handleInputChange = (rowIndex: number, columnId: string, value: any) => {
        setData(prev => {
            const updated = [...prev];
            updated[rowIndex] = {...updated[rowIndex], [columnId]: value};
            return updated;
        });
    };

    const saveRow = async (rowIndex: number) => {
        const rowData = data[rowIndex];
        const payload = await api.post(props.saveURL, {
            pk: {colName: pkColName, colValue: rowData[pkColName]},
            rowData
        });

        if (payload) {
            api.snackbarRef?.current?.show("Saved successfully", "success");
            setEditableRowIndex(null);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCell(text);
        setTimeout(() => setCopiedCell(null), 1000);
    };

    return (
        <div style={{
            width: tableWidth,
            height: tableHeight,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
        }}>
            {/* Sticky Toolbar */}
            <div style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                background: "#f5f5f5"
            }}>
                <ChangeListToolbar
                    ref={toolbarRef}
                    parent={{startEditing: () => setEditableRowIndex(0)}}
                    buttons={buttons}
                    actions={actions}
                    onSearchChange={(text) => {
                        const filtered = initialData.filter(row =>
                            Object.values(row).some(val =>
                                String(val).toLowerCase().includes(text.toLowerCase())
                            )
                        );
                        setData(filtered);
                    }}
                />
            </div>

            {/* Table Content */}
            <TableContainer component={Paper} sx={{flexGrow: 1, overflow: "auto"}}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell>Actions</TableCell>
                            {columns.map(col => (
                                <TableCell key={col.id}>{col.label}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row, rowIndex) => {
                            const isEditing = editableRowIndex === rowIndex;
                            const isSelected = selectedRow === rowIndex;

                            return (
                                <TableRow key={row.id || row.uuid || rowIndex} hover selected={isSelected}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={_ => setSelectedRow(rowIndex)}
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <IconButton color="success" onClick={() => saveRow(rowIndex)}>
                                                <SaveIcon />
                                            </IconButton>
                                        ) : (
                                            <IconButton color="primary" onClick={() => setEditableRowIndex(rowIndex)}>
                                                <EditIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                    {columns.map(col => {
                                        const value = row[col.id];
                                        const stringValue = typeof value === "object"
                                            ? JSON.stringify(value)
                                            : String(value ?? "");

                                        return (
                                            <TableCell
                                                key={col.id}
                                                sx={{
                                                    maxWidth: 200,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis"
                                                }}
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
                                                            overflow: "auto"
                                                        }}
                                                        value={stringValue}
                                                        onChange={_ => handleInputChange(rowIndex, col.id, _.target.value)}
                                                    />
                                                ) : (
                                                    <Tooltip title={stringValue}>
                                                        <div style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            overflow: "hidden"
                                                        }}>
                                                            <span style={{
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                maxWidth: "150px"
                                                            }}>
                                                                {stringValue}
                                                            </span>
                                                            <IconButton size="small" onClick={() => handleCopy(stringValue)}>
                                                                {copiedCell === stringValue
                                                                    ? <CheckIcon fontSize="small" />
                                                                    : <ContentCopyIcon fontSize="small" />
                                                                }
                                                            </IconButton>
                                                        </div>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
});

export default ChangeList;
