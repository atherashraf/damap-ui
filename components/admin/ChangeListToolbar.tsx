/**
 * ChangeListToolbar
 * ------------------
 * A reusable toolbar component designed for use with the `ChangeList` table.
 * Supports declarative toolbar buttons, row-based actions, and table search.
 *
 * ✅ Features
 * -----------
 * - Custom toolbar buttons (Add, Refresh, Export, etc.)
 * - Action dropdown menu using MUI Menu
 * - Optional row-dependent actions (`requiresSelection`)
 * - Supports actions even when no data exists (`visibleWhenEmpty`)
 * - Built-in search with callback to parent
 * - Keyboard focus support (`focusSearch()` using ref)
 * - Clean buttons layout with optional separators
 *
 * ✅ Props
 * --------
 * | Prop            | Type                  | Description |
 * |-----------------|----------------------|-------------|
 * | buttons         | IToolbarButton[]     | Toolbar buttons |
 * | actions         | Action[]             | Dropdown actions |
 * | parent          | { startEditing() }   | Optional parent API hooks |
 * | hasSelection    | boolean              | Enables/disables row actions |
 * | onSearchChange  | (text: string)       | Search input callback |
 *
 * ✅ Action Object
 * ----------------
 * ```
 * {
 *   name: string;
 *   action: () => void;
 *   requiresSelection?: boolean;   // Disable action until row selected
 *   visibleWhenEmpty?: boolean;    // Show even if table has no rows
 * }
 * ```
 *
 * ✅ Toolbar Button Object
 * ------------------------
 * ```
 * {
 *   label: string;
 *   onClick: () => void;
 *   disabled?: boolean;
 *   tooltip?: string;
 * }
 * ```
 *
 * ✅ Ref Methods
 * --------------
 * | Method           | Description |
 * |------------------|-------------|
 * | focusSearch()    | Focuses the search input field |
 *
 * ✅ Usage
 * --------
 * ```tsx
 * const toolbarRef = useRef<ChangeListToolbarHandle>(null);
 *
 * <ChangeListToolbar
 *   ref={toolbarRef}
 *   buttons={[
 *     { label: "Refresh", onClick: handleRefresh },
 *   ]}
 *   actions={[
 *     { name: "Delete", action: handleDelete, requiresSelection: true },
 *     { name: "Add Layer", action: handleAdd, visibleWhenEmpty: true },
 *   ]}
 *   hasSelection={selectedRow !== null}
 *   onSearchChange={(s) => setSearchFilter(s)}
 * />
 *
 * toolbarRef.current?.focusSearch();
 * ```
 *
 * ✅ Notes
 * --------
 * - Use `requiresSelection` on actions like **Delete**, **Edit**, **View Details**
 * - Use `visibleWhenEmpty` on actions like **Add**, **Import**
 * - Designed to integrate seamlessly with `ChangeList`
 */


import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
    Toolbar,
    Box,
    TextField,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    Button,
    Divider,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

export interface IToolbarButton {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    tooltip?: string;
}

export type Action = {
    name: string;
    action: () => void;
    requiresSelection?: boolean;  // disables when no row selected
    visibleWhenEmpty?: boolean;   // keep visible even if no data
};

type ParentApi = {
    startEditing?: () => void;
};

type Props = {
    parent?: ParentApi;
    onSearchChange?: (text: string) => void;
    actions?: Action[];
    buttons?: IToolbarButton[];
    hasSelection?: boolean; // supplied by ChangeList
};

export interface ChangeListToolbarHandle {
    focusSearch: () => void;
}

const ChangeListToolbar = forwardRef<ChangeListToolbarHandle, Props>((props, ref) => {
    const {
        parent,
        onSearchChange,
        actions = [],
        buttons = [],
        hasSelection = false,
    } = props;

    const [search, setSearch] = useState("");
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focusSearch: () => searchRef.current?.focus(),
    }));

    const visibleActions = useMemo(
        () => actions.filter((a) => a.visibleWhenEmpty ?? true),
        [actions]
    );

    const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
    const handleCloseMenu = () => setMenuAnchor(null);

    const handleSearch = (value: string) => {
        setSearch(value);
        onSearchChange?.(value);
    };

    return (
        <Toolbar
            // color={"secondary"}
            sx={{
                display: "flex",
                gap: 1,
                py: 1,
                minHeight: 56,
            }}
        >
            {/* Start editing (optional) */}
            {parent?.startEditing && (
                <Tooltip title="Start editing first row">
          <span>
            <IconButton color="primary" onClick={parent.startEditing}>
              <EditIcon />
            </IconButton>
          </span>
                </Tooltip>
            )}

            {/* Custom buttons */}
            {buttons.map((b) => (
                <Tooltip key={b.label} title={b.tooltip ?? ""}>
          <span>
            <Button variant="outlined" size="small" disabled={b.disabled} onClick={b.onClick}>
              {b.label}
            </Button>
          </span>
                </Tooltip>
            ))}

            {/* Actions menu */}
            {visibleActions.length > 0 && (
                <>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleOpenMenu}
                        endIcon={<MoreVertIcon />}
                    >
                        Actions
                    </Button>
                    <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={handleCloseMenu}>
                        {visibleActions.map((a) => {
                            const disabled = !!a.requiresSelection && !hasSelection;
                            return (
                                <MenuItem
                                    key={a.name}
                                    disabled={disabled}
                                    onClick={() => {
                                        if (!disabled) a.action();
                                        handleCloseMenu();
                                    }}
                                >
                                    {a.name}
                                </MenuItem>
                            );
                        })}
                    </Menu>
                </>
            )}

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Search */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SearchIcon fontSize="small" />
                <TextField
                    inputRef={searchRef}
                    size="small"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </Box>
        </Toolbar>
    );
});

export default ChangeListToolbar;
