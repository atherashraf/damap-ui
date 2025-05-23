/**
 * ChangeListToolbar
 * -----------------
 *
 * A reusable toolbar for ChangeList with:
 * - Plain Buttons with optional icons
 * - Simple separators between buttons
 * - Dynamic Actions dropdown (MUI Select)
 * - Go button with loading (MUI LoadingButton)
 * - Supports addButton() and addAction() via ref
 *
 * Usage:
 *
 * import ChangeListToolbar, { IToolbarButton, Action } from './ChangeListToolbar';
 *
 * const toolbarRef = React.useRef<any>(null);
 *
 * <ChangeListToolbar
 *   ref={toolbarRef}
 *   parent={{ startEditing: () => { ... } }}
 *   buttons={toolbarButtons}
 *   actions={actions}
 * />
 *
 * toolbarRef.current?.addButton([{ id: 'refresh', title: 'Refresh', onClick: () => {...} }]);
 * toolbarRef.current?.addAction([{ name: 'Export CSV', action: () => {...} }]);
 */

import { useState, forwardRef, useImperativeHandle } from "react";
import {AppBar, Toolbar, Tooltip, Button, Select, MenuItem, Box, TextField} from "@mui/material";
// import EditIcon from "@mui/icons-material/Edit";

export interface Action {
    name: string;
    action: () => Promise<void> | void;
}

export interface IToolbarButton {
    id: string;
    title?: string;
    onClick?: (e?: any) => void;
    imgSrc?: any;
    type?: "button" | "separator"; // default is "button"
}

interface IChangeListParent {
    startEditing: () => void;
}

interface IProps {
    parent: IChangeListParent | null;
    buttons: IToolbarButton[];
    actions: Action[];
    onSearchChange?: (text: string) => void; // <-- New
}

const ChangeListToolbar = forwardRef((props: IProps, ref) => {
    const [buttons, setButtons] = useState<IToolbarButton[]>([
        ...getBasicButtons(),
        ...props.buttons,
    ]);
    const [actions, setActions] = useState<Action[]>(props.actions);
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    function getBasicButtons(): IToolbarButton[] {
        return [
            // {
            //     id: "edit-button",
            //     title: "Edit",
            //     imgSrc: EditIcon,
            //     onClick: () => {
            //         props.parent?.startEditing();
            //     },
            // },
        ];
    }

    useImperativeHandle(ref, () => ({
        addButton: (newButtons: IToolbarButton[]) => {
            setButtons((prev) => [...prev, ...newButtons]);
        },
        addAction: (newActions: Action[]) => {
            setActions((prev) => {
                const updated = [...prev, ...newActions];
                if (updated.length === 1) {
                    setSelectedAction(updated[0]);
                } else if (updated.length === 0) {
                    setSelectedAction(null);
                }
                return updated;
            });
        },
    }));

    const handleActionClick = async () => {
        if (selectedAction) {
            try {
                setLoading(true);
                await selectedAction.action();
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <AppBar position="static" color="default" sx={{ mb: 1, boxShadow: 2 }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                {/* Left Buttons */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {buttons.map((btn) =>
                        btn.type !== "separator" ? (
                            <Tooltip title={btn.title || ""} key={btn.id}>
                                <Button
                                    onClick={btn.onClick}
                                    variant="contained"
                                    size="small"
                                    startIcon={btn.imgSrc ? <btn.imgSrc fontSize="small" /> : undefined}
                                    sx={{
                                        backgroundColor: "#333",
                                        "&:hover": { backgroundColor: "#444" },
                                    }}
                                >
                                    {btn.title}
                                </Button>
                            </Tooltip>
                        ) : (
                            <Box key={btn.id} width="10px" />
                        )
                    )}

                    {/* Search Field */}
                    <TextField
                        size="small"
                        placeholder="Search..."
                        variant="outlined"
                        value={searchText}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchText(value);
                            props.onSearchChange?.(value); // fire callback
                        }}
                        sx={{
                            minWidth: 200,
                            backgroundColor: '#fff',
                            borderRadius: 1,
                            '& input': { color: '#000' },
                        }}
                    />

                </Box>

                {/* Right Actions */}
                {actions.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Select
                            size="small"
                            value={selectedAction?.name || "-1"}
                            onChange={(e) => {
                                const action = actions.find((a) => a.name === e.target.value);
                                setSelectedAction(action || null);
                            }}
                            displayEmpty
                            sx={{
                                minWidth: 200,
                                backgroundColor: "#222",
                                color: "white",
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#666" },
                            }}
                        >
                            <MenuItem value="-1" disabled>
                                Select an action
                            </MenuItem>
                            {actions.map((action) => (
                                <MenuItem key={action.name} value={action.name}>
                                    {action.name}
                                </MenuItem>
                            ))}
                        </Select>

                        <Button
                            variant="contained"
                            size="small"
                            disabled={!selectedAction}
                            onClick={handleActionClick}
                            sx={{ backgroundColor: "#333", "&:hover": { backgroundColor: "#444" } }}
                        >
                            {loading ? "Loading..." : "Go"}
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
});

export default ChangeListToolbar;
