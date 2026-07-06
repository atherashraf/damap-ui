import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Toolbar,
    ToolbarProps,
    IconButton,
    Tooltip,
    TextField,
    Typography,
    Button,
    Menu,
    MenuItem, Box,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useMapVM } from "@/libs/damap";
import AttributeBulkAssignForm from "@damap/components/map/table/forms/AttributeBulkAssignForm";
import EditAttributesIcon from "@mui/icons-material/EditNote";
import AttributeDateFilterButton from "@damap/components/map/table/AttributeDateFilterButton";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import MapIcon from "@mui/icons-material/Map";

export type ToolbarSlot = "start" | "end";

export type ToolbarEntry = {
    id?: string;
    node: React.ReactNode;
    slot?: ToolbarSlot;
    order?: number;
};

type InternalEntry = Required<ToolbarEntry>;

export type AttributeTableToolbarHandle = {
    addAction: (entry: ToolbarEntry) => string;
    removeAction: (id: string) => void;
    clear: (slot?: ToolbarSlot) => void;
};

export type DateFilterState = {
    columnId: string;
    from: string;
    to: string;
};

export type AttributeTableToolbarProps = Omit<ToolbarProps, "ref"> & {
    onExport: () => void;
    onPivot?: () => void;
    searchText: string;
    onSearchTextChange: (val: string) => void;
    rowsCount: number;
    iconColor?: string;

    dateColumns?: {
        id: string;
        label: string;
    }[];

    dateFilter?: DateFilterState;
    onDateFilterChange?: (filter: DateFilterState) => void;
};

function sortByOrder(a: InternalEntry, b: InternalEntry) {
    return a.order - b.order;
}

export const AttributeTableToolbar = forwardRef<
    AttributeTableToolbarHandle,
    AttributeTableToolbarProps
