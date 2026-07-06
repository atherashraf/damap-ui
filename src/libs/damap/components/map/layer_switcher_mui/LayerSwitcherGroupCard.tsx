import * as React from "react";
import {
    alpha,
    Box,
    Collapse,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import LayerGroup from "ol/layer/Group";
import { LayerItem } from "@damap/components/map/layer_switcher_mui/types";
import LayerSwitcherLayerCard from "@damap/components/map/layer_switcher_mui/LayerSwitcherLayerCard";
import { Draggable, Droppable } from "@hello-pangea/dnd";

interface LayerSwitcherGroupCardProps {
    groupId: string;
    group: LayerGroup | null;
    title: string;
    childrenItems: LayerItem[];

    onToggleVisibility: (item: LayerItem) => void;
    onOpacityChange: (item: LayerItem, value: number | number[]) => void;
    onOpenMenu: (e: React.MouseEvent<HTMLElement>, item: LayerItem) => void;
    onOpenLegend?: (item: LayerItem) => void;

    dragHandleProps?: any;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
}

const LayerSwitcherGroupCard = ({
                                    groupId,
                                    group,
                                    title,
                                    childrenItems,
                                    onToggleVisibility,
                                    onOpacityChange,
                                    onOpenMenu,
                                    onOpenLegend,
                                    dragHandleProps,
                                    onInteractionStart,
                                    onInteractionEnd,
                                }: LayerSwitcherGroupCardProps) => {
    const [open, setOpen] = React.useState(
        group ? group.get("fold") !== "close" : true
    );

    // --- FIX HERE ---
    // If real group, use group visibility. If pseudo-group, derive visibility from children.
    const visible = group
        ? group.getVisible()
        : childrenItems.some((item) => item.layer?.getVisible?.() === true);

    const handleToggleOpen = () => {
        const next = !open;
        setOpen(next);

        if (group) {
            group.set("fold", next ? "open" : "close");
            group.changed();
        }
    };

    const handleToggleGroupVisibility = () => {
        const next = !visible;

        if (group) {
            group.setVisible(next);
            group.getLayers().forEach((layer: any) => layer.setVisible(next));
            group.changed();
            return;
        }

        // For ungrouped pseudo-group: apply visibility uniformly to all orphan layers
        childrenItems.forEach((item) => {
            if (item.layer) {
                item.layer.setVisible(next);
                item.layer.changed();
            }
        });

        // Explicitly trigger visibility cascade up to the parent component listeners
        if (childrenItems.length > 0 && childrenItems[0].layer) {
            childrenItems[0].layer.dispatchEvent("change:visible");
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 1.25,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: open ? 1.25 : 0,
                }}
            >
                <Box
                    {...dragHandleProps}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "grab",
                        color: "text.secondary",
                    }}
                >
                    {open ? (
                        <FolderOpenIcon fontSize="small" />
                    ) : (
                        <FolderIcon fontSize="small" />
                    )}
                </Box>

                <Typography
                    variant="subtitle1"
                    sx={{
                        flex: 1,
                        fontWeight: 700,
                        lineHeight: 1.2,
                    }}
                    noWrap
                    title={title}
                >
                    {title} ({childrenItems.length})
                </Typography>

                <Tooltip title={visible ? "Hide group" : "Show group"}>
                    <IconButton size="small" onClick={handleToggleGroupVisibility}>
                        {visible ? (
                            <VisibilityIcon fontSize="small" />
                        ) : (
                            <VisibilityOffIcon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>

                <Tooltip title={open ? "Collapse" : "Expand"}>
                    <IconButton size="small" onClick={handleToggleOpen}>
                        {open ? (
                            <ExpandLessIcon fontSize="small" />
                        ) : (
                            <ExpandMoreIcon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>

                <Tooltip title="Group menu">
                    <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Collapse in={open} timeout="auto" unmountOnExit>
                <Droppable droppableId={groupId} type="LAYER">
                    {(provided) => (
                        <Stack
                            spacing={1}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                                pl: 1.25,
                                borderLeft: "2px solid",
                                borderColor: "divider",
                            }}
                        >
                            {childrenItems.map((item, index) => (
                                <Draggable
                                    key={item.id}
                                    draggableId={`layer-${item.id}`}
                                    index={index}
                                >
                                    {(provided) => (
                                        <Box
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                        >
                                            <LayerSwitcherLayerCard
                                                item={item}
                                                dragHandleProps={provided.dragHandleProps}
                                                onToggleVisibility={onToggleVisibility}
                                                onOpacityChange={onOpacityChange}
                                                onOpenMenu={onOpenMenu}
                                                onOpenLegend={() => onOpenLegend?.(item)}
                                                onInteractionStart={onInteractionStart}
                                                onInteractionEnd={onInteractionEnd}
                                            />
                                        </Box>
                                    )}
                                </Draggable>
                            ))}

                            {provided.placeholder}
                        </Stack>
                    )}
                </Droppable>
            </Collapse>
        </Paper>
    );
};

export default LayerSwitcherGroupCard;