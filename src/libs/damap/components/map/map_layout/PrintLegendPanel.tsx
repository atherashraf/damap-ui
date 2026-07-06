import * as React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMapVM } from "@damap/hooks/MapVMContext";
import { unByKey } from "ol/Observable";
import LayerGroup from "ol/layer/Group";

type LegendType = "src" | "canvas" | "sld";

interface LayerLegend {
    sType: LegendType;
    graphic: any;
}

interface LegendItem {
    id: string;
    title: string;
    layer: any;
    legend?: LayerLegend;
}

interface PrintLegendPanelProps {
    availableHeight: number;
    width: number | string;
}

const isBaseLayer = (layer: any): boolean => {
    const title = String(layer?.get?.("title") || "").toLowerCase();

    return (
        layer?.get?.("baseLayer") === true ||
        title === "base layers" ||
        title.includes("google") ||
        title.includes("open street map") ||
        title.includes("empty map")
    );
};

const flattenVisibleLayers = (layers: any[]): any[] => {
    const out: any[] = [];

    layers.forEach((layer) => {
        if (!layer?.getVisible?.()) return;

        if (layer instanceof LayerGroup) {
            const children = layer.getLayers?.()?.getArray?.() || [];
            out.push(...flattenVisibleLayers(children));
            return;
        }

        if (!isBaseLayer(layer)) {
            out.push(layer);
        }
    });

    return out;
};

const collectObservableLayers = (layers: any[]): any[] => {
    const out: any[] = [];

    layers.forEach((layer) => {
        out.push(layer);

        if (layer instanceof LayerGroup) {
            const children = layer.getLayers?.()?.getArray?.() || [];
            out.push(...collectObservableLayers(children));
        }
    });

    return out;
};

const getLayerColor = (layer: any): string => {
    try {
        const style = layer?.getStyle?.();
        const resolvedStyle =
            typeof style === "function"
                ? undefined
                : Array.isArray(style)
                    ? style[0]
                    : style;

        const strokeColor = resolvedStyle?.getStroke?.()?.getColor?.();
        const fillColor = resolvedStyle?.getFill?.()?.getColor?.();

        if (typeof strokeColor === "string") return strokeColor;
        if (typeof fillColor === "string") return fillColor;
    } catch {
        // ignore fallback
    }

    return "#555";
};

const FallbackLegendSymbol = ({ layer }: { layer: any }) => {
    const color = getLayerColor(layer);

    return (
        <Box
            sx={{
                width: 44,
                height: 18,
                border: `3px solid ${color}`,
                bgcolor: "rgba(180,220,180,0.35)",
                flexShrink: 0,
            }}
        />
    );
};

const PrintLegendRow = ({
                            item,
                            compact,
                        }: {
    item: LegendItem;
    compact: boolean;
}): React.ReactElement => {
    const [sldPreviewSrc, setSldPreviewSrc] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;

        if (item.legend?.sType === "sld" && item.legend?.graphic?.renderAsImage) {
            item.legend.graphic
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
    }, [item.legend]);

    const previewSrc = React.useMemo(() => {
        const legend = item.legend;
        if (!legend) return undefined;

        if (legend.sType === "src") return legend.graphic;

        if (
            legend.sType === "canvas" &&
            typeof HTMLCanvasElement !== "undefined" &&
            legend.graphic instanceof HTMLCanvasElement
        ) {
            try {
                return legend.graphic.toDataURL();
            } catch {
                return undefined;
            }
        }

        if (legend.sType === "sld") return sldPreviewSrc || undefined;

        return undefined;
    }, [item.legend, sldPreviewSrc]);

    return (
        <Stack
            spacing={0.5}
            sx={{
                width: "100%",
                alignItems: "flex-start",
            }}
        >
            <Typography
                sx={{
                    width: "100%",
                    fontSize: compact ? 10.5 : 12,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    whiteSpace: "normal",
                }}
            >
                {item.title}
            </Typography>

            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",   // or "center"
                    alignItems: "center",
                }}
            >
                {previewSrc ? (
                    <Box
                        component="img"
                        src={previewSrc}
                        alt={item.title}
                        sx={{
                            // maxWidth: "100%",
                            // maxHeight: compact ? 24 : 32,
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                ) : (
                    <FallbackLegendSymbol layer={item.layer} />
                )}
            </Box>
        </Stack>
    );
};

const PrintLegendPanel = ({
                              availableHeight,
                              width,
                          }: PrintLegendPanelProps): React.ReactElement | null => {
    const mapVM = useMapVM();
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

    React.useEffect(() => {
        const map = mapVM.getMap();
        if (!map) return;

        const keys: any[] = [];
        const allLayers = collectObservableLayers(map.getLayers().getArray());

        allLayers.forEach((layer: any) => {
            if (!layer?.on) return;

            const key = layer.on("propertychange", (e: any) => {
                if (
                    [
                        "legend",
                        "legend_ready",
                        "style_added",
                        "da_ready",
                        "visible",
                        "title",
                        "style",
                    ].includes(e.key)
                ) {
                    forceUpdate();
                }
            });

            keys.push(key);
        });

        return () => {
            keys.forEach((k) => k && unByKey(k));
        };
    }, [mapVM]);

    const items = React.useMemo<LegendItem[]>(() => {
        const map = mapVM.getMap();
        if (!map) return [];

        const flat = flattenVisibleLayers(map.getLayers().getArray());

        return flat.map((layer: any, index: number) => {
            const legend: LayerLegend | undefined =
                layer?.get?.("legend") || layer?.legend;

            const title =
                layer?.get?.("title") ||
                layer?.get?.("name") ||
                `Layer ${index + 1}`;

            return {
                id: String(layer?.ol_uid ?? layer?.get?.("uuid") ?? index),
                title,
                layer,
                legend,
            };
        });
    }, [mapVM, forceUpdate]);

    if (!items.length) return null;

    const titleHeight = 28;
    const normalRowHeight = 34;
    const compactRowHeight = 24;

    const normalCapacity = Math.floor((availableHeight - titleHeight) / normalRowHeight);
    const compactCapacity = Math.floor((availableHeight - titleHeight) / compactRowHeight);

    const compact = items.length > normalCapacity;
    const capacity = compact ? compactCapacity : normalCapacity;

    const visibleItems = items.slice(0, Math.max(0, capacity));
    const hiddenCount = Math.max(0, items.length - visibleItems.length);

    return (
        <Paper
            elevation={0}
            sx={{
                width,
                height: availableHeight,
                overflow: "hidden",
                p: 1,
                border: "1px solid #999",
                borderRadius: 1,
                bgcolor: alpha("#ffffff", 0.96),
            }}
        >
            <Typography
                sx={{
                    fontSize: 15,
                    fontWeight: 800,
                    mb: 0.75,
                    lineHeight: 1.1,
                }}
            >
                Legend
            </Typography>

            <Stack spacing={compact ? 0.35 : 0.65}>
                {visibleItems.map((item) => (
                    <PrintLegendRow
                        key={item.id}
                        item={item}
                        compact={compact}
                    />
                ))}

                {hiddenCount > 0 && (
                    <Typography
                        sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            mt: 0.5,
                            color: "#333",
                        }}
                    >
                        +{hiddenCount} more layers
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
};

export default React.memo(PrintLegendPanel);