import React, { useRef, useState, useMemo, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Toolbar,
    Typography,
    TextField,
    Tooltip,
    alpha,
    Box,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import TableChartIcon from "@mui/icons-material/TableChart";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { WKT } from "ol/format";
import { MapAPIs } from "@/api/MapApi";
import PivotTable from "@/components/map/table/PivotTable";
import { Column, Row } from "@/types/gridTypeDeclaration";
import { getMapVM } from "@/hooks/MapVMContext";

interface IDataGridProps {
    columns: Column[];
    data: Row[];
    pkCols: string[];
    pivotTableSrc?: string;
}

const AttributeTable: React.FC<IDataGridProps> = ({
                                                      columns,
                                                      data,
                                                      pkCols,
                                                  }: IDataGridProps) => {
    const mapVM = getMapVM();
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedRowKey: initialSelectedRowKey, scrollTop } =
        mapVM.getAttributeTableState();

    // ✅ use state instead of ref so selection re-renders reliably
    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(
        initialSelectedRowKey
    );
    const [searchText, setSearchText] = useState("");

    const [headerRaised, setHeaderRaised] = useState(false);

    const theme = mapVM.getTheme();

    const getSelectedRowPKValue = (row: Row) => {
        try {
            const val = pkCols.map((col) => (row as any)[col]).join("__");
            return val || "";
        } catch {
            return "";
        }
    };

    const isSelected = (row: Row) =>
        selectedRowKey === getSelectedRowPKValue(row);

    const handleRowClick = (row: Row) => {
        const key = getSelectedRowPKValue(row);
        setSelectedRowKey(key); // triggers render
        mapVM.setAttributeTableState({ selectedRowKey: key });
        // keep single-click light; heavy stuff happens on double-click
        handleRowSelect(row);
    };

    // For scroll tracking
    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        node.scrollTop = scrollTop || 0;
        const onScroll = () => {
            mapVM.setAttributeTableState({ scrollTop: node.scrollTop });
            setHeaderRaised(node.scrollTop > 0);
        };
        node.addEventListener("scroll", onScroll);
        setHeaderRaised(node.scrollTop > 0);
        return () => node.removeEventListener("scroll", onScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRowDoubleClick = (row: Row) => {
        const bottomDrawer = mapVM.getBottomDrawerRef();
        bottomDrawer.current?.handleHide();
        handleRowSelect(row);
        mapVM.getSelectionLayer()?.zoomToSelection();
    };

    const handleRowSelect = (row: Row) => {
        const uuid = mapVM.getLayerOfInterest();

        console.log("handleRowSelect", uuid, mapVM.isDALayerExists(uuid), !row["geom"]);
        if (!row["geom"] && mapVM.isDALayerExists(uuid)) {
            const pkVal = getSelectedRowPKValue(row);
            console.log("handleRowSelect", uuid, row);
            mapVM.getMapLoadingRef().current?.openIsLoading();
            mapVM
                .getApi()
                .get(MapAPIs.DCH_GET_FEATURE_GEOMETRY, { uuid, pk_values: pkVal })
                .then((payload: any) => {
                    mapVM.getSelectionLayer()?.addWKT2Selection(payload);
                    (row as any)["geom"] = payload;
                })
                .finally(() => {
                    mapVM.getMapLoadingRef().current?.closeIsLoading();
                });
        } else if (mapVM.isOverlayLayerExist(uuid)) {
            const wkt = new WKT().writeGeometry((row as any)["geometry"]);
            mapVM.getSelectionLayer()?.addWKT2Selection(wkt, true);
        } else if (row["geom"]) {
            mapVM.getSelectionLayer()?.addWKT2Selection(row["geom"]);
        } else {
            // optional: snackbar if no geometry available
            // mapVM.getSnackbarRef().current?.show("Geometry not available for this layer.", "error");
        }
    };

    const handleZoom = () => {
        const bottomDrawer = mapVM.getBottomDrawerRef();
        bottomDrawer.current?.handleHide?.();
        mapVM.getSelectionLayer()?.zoomToSelection();
    };

    const handleClear = () => {
        mapVM.getSelectionLayer()?.clearSelection();
        mapVM.zoomToFullExtent();
        setSelectedRowKey(null);
        mapVM.setAttributeTableState({ selectedRowKey: null });
    };

    const handlePivot = async () => {
        mapVM.getBottomDrawerRef().current?.handleHide?.();
        const appDialogRef = mapVM.getDialogBoxRef();
        appDialogRef?.current?.openDialog({
            title: "Pivot Table",
            content: <div style={{"width":' 100vw'}}><PivotTable columns={columns} data={data} /></div>,
            isFullScreen: true,

        })

    };

    const handleExport = () => {
        const header = columns.map((col) => `"${col.label}"`).join(",") + "\n";
        const rows = filteredData
            .map((row) =>
                columns
                    .map((col) => {
                        const cell = (row as any)[col.id];
                        const escaped =
                            typeof cell === "string" ? cell.replace(/"/g, '""') : cell;
                        return `"${escaped}"`;
                    })
                    .join(",")
            )
            .join("\n");

        const csvContent = header + rows;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "attribute_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredData = useMemo(() => {
        if (!searchText) return data;
        const lowerSearch = searchText.toLowerCase();
        return data.filter((row) =>
            columns.some((col) => {
                const val = (row as any)[col.id];
                return (
                    val !== undefined &&
                    val !== null &&
                    val.toString().toLowerCase().includes(lowerSearch)
                );
            })
        );
    }, [data, columns, searchText]);

    const headCellStyle = {
        backgroundColor: theme?.palette.mode === "dark" ? "#1e1e1e" : "#f7f7f7",
        fontWeight: 700,
        color: theme?.palette.text.primary,
        top: 0 as number,
        zIndex: 2,
        border: "none",
        whiteSpace: "nowrap" as const,
    };
    const rowCellStyle = {
        padding: "6px 12px",
        border: "none",
    };
    const rowStyle = {
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
        borderRadius: 6,
        backgroundColor: "#fff",
    };

    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <Toolbar
                    variant="dense"
                    disableGutters
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: (t) => t.zIndex.appBar,
                        backgroundColor: theme?.palette.secondary.main,
                        color: theme?.palette.secondary.contrastText,
                        borderRadius: 1,
                        px: 1.5,
                        py: 0.5,
                        gap: 1,
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Tooltip title="Zoom to Selection" arrow>
                        <IconButton size="small" onClick={handleZoom}>
                            <ZoomInIcon sx={{ color: theme?.palette.secondary.contrastText }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Clear Selection" arrow>
                        <IconButton size="small" onClick={handleClear}>
                            <CloseIcon sx={{ color: theme?.palette.secondary.contrastText }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Pivot Table" arrow>
                        <IconButton size="small" onClick={handlePivot}>
                            <TableChartIcon
                                sx={{ color: theme?.palette.secondary.contrastText }}
                            />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Export to CSV" arrow>
                        <IconButton size="small" onClick={handleExport}>
                            <FileDownloadIcon
                                sx={{ color: theme?.palette.secondary.contrastText }}
                            />
                        </IconButton>
                    </Tooltip>

                    <span style={{ flex: 1 }} />

                    <TextField
                        size="small"
                        placeholder="Search…"
                        variant="outlined"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        sx={{
                            minWidth: 200,
                            flex: { xs: "1 1 220px", sm: "0 0 260px" },
                            backgroundColor: "#fff",
                            borderRadius: 1,
                            "& .MuiOutlinedInput-input": {
                                color: theme?.palette.secondary.main,
                            },
                        }}
                    />

                    <Typography
                        variant="subtitle2"
                        sx={{
                            ml: 1,
                            whiteSpace: "nowrap",
                            color: theme?.palette.secondary.contrastText,
                        }}
                    >
                        Rows: {filteredData.length}
                    </Typography>
                </Toolbar>

                <TableContainer
                    ref={containerRef}
                    component={Paper}
                    elevation={0}
                    sx={{
                        flex: 1,
                        height: "100%",
                        maxHeight: "100%",
                        overflowY: "auto",
                        borderRadius: 0,
                        boxShadow: "none",
                        border: "none",
                    }}
                >
                    <Table
                        size="small"
                        stickyHeader
                        sx={{
                            borderCollapse: "separate",
                            borderSpacing: "0 8px",
                            border: "none",
                        }}
                    >
                        <TableHead
                            sx={{
                                top: 0,
                                zIndex: 2,
                                boxShadow: headerRaised ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                            }}
                        >
                            <TableRow>
                                <TableCell sx={{ ...headCellStyle, width: 72 }}>Sr. No.</TableCell>
                                {columns.map((col) => (
                                    <TableCell
                                        key={`head-${col.id}`}
                                        sx={{ ...headCellStyle, minWidth: 120 }}
                                    >
                                        {col.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((row, index) => {
                                const rowKey = getSelectedRowPKValue(row) || `idx-${index}`;
                                return (
                                    <TableRow
                                        key={`row-${rowKey}`}
                                        hover
                                        selected={isSelected(row)}
                                        onClick={() => handleRowClick(row)}
                                        onDoubleClick={() => handleRowDoubleClick(row)}
                                        sx={{
                                            ...rowStyle,
                                            cursor: "pointer",
                                            "&:hover": {
                                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                                            },
                                            ...(isSelected(row) && {
                                                bgcolor: `${
                                                    theme && alpha(theme?.palette?.secondary.light, 0.9)
                                                } !important`,
                                                boxShadow: `0 3px 10px ${
                                                    theme && alpha(theme?.palette.secondary.main, 0.6)
                                                }`,
                                                color: theme?.palette.secondary.contrastText,
                                                "& td": {
                                                    color: theme?.palette.secondary.contrastText,
                                                    fontWeight: 500,
                                                },
                                            }),
                                        }}
                                    >
                                        <TableCell sx={rowCellStyle} key={`cell-index-${rowKey}`}>
                                            {index + 1}
                                        </TableCell>
                                        {columns.map((col) => {
                                            const value = (row as any)[col.id];
                                            let displayValue = "";

                                            if (value !== undefined && value !== null) {
                                                if (typeof value === "object") {
                                                    if (typeof (value as any).getCoordinates === "function") {
                                                        displayValue = "[geometry]";
                                                    } else {
                                                        try {
                                                            displayValue = JSON.stringify(value);
                                                        } catch {
                                                            displayValue = String(value);
                                                        }
                                                    }
                                                } else {
                                                    displayValue = value.toString();
                                                }
                                            }

                                            return (
                                                <TableCell
                                                    key={`cell-${rowKey}-${col.id}`}
                                                    sx={rowCellStyle}
                                                >
                                                    {displayValue}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
        </>
    );
};

export default AttributeTable;
