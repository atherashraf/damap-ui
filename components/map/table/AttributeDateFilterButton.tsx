import React, { useState } from "react";
import {
    Badge,
    Box,
    Button,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Popover,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearIcon from "@mui/icons-material/Clear";

export type DateFilterState = {
    columnId: string;
    from: string;
    to: string;
};

export type DateColumnOption = {
    id: string;
    label: string;
};

type AttributeDateFilterButtonProps = {
    dateColumns: DateColumnOption[];
    dateFilter: DateFilterState;
    onDateFilterChange: (filter: DateFilterState) => void;
};

export default function AttributeDateFilterButton({
                                                      dateColumns,
                                                      dateFilter,
                                                      onDateFilterChange,
                                                  }: AttributeDateFilterButtonProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const open = Boolean(anchorEl);

    const isActive =
        Boolean(dateFilter.columnId) ||
        Boolean(dateFilter.from) ||
        Boolean(dateFilter.to);

    const activeCount = [
        dateFilter.columnId,
        dateFilter.from,
        dateFilter.to,
    ].filter(Boolean).length;

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClear = () => {
        onDateFilterChange({
            columnId: "",
            from: "",
            to: "",
        });
    };

    return (
        <>
            <Badge
                color="warning"
                badgeContent={activeCount}
                invisible={!isActive}
                sx={{ ml: 1 }}
            >
                <Button
                    size="small"
                    variant={isActive ? "contained" : "outlined"}
                    startIcon={<FilterAltIcon />}
                    onClick={handleOpen}
                    sx={{
                        minWidth: 112,
                        color: isActive ? "primary.contrastText" : "white",
                        borderColor: "rgba(255,255,255,0.5)",
                        whiteSpace: "nowrap",
                        "&:hover": {
                            borderColor: "white",
                            backgroundColor: isActive
                                ? undefined
                                : "rgba(255,255,255,0.08)",
                        },
                    }}
                >
                    Date
                </Button>
            </Badge>

            {isActive && (
                <Tooltip title="Clear date filter" arrow>
                    <IconButton size="small" onClick={handleClear} sx={{ ml: 0.5 }}>
                        <ClearIcon fontSize="small" sx={{ color: "white" }} />
                    </IconButton>
                </Tooltip>
            )}

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        width: 280,
                        borderRadius: 2,
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Date Filter
                        </Typography>

                        <FormControl size="small" fullWidth>
                            <InputLabel>Date Field</InputLabel>
                            <Select
                                label="Date Field"
                                value={dateFilter.columnId}
                                onChange={(e) =>
                                    onDateFilterChange({
                                        ...dateFilter,
                                        columnId: String(e.target.value),
                                    })
                                }
                            >
                                <MenuItem value="">None</MenuItem>

                                {dateColumns.map((col) => (
                                    <MenuItem key={col.id} value={col.id}>
                                        {col.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            type="date"
                            label="From"
                            value={dateFilter.from}
                            InputLabelProps={{ shrink: true }}
                            onChange={(e) =>
                                onDateFilterChange({
                                    ...dateFilter,
                                    from: e.target.value,
                                })
                            }
                            fullWidth
                        />

                        <TextField
                            size="small"
                            type="date"
                            label="To"
                            value={dateFilter.to}
                            InputLabelProps={{ shrink: true }}
                            onChange={(e) =>
                                onDateFilterChange({
                                    ...dateFilter,
                                    to: e.target.value,
                                })
                            }
                            fullWidth
                        />

                        <Divider />

                        <Stack direction="row" justifyContent="space-between">
                            <Button
                                size="small"
                                color="inherit"
                                onClick={handleClear}
                                disabled={!isActive}
                            >
                                Clear
                            </Button>

                            <Button
                                size="small"
                                variant="contained"
                                onClick={handleClose}
                            >
                                Done
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Popover>
        </>
    );
}