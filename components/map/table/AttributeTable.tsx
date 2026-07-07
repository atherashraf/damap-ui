import React, {
    useRef,
    useState,
    useMemo,
    useEffect,
    useLayoutEffect,
    useCallback,
} from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    alpha,
    Box,
    useTheme,
    Tooltip,
    IconButton,
    TextField,
    Checkbox,
} from "@mui/material";
import { lighten } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TableSortLabel from "@mui/material/TableSortLabel";
import { visuallyHidden } from "@mui/utils";
import { Column, Row } from "@damap/types/gridTypeDeclaration";
import { getMapVM } from "@damap/hooks/MapVMContext";
import { AttributeTableToolbar } from "@damap/components/map/table/AttributeTableToolbar";
import AttributeTablePhotoCell from "@damap/components/map/table/AttributeTablePhotoCell";
import {
    AttributeTableImagePreview,
    type AttributeTableImagePreviewState,
} from "@damap/components/map/table/AttributeTableImagePreview";
import { formatAttributeCellDisplay } from "@damap/utils/attributeTableDisplay";
import {getImageCellThumbnailUrl, getImageCellUrl} from "@/libs/damap";
// import { getImageCellThumbnailUrl, getImageCellUrl } from "@/utils/media";

const ROW_HEIGHT = 38;
const OVERSCAN_COUNT = 10;

