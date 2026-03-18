import React, {
    forwardRef, useImperativeHandle, useMemo, useRef, useState
} from "react";
import {
    Toolbar, ToolbarProps, IconButton, Tooltip, TextField, Typography
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import CloseIcon from "@mui/icons-material/Close";

import FileDownloadIcon from "@mui/icons-material/FileDownload";

export type ToolbarSlot = "start" | "end";
export type ToolbarEntry = {
    id?: string;
    node: React.ReactNode;
    slot?: ToolbarSlot;      // "start" (left) or "end" (right of spacer)
    order?: number;          // lower renders first
};

type InternalEntry = Required<ToolbarEntry>;

export type AttributeTableToolbarHandle = {
    addAction: (entry: ToolbarEntry) => string; // returns id
    removeAction: (id: string) => void;
    clear: (slot?: ToolbarSlot) => void;
};

export type AttributeTableToolbarProps = Omit<ToolbarProps, "ref"> & {
    // built-in button handlers (from AttributeTable)
    onZoom: () => void;
    onClear: () => void;
    onPivot: () => void;
    onExport: () => void;

    // search + meta
    searchText: string;
    onSearchTextChange: (val: string) => void;
    rowsCount: number;

    // color override (optional)
    iconColor?: string; // defaults to theme secondary.contrastText
};

function sortByOrder(a: InternalEntry, b: InternalEntry) {
    return a.order - b.order;
}

export const AttributeTableToolbar = forwardRef<
    AttributeTableToolbarHandle,
    AttributeTableToolbarProps
>(function AttributeTableToolbar(
    {
        onZoom, onClear, onPivot, onExport,
        searchText, onSearchTextChange, rowsCount,
        iconColor, children, ...toolbarProps
    },
    ref
) {
    const [actions, setActions] = useState<Record<ToolbarSlot, InternalEntry[]>>({
        start: [],
        end: [],
    });

    const uid = useRef(0);
    const nextId = () => `att-toolbar-${++uid.current}`;

    useImperativeHandle(ref, () => ({
        addAction(entry: ToolbarEntry) {
            const id = entry.id ?? nextId();
            const slot: ToolbarSlot = entry.slot ?? "start";
            const newEntry: InternalEntry = { id, slot, order: entry.order ?? 0, node: entry.node };
            setActions(prev => {
                const updated = { ...prev };
                updated[slot] = [...updated[slot], newEntry].sort(sortByOrder);
                return updated;
            });
            return id;
        },
        removeAction(id: string) {
            setActions(prev => ({
                start: prev.start.filter(e => e.id !== id),
                end:   prev.end.filter(e => e.id !== id),
            }));
        },
        clear(slot?: ToolbarSlot) {
            setActions(prev => (slot ? { ...prev, [slot]: [] } : { start: [], end: [] }));
        },
    }), []);

    const start = useMemo(() => actions.start.slice().sort(sortByOrder), [actions.start]);
    const end   = useMemo(() => actions.end.slice().sort(sortByOrder), [actions.end]);

    return (
        <Toolbar variant="dense" {...toolbarProps}>
            {/* Built-in buttons (moved from AttributeTable) */}
            <Tooltip title="Zoom to Selection" arrow>
                <IconButton size="small" onClick={onZoom}>
                    <ZoomInIcon sx={{ color: iconColor ?? (toolbarProps as any)?.sx?.color }} />
                </IconButton>
            </Tooltip>

            <Tooltip title="Clear Selection" arrow>
                <IconButton size="small" onClick={onClear}>
                    <CloseIcon sx={{ color: iconColor ?? (toolbarProps as any)?.sx?.color }} />
                </IconButton>
            </Tooltip>

            {/*<Tooltip title="Pivot Table" arrow>*/}
            {/*    <IconButton size="small" onClick={onPivot}>*/}
            {/*        <TableChartIcon sx={{ color: iconColor ?? (toolbarProps as any)?.sx?.color }} />*/}
            {/*    </IconButton>*/}
            {/*</Tooltip>*/}

            <Tooltip title="Export to CSV" arrow>
                <IconButton size="small" onClick={onExport}>
                    <FileDownloadIcon sx={{ color: iconColor ?? (toolbarProps as any)?.sx?.color }} />
                </IconButton>
            </Tooltip>

            {/* Start-slot injected actions */}
            {start.map(e => <span key={e.id}>{e.node}</span>)}

            <span style={{ flex: 1 }} />

            {/* End-slot injected actions */}
            {end.map(e => <span key={e.id}>{e.node}</span>)}

            {/* Search + rows count */}
            <TextField
                size="small"
                placeholder="Search…"
                variant="outlined"
                value={searchText}
                onChange={(e) => onSearchTextChange(e.target.value)}
                sx={{ minWidth: 200, mr: 1 }}
            />
            <Typography variant="subtitle2" sx={{ whiteSpace: "nowrap" }}>
                Rows: {rowsCount}
            </Typography>

            {/* Any extra children if you want (optional) */}
            {children}
        </Toolbar>
    );
});
