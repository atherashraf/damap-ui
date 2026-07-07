import * as React from "react";
import {
    Box,
    Card,
    CardContent,
    Collapse,
    IconButton,
    Paper,
    Slider,
    Tooltip,
    Typography, useTheme,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { alpha } from "@mui/material/styles";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { unByKey } from "ol/Observable";
import { LayerItem } from "./types";


interface LayerSwitcherLayerCardProps {
    item: LayerItem;
    onToggleVisibility: (item: LayerItem) => void;
    onOpacityChange: (item: LayerItem, value: number | number[]) => void;
    onOpenMenu: (event: React.MouseEvent<HTMLElement>, item: LayerItem) => void;
    onOpenLegend: (item: LayerItem) => void;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
}

type LegendType = "src" | "canvas" | "sld";

interface LayerLegend {
    sType: LegendType;
    graphic: any;
}

const LayerSwitcherLayerCard = ({
                                    item,
                                    onToggleVisibility,
                                    onOpacityChange,
                                    onOpenMenu,
                                    onOpenLegend,
                                    dragHandleProps,
                                    onInteractionStart,
                                    onInteractionEnd,
                                }: LayerSwitcherLayerCardProps): React.ReactElement => {
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

    const [sldPreviewSrc, setSldPreviewSrc] = React.useState<string | null>(null);
    const [legendExpanded, setLegendExpanded] = React.useState(true);

    const theme = useTheme();

    const getLegend = React.useCallback((): LayerLegend | undefined => {
        return item.layer?.get?.("legend") || (item.layer as any)?.legend;
    }, [item.layer]);

    const legend = getLegend();
    const legendType = legend?.sType;

    React.useEffect(() => {
        if (!item.layer?.on) return;

        const key = item.layer.on("propertychange", (e: any) => {
            if (["legend", "legend_ready", "style_added", "da_ready"].includes(e.key)) {
                forceUpdate();
            }
        });

        return () => {
            if (key) unByKey(key);
        };
    }, [item.layer]);

    React.useEffect(() => {
        let cancelled = false;

        if (legendType === "sld" && legend?.graphic?.renderAsImage) {
            legend.graphic
                .renderAsImage("svg")
                .then((svgEl: Element) => {
                    if (cancelled) return;
                    const svgString = svgEl.outerHTML;
                    const src =
                        "data:image/svg+xml;base64," +
                        btoa(unescape(encodeURIComponent(svgString)));
                    setSldPreviewSrc(src);
                })
                .catch(() => {
                    if (!cancelled) setSldPreviewSrc(null);
                });
        } else {
            setSldPreviewSrc(null);
        }

        return () => {
            cancelled = true;
        };
    }, [legendType, legend]);

    const previewSrc = React.useMemo(() => {
        if (!legend) return undefined;

        if (legendType === "src") {
            return legend.graphic;
        }

        if (
            legendType === "canvas" &&
            typeof HTMLCanvasElement !== "undefined" &&
            legend.graphic instanceof HTMLCanvasElement
        ) {
            try {
                return legend.graphic.toDataURL();
            } catch {
                return undefined;
            }
        }

        if (legendType === "sld") {
            return sldPreviewSrc || undefined;
        }

        return undefined;
    }, [legend, legendType, sldPreviewSrc]);

    const hasLegendPreview = Boolean(previewSrc);

    const isVisible = item.layer.getVisible();
    const opacity = item.layer.getOpacity();

    return (
        <Card
            variant="outlined"
            sx={{
                // bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3),
                bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.15),
                position: "relative",
                borderRadius: 2,
            }}
        >
            <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
                <Tooltip
                    title={item.title}
                    placement="top"
                    arrow
                    slotProps={{
                        tooltip: {
                            sx: {
                                maxWidth: 320,
                                whiteSpace: "normal",
                                fontSize: 13,
                            },
                        },
                    }}
                >
                    <Box
                        sx={{
                            p: 0,
                            mb: 0.25,
                            borderRadius: 1.5,
                            width: "100%",
                            textAlign: "center",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 700,
                                fontFamily: theme.typography.fontFamily,
                                lineHeight: 1.1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {item.title}
                        </Typography>
                    </Box>
                </Tooltip>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 0.5,
                        mb: 1,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Tooltip title="Drag to reorder">
                            <IconButton size="small" {...dragHandleProps} aria-label="drag layer">
                                <DragIndicatorIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>
                            {item.icon}
                        </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Tooltip title={isVisible ? "Hide Layer" : "Show Layer"}>
                            <IconButton
                                size="small"
                                aria-label={isVisible ? "hide layer" : "show layer"}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => onToggleVisibility(item)}
                            >
                                {isVisible ? (
                                    <VisibilityIcon fontSize="small" />
                                ) : (
                                    <VisibilityOffIcon fontSize="small" />
                                )}
                            </IconButton>
                        </Tooltip>

                        {hasLegendPreview && (
                            <Tooltip title={legendExpanded ? "Collapse legend" : "Expand legend"}>
                                <IconButton
                                    size="small"
                                    aria-label={legendExpanded ? "collapse legend" : "expand legend"}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => setLegendExpanded((prev) => !prev)}
                                >
                                    {legendExpanded ? (
                                        <KeyboardArrowUpIcon fontSize="small" />
                                    ) : (
                                        <KeyboardArrowDownIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="More">
                            <IconButton
                                size="small"
                                aria-label="layer menu"
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={(event) => onOpenMenu(event, item)}
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Box sx={{ px: 0.5 }}>
                    <Slider
                        size="small"
                        min={0}
                        max={1}
                        step={0.01}
                        value={opacity}
                        onChange={(_, value) => onOpacityChange(item, value)}
                        onTouchStart={(e) => e.stopPropagation()}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            onInteractionStart?.();
                        }}
                        onChangeCommitted={() => {
                            onInteractionEnd?.();
                        }}
                    />
                </Box>
            </CardContent>

            {hasLegendPreview && (
                <Collapse in={legendExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ px: 1.25, pb: 1.25 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1.5,
                                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.75),
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                onClick={() => onOpenLegend(item)}
                                sx={{
                                    cursor: "pointer",
                                    width: "100%",
                                    height: "auto",          // compact preview height
                                    overflowX: "hidden",
                                    overflowY: "auto",   // vertical scroll only
                                    p: 0,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "flex-start",
                                }}
                            >
                                <img
                                    src={previewSrc}
                                    alt={`${item.title} legend`}
                                    style={{
                                        display: "block",
                                        maxWidth: "90%",   // fit within card, don't stretch
                                        width: "auto",
                                        height: "auto",
                                        objectFit: "contain",
                                    }}
                                />
                            </Box>
                        </Paper>
                    </Box>
                </Collapse>
            )}
        </Card>
    );
};

export default React.memo(LayerSwitcherLayerCard);