const AttributeTable: React.FC = () => {
    const mapVM = getMapVM();
    const theme = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const tableManager = mapVM.getAttributeTableManager();

    const [, forceRender] = useState(0);

    const columns = tableManager.columns ?? [];
    const rows = tableManager.data ?? [];
    const pkCols = tableManager.pkCols ?? [];

    const {
        scrollTop: persistedScrollTop,
        visibleColumnIds,
    } = tableManager.getAttributeTableState();

    const isEditingAllowed = mapVM.dmlManager.isEditingAllowed;


    const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(
        new Set(tableManager.getSelectedRowKeys())
    );
    const [searchText, setSearchText] = useState("");
    const [headerRaised, setHeaderRaised] = useState(false);
    const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
    const [tempRowData, setTempRowData] = useState<Row | null>(null);
    const [virtualScrollTop, setVirtualScrollTop] = useState(
        persistedScrollTop || 0
    );


    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    } | null>(null);

    const [currentVisibleColumnIds, setCurrentVisibleColumnIds] = useState<
        string[] | null
    >(visibleColumnIds ?? null);

    const [containerHeight, setContainerHeight] = useState(400);

    const restoredScrollRef = useRef(false);
    const scrollRafRef = useRef<number | null>(null);


    const [imagePreview, setImagePreview] =
        useState<AttributeTableImagePreviewState>(null);

    const handlePhotoPreview = useCallback((url: string, thumbnailUrl: string, title: string) => {
        setImagePreview({ url, thumbnailUrl, title });
    }, []);

    const [dateFilter, setDateFilter] = useState<{
        columnId: string;
        from: string;
        to: string;
    }>({
        columnId: "",
        from: "",
        to: "",
    });




    useEffect(() => {
        if (typeof (tableManager as any).subscribeTable !== "function") return;

        return (tableManager as any).subscribeTable(() => {
            forceRender((v) => v + 1);
        });
    }, [tableManager]);

    useLayoutEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const updateHeight = () => {
            setContainerHeight(node.clientHeight || 400);
        };

        updateHeight();

        const observer = new ResizeObserver(() => {
            updateHeight();
        });

        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        if (!restoredScrollRef.current) {
            const initialScrollTop = persistedScrollTop || 0;
            node.scrollTop = initialScrollTop;
            setVirtualScrollTop(initialScrollTop);
            setHeaderRaised(initialScrollTop > 0);
            restoredScrollRef.current = true;
        }
    }, [persistedScrollTop, rows.length, columns.length]);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const onScroll = () => {
            const nextScrollTop = node.scrollTop;

            setVirtualScrollTop(nextScrollTop);
            setHeaderRaised(nextScrollTop > 0);

            if (scrollRafRef.current !== null) {
                cancelAnimationFrame(scrollRafRef.current);
            }

            scrollRafRef.current = requestAnimationFrame(() => {
                if (
                    Math.abs(
                        (tableManager.getAttributeTableState().scrollTop || 0) -
                        nextScrollTop
                    ) > 2
                ) {
                    tableManager.setAttributeTableState({
                        scrollTop: nextScrollTop,
                    });
                }
            });
        };

        node.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            node.removeEventListener("scroll", onScroll);
            if (scrollRafRef.current !== null) {
                cancelAnimationFrame(scrollRafRef.current);
            }
        };
    }, [tableManager]);

    useEffect(() => {
        const unsubscribe = tableManager.subscribeSelection((keys) => {
            setSelectedRowKeys(new Set(keys));
        });

        return unsubscribe;
    }, [tableManager]);

    useEffect(() => {
        if (!tableManager.subscribeFieldSelection) return;

        const unsubscribe = tableManager.subscribeFieldSelection(
            ({
                 visibleColumnIds,
             }: {
                visibleColumnIds: string[] | null;
                isFieldSelectorOpen: boolean;
            }) => {
                setCurrentVisibleColumnIds(visibleColumnIds ?? null);
            }
        );

        return unsubscribe;
    }, [tableManager]);

    useEffect(() => {
        restoredScrollRef.current = false;
    }, [columns.length, rows.length]);

    const getRowKey = (row: Row) => tableManager.getRowPKKey(row, pkCols);

    const visibleColumns = useMemo(() => {
        const hiddenCols = new Set(["geom", "geometry", "the_geom", "shape"]);

        const filtered = columns.filter((col) => !hiddenCols.has(col.id));

        if (!currentVisibleColumnIds || currentVisibleColumnIds.length === 0) {
            return filtered;
        }

        const visibleSet = new Set(currentVisibleColumnIds);
        return filtered.filter((col) => visibleSet.has(col.id));
    }, [columns, currentVisibleColumnIds]);

    const dateColumns = useMemo(() => {
        const dateColumns = visibleColumns.filter((col) => col.type === "date");
        // console.log("all columns", visibleColumns, "date columns", dateColumns);
        return dateColumns;
    }, [visibleColumns]);

    const processedRows = useMemo(() => {
        let result = [...rows];

        if (searchText.trim()) {
            const lowerSearch = searchText.toLowerCase();

            result = result.filter((row) =>
                visibleColumns.some((col) => {
                    const value = row[col.id];
                    return String(value ?? "")
                        .toLowerCase()
                        .includes(lowerSearch);
                })
            );
        }

        if (dateFilter.columnId && (dateFilter.from || dateFilter.to)) {
            const fromTime = dateFilter.from
                ? new Date(dateFilter.from).setHours(0, 0, 0, 0)
                : Number.NEGATIVE_INFINITY;

            const toTime = dateFilter.to
                ? new Date(dateFilter.to).setHours(23, 59, 59, 999)
                : Number.POSITIVE_INFINITY;

            result = result.filter((row) => {
                const value = row[dateFilter.columnId];
                if (!value) return false;

                const rowTime = new Date(value).getTime();
                if (Number.isNaN(rowTime)) return false;

                return rowTime >= fromTime && rowTime <= toTime;
            });
        }

        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === bVal) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                const modifier = sortConfig.direction === "asc" ? 1 : -1;

                if (typeof aVal === "number" && typeof bVal === "number") {
                    return (aVal - bVal) * modifier;
                }

                return (
                    String(aVal).localeCompare(String(bVal), undefined, {
                        numeric: true,
                        sensitivity: "base",
                    }) * modifier
                );
            });
        }

        return result;
    }, [rows, visibleColumns, searchText, sortConfig, dateFilter]);

    const totalRows = processedRows.length;

    const visibleStartIndex = Math.max(
        0,
        Math.floor(virtualScrollTop / ROW_HEIGHT) - OVERSCAN_COUNT
    );

    const visibleEndIndex = Math.min(
        totalRows,
        Math.ceil((virtualScrollTop + containerHeight) / ROW_HEIGHT) +
        OVERSCAN_COUNT
    );

    const virtualRows = processedRows.slice(visibleStartIndex, visibleEndIndex);

    const topSpacerHeight = visibleStartIndex * ROW_HEIGHT;
    const bottomSpacerHeight =
        Math.max(0, totalRows - visibleEndIndex) * ROW_HEIGHT;

    const isSelected = (row: Row) => selectedRowKeys.has(getRowKey(row));

    const handleRequestSort = (property: string) => {
        const isAsc =
            sortConfig?.key === property && sortConfig.direction === "asc";

        setSortConfig({
            key: property,
            direction: isAsc ? "desc" : "asc",
        });
    };

    const handleToggleRowSelection = async (row: Row) => {
        await tableManager.toggleRowSelectionAndFeature(row, pkCols);
    };

    const handleRowClick = async (row: Row) => {
        await tableManager.toggleRowSelectionAndFeature(row, pkCols);
    };

    const handleRowDoubleClick = async () => {
        mapVM.getBottomDrawerRef().current?.hideDrawer();
        tableManager.zoomToSelection();
    };

    const handleStartEdit = (row: Row) => {
        const rowKey = getRowKey(row);
        setEditingRowKey(rowKey);
        setTempRowData({ ...row });
    };

    const handleCancelEdit = () => {
        setEditingRowKey(null);
        setTempRowData(null);
    };

    const handleSaveRow = async (originalRow: Row) => {
        if (!tempRowData) return;

        const changed = await tableManager.saveRow(
            originalRow,
            tempRowData,
            columns,
            pkCols
        );

        if (changed) {
            setEditingRowKey(null);
            setTempRowData(null);
        }
    };

    const handleDeleteRow = async (row: Row) => {
        const ok = await window.customConfirm(
            "Do you want to delete the selected feature?",
            "Delete"
        );

        if (!ok) return;

        const success = await tableManager.deleteRow(row, pkCols);
        if (success && editingRowKey === getRowKey(row)) {
            setEditingRowKey(null);
            setTempRowData(null);
        }
    };

    const handleEditCellChange = (
        columnId: string,
        value: string | number | null
    ) => {
        if (!tempRowData) return;

        setTempRowData({
            ...tempRowData,
            [columnId]: value,
        });
    };


    const headerBg =
        theme.palette.mode === "dark"
            ? "#1e1e1e"
            : lighten(theme.palette.background.paper, 0.05);

    const headCellStyle = {
        backgroundColor: headerBg,
        fontWeight: 900,
        fontSize: "0.75rem",
        color: theme.palette.text.primary,
        top: 0,
        zIndex: 20,
        borderBottom: `1px solid ${theme.palette.divider}`,
        whiteSpace: "nowrap" as const,
        padding: "4px 8px",
        height: ROW_HEIGHT,
        boxSizing: "border-box" as const,
    } as const;

    const rowCellStyle = {
        padding: "2px 8px",
        height: ROW_HEIGHT,
        boxSizing: "border-box" as const,
        fontSize: "0.85rem",
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        whiteSpace: "nowrap" as const,
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "180px",
    } as const;

    const stickyHeaderLeftStyle = (left: number) => ({
        position: "sticky" as const,
        left,
        top: 0,
        zIndex: 30,
        backgroundColor: headerBg,
    });

    const stickyBodyLeftStyle = (left: number, selected = false) => ({
        position: "sticky" as const,
        left,
        zIndex: 10,
        backgroundColor: selected
            ? alpha(theme.palette.primary.main, 0.08)
            : theme.palette.background.paper,
    });

    const renderCellValue = (
        row: Row,
        col: Column,
        isEditingRow: boolean
    ) => {
        const isPk = pkCols.includes(col.id);
        const value = isEditingRow ? tempRowData?.[col.id] : row[col.id];

        if (isEditingRow && !isPk) {
            return (
                <TextField
                    fullWidth
                    size="small"
                    variant="standard"
                    value={value ?? ""}
                    type={col.type === "number" ? "number" : "text"}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        const rawValue = e.target.value;
                        let nextValue: string | number | null = rawValue;

                        if (col.type === "number") {
                            nextValue =
                                rawValue === "" ? null : Number(rawValue);
                        }

                        handleEditCellChange(col.id, nextValue);
                    }}
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            fontSize: "0.85rem",
                            px: 0.5,
                            py: 0.25,
                            backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.06
                            ),
                            borderRadius: 0.5,
                        },
                    }}
                />
            );
        }

        const displayValue = formatAttributeCellDisplay(col, value);
        const imageUrl = getImageCellUrl(col.id, value);
        const thumbnailUrl = getImageCellThumbnailUrl(col.id, value, {
            width: 144,
            height: 88,
        });

        if (imageUrl && thumbnailUrl) {
            return (
                <AttributeTablePhotoCell
                    label={col.label}
                    thumbnailUrl={thumbnailUrl}
                    imageUrl={imageUrl}
                    onPreview={handlePhotoPreview}
                />
            );
        }

        return (
            <Tooltip title={displayValue} arrow>
                <span>{displayValue}</span>
            </Tooltip>
        );
    };

    const totalColumnCount =
        visibleColumns.length + 1 + (isEditingAllowed ? 1 : 0);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {/*<AttributeTableToolbar*/}
            {/*    ref={mapVM.getAttributeTableToolbarRef()}*/}
            {/*    exportColumns={visibleColumns}*/}
            {/*    exportRows={processedRows}*/}
            {/*    searchText={searchText}*/}
            {/*    onSearchTextChange={setSearchText}*/}
            {/*    rowsCount={processedRows.length}*/}
            {/*    sx={{*/}
            {/*        backgroundColor: theme.palette.secondary.main,*/}
            {/*        color: "white",*/}
            {/*    }}*/}
            {/*/>*/}

            <AttributeTableToolbar
                ref={mapVM.getAttributeTableToolbarRef()}
                onExport={() =>
                    tableManager.exportCsv(visibleColumns, processedRows)
                }
                searchText={searchText}
                onSearchTextChange={setSearchText}
                rowsCount={processedRows.length}
                dateColumns={dateColumns}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                sx={{
                    backgroundColor: theme.palette.secondary.main,
                    color: "white",
                }}
            />

            <TableContainer
                ref={containerRef}
                component={Paper}
                elevation={0}
                sx={{
                    flex: 1,
                    overflow: "auto",
                    borderRadius: 0,
                }}
            >
                <Table
                    size="small"
                    stickyHeader
                    sx={{ borderCollapse: "separate", borderSpacing: 0 }}
                >
                    <TableHead
                        sx={{
                            boxShadow: headerRaised
                                ? "0 2px 4px rgba(0,0,0,0.1)"
                                : "none",
                        }}
                    >
                        <TableRow>
                            <TableCell
                                padding="checkbox"
                                sx={{
                                    ...headCellStyle,
                                    width: 52,
                                    minWidth: 52,
                                    ...stickyHeaderLeftStyle(0),
                                }}
                            >
                                <Checkbox size="small" disabled />
                            </TableCell>

                            {isEditingAllowed && (
                                <TableCell
                                    sx={{
                                        ...headCellStyle,
                                        width: 88,
                                        minWidth: 88,
                                        ...stickyHeaderLeftStyle(52),
                                    }}
                                >
                                    Actions
                                </TableCell>
                            )}

                            {visibleColumns.map((col) => (
                                <TableCell
                                    key={col.id}
                                    sx={headCellStyle}
                                    sortDirection={
                                        sortConfig?.key === col.id
                                            ? sortConfig.direction
                                            : false
                                    }
                                >
                                    <TableSortLabel
                                        active={sortConfig?.key === col.id}
                                        direction={
                                            sortConfig?.key === col.id
                                                ? sortConfig.direction
                                                : "asc"
                                        }
                                        onClick={() => handleRequestSort(col.id)}
                                    >
                                        {col.label}
                                        {sortConfig?.key === col.id ? (
                                            <Box
                                                component="span"
                                                sx={visuallyHidden}
                                            >
                                                {sortConfig.direction === "desc"
                                                    ? "sorted descending"
                                                    : "sorted ascending"}
                                            </Box>
                                        ) : null}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {totalRows === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={totalColumnCount}
                                    align="center"
                                    sx={{
                                        py: 3,
                                        color: theme.palette.text.secondary,
                                    }}
                                >
                                    No records found
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {topSpacerHeight > 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={totalColumnCount}
                                            sx={{
                                                p: 0,
                                                border: 0,
                                                height: `${topSpacerHeight}px`,
                                                backgroundColor: "transparent",
                                            }}
                                        />
                                    </TableRow>
                                )}

                                {virtualRows.map((row, localIndex) => {
                                    const absoluteIndex =
                                        visibleStartIndex + localIndex;
                                    const rowKey =
                                        getRowKey(row) ||
                                        String((row as any).rowId) ||
                                        `idx-${absoluteIndex}`;

                                    const selected = isSelected(row);
                                    const isEditingRow =
                                        editingRowKey === rowKey;

                                    return (
                                        <TableRow
                                            key={rowKey}
                                            hover
                                            selected={selected}
                                            onClick={() => handleRowClick(row)}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                handleRowDoubleClick();
                                            }}
                                            sx={{
                                                cursor: "pointer",
                                                height: `${ROW_HEIGHT}px`,
                                                backgroundColor: selected
                                                    ? alpha(
                                                        theme.palette.primary
                                                            .main,
                                                        0.08
                                                    )
                                                    : "inherit",
                                            }}
                                        >
                                            <TableCell
                                                padding="checkbox"
                                                sx={{
                                                    ...rowCellStyle,
                                                    width: 52,
                                                    minWidth: 52,
                                                    ...stickyBodyLeftStyle(
                                                        0,
                                                        selected
                                                    ),
                                                }}
                                            >
                                                <Checkbox
                                                    size="small"
                                                    checked={selected}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    onChange={() =>
                                                        handleToggleRowSelection(
                                                            row
                                                        )
                                                    }
                                                />
                                            </TableCell>

                                            {isEditingAllowed && (
                                                <TableCell
                                                    sx={{
                                                        ...rowCellStyle,
                                                        width: 88,
                                                        minWidth: 88,
                                                        ...stickyBodyLeftStyle(
                                                            52,
                                                            selected
                                                        ),
                                                    }}
                                                >
                                                    {isEditingRow ? (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                gap: 0.5,
                                                            }}
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSaveRow(
                                                                        row
                                                                    );
                                                                }}
                                                            >
                                                                <SaveIcon fontSize="inherit" />
                                                            </IconButton>

                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancelEdit();
                                                                }}
                                                            >
                                                                <CloseIcon fontSize="inherit" />
                                                            </IconButton>
                                                        </Box>
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                gap: 0.5,
                                                            }}
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStartEdit(
                                                                        row
                                                                    );
                                                                }}
                                                            >
                                                                <EditIcon fontSize="inherit" />
                                                            </IconButton>

                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteRow(
                                                                        row
                                                                    );
                                                                }}
                                                            >
                                                                <DeleteOutlineIcon fontSize="inherit" />
                                                            </IconButton>
                                                        </Box>
                                                    )}
                                                </TableCell>
                                            )}

                                            {visibleColumns.map((col) => (
                                                <TableCell
                                                    key={`${rowKey}-${col.id}`}
                                                    sx={rowCellStyle}
                                                >
                                                    {renderCellValue(
                                                        row,
                                                        col,
                                                        isEditingRow
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })}

                                {bottomSpacerHeight > 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={totalColumnCount}
                                            sx={{
                                                p: 0,
                                                border: 0,
                                                height: `${bottomSpacerHeight}px`,
                                                backgroundColor: "transparent",
                                            }}
                                        />
                                    </TableRow>
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <AttributeTableImagePreview
                preview={imagePreview}
                onClose={() => setImagePreview(null)}
            />
        </Box>
    );
};

export default AttributeTable;