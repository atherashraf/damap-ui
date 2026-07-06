import * as React from "react";
import {
    Box,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Tooltip,
    Typography,
    alpha,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {LayerItem} from "./types";

interface BaseMapSelectProps {
    baseLayers: LayerItem[];
    selectedBaseLayer: LayerItem | null;
    onSelectBaseLayer: (layerId: string) => void;
}

const BaseMapSelect = ({
                           baseLayers,
                           selectedBaseLayer,
                           onSelectBaseLayer,
                       }: BaseMapSelectProps): React.ReactElement => {
    const [open, setOpen] = React.useState(false);
    const [menuPosition, setMenuPosition] = React.useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);
    const menuRef = React.useRef<HTMLDivElement | null>(null);

    // Sorting to ensure "Empty Map" is always at the bottom if it exists
    const sortedBaseLayers = React.useMemo(() => {
        return [...baseLayers].sort((a, b) => {
            if (a.title === "Empty Map") return 1;
            if (b.title === "Empty Map") return -1;
            return 0;
        });
    }, [baseLayers]);

    const openMenu = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        const dropdownHeight = 300; // same as maxHeight
        const dropdownWidth = Math.max(rect.width, 240);

        // 👉 Vertical positioning (FIX)
        let top = rect.bottom + 4;

        if (top + dropdownHeight > viewportHeight - 8) {
            // Not enough space → open upward
            top = rect.top - dropdownHeight - 4;
        }

        // 👉 Horizontal positioning (already mentioned earlier)
        let left = rect.left;
        if (left + dropdownWidth > viewportWidth - 8) {
            left = viewportWidth - dropdownWidth - 8;
        }

        setMenuPosition({
            top,
            left,
            width: rect.width,
        });

        setOpen(true);
    };
    const openMenuFromKeyboard = (event: React.KeyboardEvent<HTMLElement>) => {
        event.stopPropagation();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
        });
        setOpen(true);
    };

    const closeMenu = () => {
        setOpen(false);
    };

    const handleSelect = (layerId: string) => {
        onSelectBaseLayer(layerId);
        closeMenu();
    };

    React.useEffect(() => {
        if (!open) return;

        const onMouseDown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (menuRef.current && target && !menuRef.current.contains(target)) {
                closeMenu();
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeMenu();
        };

        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);


    return (
        <Box sx={{position: "relative", width: "100%"}}>
            <Tooltip title={selectedBaseLayer?.title || "Select Base Map"} placement="top">
                <Box
                    role="button"
                    tabIndex={0}
                    onClick={openMenu}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openMenuFromKeyboard(event);
                        }
                    }}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        minHeight: 32,
                        px: 1.5,
                        py: 0.5,
                        // Theme-based Primary Styling
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        borderRadius: 1,
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        border: "1px solid",
                        borderColor: "primary.dark",
                        "&:hover": {
                            bgcolor: "primary.dark",
                            boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`,
                        },
                        "&:focus-visible": {
                            outline: "2px solid",
                            outlineColor: "secondary.main",
                            outlineOffset: 2,
                        },
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            letterSpacing: "0.02em",
                        }}
                    >
                        {selectedBaseLayer?.title || "Empty Map"}
                    </Typography>
                    <ExpandMoreIcon
                        fontSize="small"
                        sx={{
                            transform: open ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s ease"
                        }}
                    />
                </Box>
            </Tooltip>

            {open && menuPosition && (
                <Paper
                    ref={menuRef}
                    elevation={12}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        position: "fixed",
                        top: menuPosition.top,
                        left: menuPosition.left,
                        width: menuPosition.width,
                        zIndex: 3200,
                        mt: 0.5,
                        overflow: "hidden",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        maxHeight: 300,
                        overflowY: "auto",
                    }}
                >
                    <List dense sx={{py: 0.5}}>
                        {sortedBaseLayers.map((layer) => (
                            <ListItemButton
                                key={layer.id}
                                selected={layer.id === selectedBaseLayer?.id}
                                onClick={() => handleSelect(layer.id)}
                                sx={{
                                    py: 0.75,
                                    "&.Mui-selected": {
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                                        "&:hover": {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
                                        },
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Tooltip title={layer.title} placement="right">
                                            <span>{layer.title}</span>
                                        </Tooltip>
                                    }
                                    primaryTypographyProps={{
                                        noWrap: false,
                                        sx: {
                                            whiteSpace: "normal",
                                            wordBreak: "break-word",
                                        },
                                    }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default BaseMapSelect;