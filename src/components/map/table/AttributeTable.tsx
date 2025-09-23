import React, { useRef, useState, useMemo, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,

    alpha,
    Box, useTheme,
} from "@mui/material";
import { lighten } from "@mui/material/styles";

import { WKT } from "ol/format";
import { MapAPIs } from "@/api/MapApi";
import PivotTable from "@/components/map/table/PivotTable";
import { Column, Row } from "@/types/gridTypeDeclaration";
import { getMapVM } from "@/hooks/MapVMContext";
import {AttributeTableToolbar} from "@/components/map/table/AttributeTableToolbar";

// import colorUtils from "@/utils/colorUtils";

interface IDataGridProps {
    columns: Column[];
    data: Row[];
    pkCols: string[];
    pivotTableSrc?: string;
}

const AttributeTable: React.FC<IDataGridProps> = ({ columns, data, pkCols }: IDataGridProps) => {
    const mapVM = getMapVM();
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedRowKey: initialSelectedRowKey, scrollTop } = mapVM.getAttributeTableState();

    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(initialSelectedRowKey);
    const [searchText, setSearchText] = useState("");
    const [headerRaised, setHeaderRaised] = useState(false);

    const theme = useTheme();
    const [contrastText, setContrastText] = useState(theme.palette.primary.contrastText);

    useEffect(() => {
        setContrastText(theme.palette.primary.contrastText);
    }, [theme.palette.primary.contrastText]);

    const getSelectedRowPKValue = (row: Row) => {
        try {
            const val = pkCols.map((col) => (row as any)[col]).join("__");
            return val || "";
        } catch {
            return "";
        }
    };

    const isSelected = (row: Row) => selectedRowKey === getSelectedRowPKValue(row);

    const handleRowClick = (row: Row) => {
        const key = getSelectedRowPKValue(row);
        setSelectedRowKey(key);
        mapVM.setAttributeTableState({ selectedRowKey: key });
        handleRowSelect(row);
    };

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
    }, []);

    const handleRowDoubleClick = (row: Row) => {
        const bottomDrawer = mapVM.getBottomDrawerRef();
        bottomDrawer.current?.handleHide();
        handleRowSelect(row);
        mapVM.getSelectionLayer()?.zoomToSelection();
    };

    const handleRowSelect = (row: Row) => {
        const uuid = mapVM.getLayerOfInterest();

        if (!row["geom"] && mapVM.isDALayerExists(uuid)) {
            const pkVal = getSelectedRowPKValue(row);
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
        }
    };

    const handleZoom = () => {
        const bottomDrawer = mapVM.getBottomDrawerRef();
        bottomDrawer.current?.handleHide?.();
        mapVM.getSelectionLayer()?.zoomToSelection();
    };

    const handleClear = () => {
        mapVM.getSelectionLayer()?.clearSelection();
        mapVM.zoomToMapExtent();
        setSelectedRowKey(null);
        mapVM.setAttributeTableState({ selectedRowKey: null });
    };

    const handlePivot = async () => {
        mapVM.getBottomDrawerRef().current?.handleHide?.();
        const appDialogRef = mapVM.getDialogBoxRef();
        appDialogRef?.current?.openDialog({
            title: "Pivot Table",
            content: (
                <div style={{ width: "100vw" }}>
                    <PivotTable columns={columns} data={data} defaultValLabel={"POTATO"} defaultRowLabels={["CANAL"]} />
                </div>
            ),
            isFullScreen: true,
        });
    };

    const handleExport = () => {
        const header = columns.map((col) => `"${col.label}"`).join(",") + "\n";
        const rows = filteredData
            .map((row) =>
                columns
                    .map((col) => {
                        const cell = (row as any)[col.id];
                        const escaped = typeof cell === "string" ? cell.replace(/"/g, '""') : cell;
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
                return val !== undefined && val !== null && val.toString().toLowerCase().includes(lowerSearch);
            })
        );
    }, [data, columns, searchText]);

    // const selectedColors = useMemo(() => {
    //     const base = theme?.palette.secondary.main ?? "#1976d2";
    //     const mode = theme?.palette.mode ?? "light";
    //
    //     // Provide a fallback color for 'paper' to avoid the 'undefined' type.
    //     const paper = theme?.palette.background.paper ?? (mode === "light" ? "#fff" : "#121212");
    //
    //     // Now, 'paper' is guaranteed to be a string, resolving the TS2345 error.
    //     const bg = colorUtils.getContrastColor(base, paper);
    //
    //     const text = colorUtils.getContrastingTextColorHex(bg);
    //
    //     // For hover and outline colors, you can use a consistent approach
    //     // that doesn't depend on the mode.
    //     const hoverBg = alpha(bg, 0.9);
    //     const outline = alpha(bg, 0.7);
    //
    //     console.log("colors", bg, hoverBg, outline, text);
    //     return { bg, hoverBg, text, outline };
    // }, [theme]);

    const headCellStyle = {
        backgroundColor:
            theme?.palette.mode === "dark"
                ? theme.palette.background.paper
                : lighten(theme?.palette.background.paper ?? "#fff", 0.04),
        fontWeight: 700,
        color: theme?.palette.text.primary,
        top: 0 as number,
        zIndex: 2,
        border: "none",
        whiteSpace: "nowrap" as const,
    } as const;

    const rowCellStyle = {
        padding: "6px 12px",
        border: "none",
    } as const;

    // const contrastText = theme?.palette.primary.contrastText;
    // console.log("contrastText", contrastText);
    const rowStyle = {
        boxShadow: `0 1px 3px ${alpha(contrastText, 0.12)}`,
        borderRadius: 6,
        backgroundColor: theme?.palette.background.paper,
    } as const;
    console.log("row Style", rowStyle);



    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <AttributeTableToolbar
                    ref={mapVM?.getAttributeTableRef()}
                    onZoom={handleZoom}
                    onClear={handleClear}
                    onPivot={handlePivot}
                    onExport={handleExport}
                    searchText={searchText}
                    onSearchTextChange={setSearchText}
                    rowsCount={filteredData.length}
                    disableGutters
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: (t) => t.zIndex.appBar,
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.secondary.contrastText,
                        borderRadius: 1,
                        px: 1.5,
                        py: 0.5,
                        gap: 1,
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                />

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
                        sx={{ borderCollapse: "separate", borderSpacing: "0 8px", border: "none" }}
                    >
                        <TableHead sx={{ top: 0, zIndex: 2, boxShadow: headerRaised ? "0 2px 6px rgba(0,0,0,0.15)" : "none" }}>
                            <TableRow>
                                <TableCell sx={{ ...headCellStyle, width: 72 }}>Sr. No.</TableCell>
                                {columns.map((col) => (
                                    <TableCell key={`head-${col.id}`} sx={{ ...headCellStyle, minWidth: 120 }}>
                                        {col.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((row, index) => {
                                const rowKey = getSelectedRowPKValue(row) || `idx-${index}`;
                                const selected = isSelected(row);
                                return (
                                    <TableRow
                                        key={`row-${rowKey}`}
                                        hover
                                        selected={selected}
                                        onClick={() => handleRowClick(row)}
                                        onDoubleClick={() => handleRowDoubleClick(row)}
                                        sx={{
                                            ...rowStyle,
                                            cursor: "pointer",
                                            "&:hover": {
                                                // Unified hover styles for both selected and non-selected rows
                                                boxShadow: `0 2px 8px  ${alpha(contrastText , 0.6)}`,
                                                // backgroundColor: !selected ? alpha(theme?.palette.action.hover ?? "#000", 0.3) : `${selectedColors.hoverBg} !important`,
                                            },
                                            ...(selected && {
                                                // backgroundColor: `${selectedColors.bg} !important`,
                                                // color: `${selectedColors.text} !important`,
                                                boxShadow: `0 6px 18px  ${alpha(contrastText , 0.6)}`,
                                                "& td": {
                                                    // color: `${selectedColors.text} !important`,
                                                    fontWeight: 1000
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
                                                <TableCell key={`cell-${rowKey}-${col.id}`} sx={rowCellStyle}>
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