>(function AttributeTableToolbar(
    {
        onExport,
        searchText,
        onSearchTextChange,
        rowsCount,
        iconColor,
        children,
        dateColumns = [],
        dateFilter,
        onDateFilterChange,
        ...toolbarProps
    },
    ref
) {
    const mapVM = useMapVM();
    const tableManager = mapVM.getAttributeTableManager();
    const isEditingAllowed = mapVM.dmlManager.isEditingAllowed;

    const [actions, setActions] = useState<Record<ToolbarSlot, InternalEntry[]>>({
        start: [],
        end: [],
    });

    const [selectedCount, setSelectedCount] = useState(0);
    const [hasSelection, setHasSelection] = useState(false);
    const [fieldsMenuAnchor, setFieldsMenuAnchor] =
        useState<null | HTMLElement>(null);

    const isFieldsMenuOpen = Boolean(fieldsMenuAnchor);

    const uid = useRef(0);
    const nextId = () => `att-toolbar-${++uid.current}`;

    useImperativeHandle(
        ref,
        () => ({
            addAction(entry: ToolbarEntry) {
                const id = entry.id ?? nextId();
                const slot: ToolbarSlot = entry.slot ?? "start";

                const newEntry: InternalEntry = {
                    id,
                    slot,
                    order: entry.order ?? 0,
                    node: entry.node,
                };

                setActions((prev) => {
                    const updated = { ...prev };
                    updated[slot] = [...updated[slot], newEntry].sort(sortByOrder);
                    return updated;
                });

                return id;
            },

            removeAction(id: string) {
                setActions((prev) => ({
                    start: prev.start.filter((e) => e.id !== id),
                    end: prev.end.filter((e) => e.id !== id),
                }));
            },

            clear(slot?: ToolbarSlot) {
                setActions((prev) =>
                    slot ? { ...prev, [slot]: [] } : { start: [], end: [] }
                );
            },
        }),
        []
    );

    useEffect(() => {
        return tableManager.subscribeSelection((keys) => {
            setHasSelection(keys.length > 0);
            setSelectedCount(keys.length);
        });
    }, [tableManager]);

    const start = useMemo(
        () => actions.start.slice().sort(sortByOrder),
        [actions.start]
    );

    const end = useMemo(
        () => actions.end.slice().sort(sortByOrder),
        [actions.end]
    );

    const resolvedColor = iconColor ?? (toolbarProps as any)?.sx?.color;

    useEffect(() => {
        return tableManager.subscribeSelection((keys) => {
            setHasSelection(keys.length > 0);
        });
    }, [tableManager]);

    const openBulkAssign = async () => {
        const selectedRows = tableManager.getSelectedRows();

        const ok = await window.customConfirm(
            `Apply changes to ${selectedRows.length} selected row(s)?`,
            "Bulk Assign"
        );

        if (!ok) return;

        mapVM.getDialogBoxRef().current?.openDialog({
            title: "Assign value to selected rows",
            content: <AttributeBulkAssignForm />,
            isFullWidth: true,
        });
    };

    const handleOpenFieldsMenu = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setFieldsMenuAnchor(event.currentTarget);
    };

    const handleCloseFieldsMenu = () => {
        setFieldsMenuAnchor(null);
    };

    const handleShowLimitedFields = () => {
        handleCloseFieldsMenu();
        tableManager.openFieldSelectorDialog();
    };

    const handleShowAllFields = () => {
        handleCloseFieldsMenu();
        tableManager.showAllColumns();
    };


    return (
        <Toolbar
            variant="dense"
            {...toolbarProps}
            sx={{
                gap: 1,
                px: 1,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                overflowX: "auto",
                whiteSpace: "nowrap",
                ...(toolbarProps.sx as any),
            }}
        >
            {/* Left tools */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <Tooltip title="Refresh Data" arrow>
                    <IconButton size="small" onClick={() => tableManager.refresh()}>
                        <RefreshIcon sx={{ color: resolvedColor }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Zoom to Selection" arrow>
                    <IconButton size="small" onClick={() => tableManager.zoomToSelection()}>
                        <ZoomInIcon sx={{ color: resolvedColor }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Clear Selection" arrow>
                    <IconButton size="small" onClick={() => tableManager.clearSelection()}>
                        <CloseIcon sx={{ color: resolvedColor }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Export to CSV" arrow>
                    <IconButton size="small" onClick={onExport}>
                        <FileDownloadIcon sx={{ color: resolvedColor }} />
                    </IconButton>
                </Tooltip>

                {isEditingAllowed && (
                    <Tooltip
                        title={
                            hasSelection
                                ? `Bulk Assign (${tableManager.getSelectedRows().length})`
                                : "Select rows first"
                        }
                        arrow
                    >
                    <span style={{ display: "inline-flex" }}>
                        <IconButton
                            size="small"
                            disabled={!hasSelection}
                            onClick={openBulkAssign}
                        >
                            <EditAttributesIcon sx={{ color: resolvedColor }} />
                        </IconButton>
                    </span>
                    </Tooltip>
                )}
                {isEditingAllowed && (
                    <>
                        <Tooltip
                            title={
                                selectedCount === 1
                                    ? "Upload Geometry"
                                    : "Select one row to upload geometry"
                            }
                            arrow
                        >
                            <span style={{ display: "inline-flex" }}>
                                <IconButton
                                    size="small"
                                    disabled={selectedCount !== 1}
                                    onClick={() => tableManager.openUploadGeometryDrawer()}
                                >
                                    <FileUploadIcon sx={{ color: resolvedColor }} />
                                </IconButton>
                            </span>
                        </Tooltip>

                        <Tooltip
                            title={
                                selectedCount > 0
                                    ? `Download Geometry (${selectedCount})`
                                    : "Select row(s) to download geometry"
                            }
                            arrow
                        >
                            <span style={{ display: "inline-flex" }}>
                                <IconButton
                                    size="small"
                                    disabled={selectedCount === 0}
                                    onClick={() => tableManager.downloadSelectedGeometries()}
                                >
                                    <MapIcon sx={{ color: resolvedColor }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </>
                )}
            </Box>

            {/* Dynamic start actions */}
            {start.length > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {start.map((e) => (
                        <Box key={e.id} component="span" sx={{ display: "inline-flex" }}>
                            {e.node}
                        </Box>
                    ))}
                </Box>
            )}

            <Box sx={{ flex: 1, minWidth: 8 }} />

            {/* Dynamic end actions */}
            {end.length > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {end.map((e) => (
                        <Box key={e.id} component="span" sx={{ display: "inline-flex" }}>
                            {e.node}
                        </Box>
                    ))}
                </Box>
            )}

            {/* Right controls */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                }}
            >
                {dateColumns.length > 0 && dateFilter && onDateFilterChange && (
                    <AttributeDateFilterButton
                        dateColumns={dateColumns}
                        dateFilter={dateFilter}
                        onDateFilterChange={onDateFilterChange}
                    />
                )}

                <TextField
                    size="small"
                    placeholder="Search features..."
                    variant="outlined"
                    value={searchText}
                    onChange={(e) => onSearchTextChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon
                                    fontSize="small"
                                    sx={{ color: "rgba(255,255,255,0.7)" }}
                                />
                            </InputAdornment>
                        ),
                        endAdornment: searchText ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => onSearchTextChange("")}
                                >
                                    <ClearIcon
                                        fontSize="small"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    />
                                </IconButton>
                            </InputAdornment>
                        ) : undefined,
                        sx: {
                            color: "white",
                            fontSize: "0.85rem",
                            backgroundColor: "rgba(255,255,255,0.15)",
                            borderRadius: 1,
                            "& .MuiOutlinedInput-notchedOutline": {
                                border: "none",
                            },
                            "& input": {
                                color: "white",
                                py: 0.5,
                            },
                        },
                    }}
                    sx={{
                        width: { xs: 170, sm: 220, md: 250 },
                        flexShrink: 0,
                    }}
                />

                <Button
                    size="small"
                    variant="outlined"
                    onClick={handleOpenFieldsMenu}
                    endIcon={<ArrowDropDownIcon />}
                    sx={{
                        color: "white",
                        borderColor: "rgba(255,255,255,0.5)",
                        flexShrink: 0,
                        "&:hover": {
                            borderColor: "white",
                            backgroundColor: "rgba(255,255,255,0.08)",
                        },
                    }}
                >
                    Fields
                </Button>

                <Typography
                    variant="subtitle2"
                    sx={{
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        opacity: 0.95,
                    }}
                >
                    Rows: {rowsCount}
                </Typography>
            </Box>

            <Menu
                anchorEl={fieldsMenuAnchor}
                open={isFieldsMenuOpen}
                onClose={handleCloseFieldsMenu}
            >
                <MenuItem onClick={handleShowLimitedFields}>
                    Show Limited Fields
                </MenuItem>

                <MenuItem onClick={handleShowAllFields}>
                    Show All Fields
                </MenuItem>
            </Menu>

            {children}
        </Toolbar>
    );
});

// export default AttributeTableToolbar;