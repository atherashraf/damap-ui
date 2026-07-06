// @damap/components/map/widgets/IdentifyResults.tsx
import  {
    useImperativeHandle,
    forwardRef,
    useState,
    useEffect,
    useCallback,
} from "react";
import { useMapVM } from "@damap/hooks/MapVMContext";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import { transform } from "ol/proj";

import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Button,
    Box,
    Paper,
    TableContainer,
    Table,
    TableCell,
    TableRow,
    TableBody, alpha, Tooltip,
    useTheme,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MapUtils from "@damap/utils/mapUtils";
import MapApi, { MapAPIs } from "@damap/api/MapApi";
import { formatAttributeCellDisplay } from "@damap/utils/attributeTableDisplay";

export interface IdentifyResultHandle {
    setFeature: (feature: any) => void;
    clearFeatures: () => void;
}

type IdentifyItem =
    | { kind: "vector"; layerTitle: string; feature: Feature<Geometry> }
    | { kind: "wms"; layerTitle: string; feature: any }
    | { kind: "raster"; layerTitle: string; feature: any };

const IdentifyResult = forwardRef<IdentifyResultHandle>((_, ref) => {
    const mapVM = useMapVM();
    const theme = useTheme()

    const [expandedIndex, setExpandedIndex] = useState<number | false>(false);
    const [items, setItems] = useState<IdentifyItem[]>([]);

    useImperativeHandle(ref, () => ({
        setFeature: (feature: any) => {
            setItems((prev) => [
                ...prev,
                {
                    kind: "vector",
                    layerTitle: "Unknown Layer",
                    feature,
                },
            ]);
        },
        clearFeatures: () => {
            setItems([]);
            setExpandedIndex(false);
        },
    }));

    const defaultRenderAnyContent = useCallback(
        (item: IdentifyItem) => {
            const props =
                item.kind === "vector"
                    ? (item.feature as Feature<Geometry>).getProperties()
                    : item.feature?.properties ?? {};

            const keys = Object.keys(props).filter((k) => k !== "geometry");
            const dateLikeValueRe = /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

            const parseLonLatArray = (val: any) => {
                if (!Array.isArray(val)) return null;
                if (val.length < 2) return null;

                const lon = Number(val[0]);
                const lat = Number(val[1]);

                if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
                    return null;
                }

                return { lon, lat };
            };

            const renderValue = (key: string, value: any, displayValue: string) => {
                const lowerKey = key.toLowerCase();
                const stringValue = String(value || "");

                const isImageField =
                    lowerKey.includes("photo") ||
                    lowerKey.includes("image") ||
                    lowerKey.includes("pic") ||
                    lowerKey.includes("picture") ||
                    lowerKey.includes("avatar");

                const imageUrl = MapApi.getBaseURL(stringValue);

                const isImageUrl =
                    imageUrl.startsWith("http") ||
                    imageUrl.startsWith("data:image") ||
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl);

                if (isImageField && isImageUrl) {
                    return (
                        <Tooltip title={displayValue} arrow>
                            <Box
                                component="a"
                                href={imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    lineHeight: 0,
                                }}
                            >
                                <Box
                                    component="img"
                                    src={imageUrl}
                                    alt={key}
                                    sx={{
                                        width: 48,
                                        height: 28,
                                        objectFit: "cover",
                                        borderRadius: 0.75,
                                        border: `1px solid ${alpha(
                                            theme.palette.divider,
                                            0.8
                                        )}`,
                                        display: "block",
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    );
                }

                // Array format: [lon, lat]
                const coords = parseLonLatArray(value);

                if (coords) {
                    return (
                        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                            {/*<Typography variant="body2">*/}
                            {/*    [{coords.lon}, {coords.lat}]*/}
                            {/*</Typography>*/}

                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    mapVM.goToCoordinate(
                                        coords.lon,
                                        coords.lat,
                                        "4326",
                                        18
                                    );
                                }}
                            >
                                Show on Map
                            </Button>
                        </Box>
                    );
                }

                return displayValue;
            };

            return (
                <TableContainer component={Paper} variant="outlined" sx={{ display: "flex" }}>
                    <Table size="small">
                        <TableBody>
                            {keys.map((key) => {
                                const value = props[key];
                                let displayValue: string;

                                if (typeof value === "number") {
                                    displayValue = value.toFixed(3);
                                } else if (Array.isArray(value)) {
                                    displayValue = `[${value
                                        .map((v) =>
                                            typeof v === "number" ? v.toFixed(6) : String(v)
                                        )
                                        .join(", ")}]`;
                                } else if (value && typeof value === "object") {
                                    displayValue = JSON.stringify(value);
                                } else {
                                    displayValue = formatAttributeCellDisplay(
                                        {
                                            id: key,
                                            label: key.replace(/_/g, " "),
                                            disablePadding: false,
                                            type:
                                                value instanceof Date ||
                                                (typeof value === "string" && dateLikeValueRe.test(value.trim()))
                                                    ? "date"
                                                    : "string",
                                        },
                                        value
                                    ) || String(value);
                                }

                                return (
                                    <TableRow key={key}>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                            <strong>{key.replace("_", " ")}</strong>
                                        </TableCell>

                                        <TableCell>
                                            {renderValue(key, value, displayValue)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {item.kind === "vector" && (
                                <TableRow>
                                    <TableCell colSpan={2}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{ marginTop: "8px" }}
                                            onClick={() => {
                                                mapVM.getSelectionLayer()?.addFeature(item.feature as any);
                                                mapVM.getSelectionLayer()?.zoomToFeature(item.feature as any);
                                            }}
                                        >
                                            Zoom to Feature
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            );
        },
        [mapVM]
    );

    const renderContent = useCallback(() => {
        return (
            <Box sx={{ p: 1, overflowY: "auto" }}>
                {items.map((item, index) => (
                    <Accordion
                        key={index}
                        expanded={expandedIndex === index}
                        onChange={(_, isExpanded) =>
                            setExpandedIndex(isExpanded ? index : false)
                        }
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon sx={{ color: "primary.contrastText" }} />}
                            sx={{
                                backgroundColor: "primary.main",
                                "&.Mui-expanded": { backgroundColor: "primary.dark" },
                                color: "primary.contrastText",
                            }}
                        >
                            <Typography variant="subtitle1">
                                {item.layerTitle} ({item.kind})
                            </Typography>
                        </AccordionSummary>

                        <AccordionDetails>
                            {item.kind === "vector"
                                ? (
                                    mapVM.getCustomIdentifyRenderer() ??
                                    ((_: any) => defaultRenderAnyContent(item))
                                )(item.feature as any)
                                : defaultRenderAnyContent(item)}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        );
    }, [items, expandedIndex, mapVM, defaultRenderAnyContent]);

    const displayFeatureInfo = useCallback(
        async (evt: any) => {
            const map = mapVM.getMap?.();
            if (!map) return;

            const found: IdentifyItem[] = [];
            const loi: string | null = mapVM.getLayerOfInterest();

            if (!loi) {
                mapVM.showSnackbar("Please select Layer of Interest", "error");
                return;
            }

            const isLOILayer = (layer: any) => {
                const uuid = layer?.get?.("uuid");
                const name = layer?.get?.("name");
                return uuid === loi || name === loi;
            };

            map.forEachFeatureAtPixel(evt.pixel, (feature: any, layer: any) => {
                if (
                    layer?.get("displayInLayerSwitcher") !== false &&
                    isLOILayer(layer)
                ) {
                    found.push({
                        kind: "vector",
                        layerTitle: layer?.get("title") || "Unknown Layer",
                        feature: feature as Feature<Geometry>,
                    });
                }
            });

            const loiRecord = mapVM.getLayerRecord(loi);
            const loiWrapper: any = loiRecord?.wrapper;
            const loiOlLayer: any = loiRecord?.olLayer;

            if (
                loiRecord?.kind === "wms" &&
                loiOlLayer?.getVisible?.() &&
                typeof loiWrapper?.identify === "function"
            ) {
                try {
                    const geojson = await loiWrapper.identify(evt);
                    const feats = geojson?.features;

                    if (Array.isArray(feats) && feats.length) {
                        feats.forEach((f: any) => {
                            found.push({
                                kind: "wms",
                                layerTitle: loiOlLayer.get("title") || "WMS Layer",
                                feature: f,
                            });
                        });
                    }
                } catch (err) {
                    console.error("WMS identify failed:", err);
                }
            }

            const rasterLayers: any[] = [];

            map.getLayers().forEach((layer: any) => {
                if (
                    layer?.getVisible?.() &&
                    isLOILayer(layer) &&
                    layer?.get("rasterIdentify") === true &&
                    layer?.get("identifyType") === "raster"
                ) {
                    rasterLayers.push(layer);
                }
            });

            const lonLat = transform(
                evt.coordinate,
                mapVM.getViewProjectionCode(),
                "EPSG:4326"
            );

            for (const layer of rasterLayers) {
                try {
                    const uuid = layer.get("uuid") || layer.get("name");
                    if (!uuid) continue;

                    const url =
                        MapApi.getURL(MapAPIs.DCH_RASTER_PIXEL_VALUE, { uuid }) +
                        `?lon=${encodeURIComponent(lonLat[0])}&lat=${encodeURIComponent(lonLat[1])}`;

                    const res = await fetch(url);
                    const json = await res.json();

                    if (json?.success) {
                        found.push({
                            kind: "raster",
                            layerTitle: layer.get("title") || "Raster Layer",
                            feature: {
                                properties: {
                                    value: json.value,
                                    label: json.label ?? "",
                                    longitude: lonLat[0],
                                    latitude: lonLat[1],
                                },
                            },
                        });
                    }
                } catch (err) {
                    console.error("Raster identify failed:", err);
                }
            }

            if (found.length === 0) {
                mapVM.showSnackbar(
                    "No feature identified on selected Layer of Interest at this location",
                    "warning"
                );
            } else {
                mapVM.getRightDrawerRef()?.current?.openDrawer();
            }

            setItems(found);
            setExpandedIndex(found.length ? found.length - 1 : false);
        },
        [mapVM]
    );

    useEffect(() => {
        mapVM.tools.activateCustomExclusive(
            "identify",
            (on) => {
                on("click", displayFeatureInfo);
            },
            "crosshair",
            {
                message: {
                    text: "Click on layer feature to get its info",
                    severity: "info",
                },
                esc: {
                    enabled: true,
                    onEsc: () => {
                        mapVM.getSelectionLayer()?.clearSelection?.();
                        mapVM.getRightDrawerRef()?.current?.closeDrawer();
                    },
                },
            }
        );

        return () => {
            mapVM.tools.offCustomTool("identify");
        };
    }, [mapVM, displayFeatureInfo]);

    useEffect(() => {
        if (typeof expandedIndex !== "number") return;

        const item = items[expandedIndex];
        if (!item) return;

        const selectionLayer = mapVM.getSelectionLayer();
        if (!selectionLayer) return;

        if (item.kind === "raster") {
            selectionLayer.clearSelection?.();
            return;
        }

        if (item.kind === "vector") {
            if (item.feature instanceof Feature) {
                selectionLayer.clearSelection?.();
                selectionLayer.addFeature(item.feature.clone());
            } else {
                console.warn("Identify selected non-OL Feature:", item.feature);
            }

            return;
        }

        if (item.kind === "wms") {
            selectionLayer.clearSelection?.();

            const crs = MapUtils.detectGeoJsonCrs(item.feature);
            const dataCrs =
                crs === "unknown" ? mapVM.getViewProjectionCode() : crs;

            selectionLayer.addGeoJson2Selection(item.feature, true, dataCrs);
        }
    }, [items, expandedIndex, mapVM]);

    return (
        <>
            {items.length === 0 ? (
                <Typography>Click on feature to see its property</Typography>
            ) : (
                renderContent()
            )}
        </>
    );
});

export default IdentifyResult;