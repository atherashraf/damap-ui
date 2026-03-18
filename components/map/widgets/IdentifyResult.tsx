// @/components/map/widgets/IdentifyResults.tsx
import {
    useImperativeHandle,
    forwardRef,
    useState,
    useEffect,
    useCallback,
} from "react";
import { useMapVM } from "@/hooks/MapVMContext";
import { Feature } from "ol";
import { Geometry } from "ol/geom";


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
    TableBody,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MapUtils from "@/utils/mapUtils";

export interface IdentifyResultHandle {
    setFeature: (feature: any) => void;
    clearFeatures: () => void;
}
type IdentifyItem =
    | { kind: "vector"; layerTitle: string; feature: Feature<Geometry> }
    | { kind: "wms"; layerTitle: string; feature: any }; // GeoJSON feature (properties + geometry)


const IdentifyResult = forwardRef<IdentifyResultHandle>((_, ref) => {
    const mapVM = useMapVM();

    const [expandedIndex, setExpandedIndex] = useState<number | false>(false);
    const [items, setItems] = useState<IdentifyItem[]>([]);

    // imperative API
    useImperativeHandle(ref, () => ({
        setFeature: (feature: any) => {
            setItems((prev) => [...prev, { kind: "vector", layerTitle: "Unknown Layer", feature }]);
        },
        clearFeatures: () => {
            setItems([]);
            setExpandedIndex(false);
        },
    }));


    const defaultRenderAnyContent = useCallback((item: IdentifyItem) => {
        const props =
            item.kind === "vector"
                ? (item.feature as Feature<Geometry>).getProperties()
                : item.feature?.properties ?? {};

        const keys = Object.keys(props).filter((k) => k !== "geometry");

        return (
            <TableContainer component={Paper} variant="outlined" sx={{ display: "flex" }}>
                <Table size="small">
                    <TableBody>
                        {keys.map((key) => {
                            const value = props[key];
                            let displayValue: string;

                            if (typeof value === "number") displayValue = value.toFixed(3);
                            else if (Array.isArray(value))
                                displayValue = value.map((v) => (typeof v === "number" ? v.toFixed(3) : v)).join(", ");
                            else displayValue = String(value);

                            return (
                                <TableRow key={key}>
                                    <TableCell sx={{ fontWeight: "bold" }}>
                                        <strong>{key}</strong>
                                    </TableCell>
                                    <TableCell>{displayValue}</TableCell>
                                </TableRow>
                            );
                        })}

                        {/* Zoom-to only makes sense for vector right now (unless you convert WMS geojson to OL feature) */}
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
    }, [mapVM]);

    // Render content
    const renderContent = useCallback(() => {
        return (
            <Box sx={{ p: 1, overflowY: "auto" }}>
                {items.map((item, index) => (
                    <Accordion
                        key={index}
                        expanded={expandedIndex === index}
                        onChange={(_, isExpanded) => setExpandedIndex(isExpanded ? index : false)}
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
                            {/* custom renderer only supports OL Features; fallback for WMS */}
                            {item.kind === "vector"
                                ? (mapVM.getCustomIdentifyRenderer() ?? ((_: any) => defaultRenderAnyContent(item)))(
                                    item.feature as any
                                )
                                : defaultRenderAnyContent(item)}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        );
    }, [items, expandedIndex, mapVM]);
    // Click handler (uses mapVM + OL)
    const displayFeatureInfo = useCallback(
        async (evt: any) => {
            const map = mapVM.getMap?.();
            if (!map) return;

            const found: IdentifyItem[] = [];

            // 1) Vector hits
            map.forEachFeatureAtPixel(evt.pixel, (feature: any, layer: any) => {
                if (layer?.get("displayInLayerSwitcher") !== false) {
                    found.push({
                        kind: "vector",
                        layerTitle: layer?.get("title") || "Unknown Layer",
                        feature: feature as Feature<Geometry>,
                    });
                }
            });

            // 2) WMS hits (GeoServer GetFeatureInfo) — only if layers implement identify()
            const overlays = Object.values((mapVM as any).overlayLayers || {});
            const wmsOverlays = overlays.filter((o: any) => {
                const ol = o?.getOlLayer?.();
                return typeof o?.identify === "function" && ol?.getVisible?.();
            });

            for (const o of wmsOverlays as any[]) {
                try {
                    const geojson = await o.identify(evt); // must return FeatureCollection
                    const feats = geojson?.features;
                    if (Array.isArray(feats) && feats.length) {
                        const title = o.getOlLayer?.()?.get?.("title") || "WMS Layer";
                        feats.forEach((f: any) => found.push({ kind: "wms", layerTitle: title, feature: f }));
                    }
                } catch {
                    // ignore
                }
            }

            if (found.length === 0) {
                mapVM.showSnackbar("No feature identified at this location");
                mapVM.getRightDrawerRef()?.current?.closeDrawer();
            } else {
                mapVM.getRightDrawerRef()?.current?.openDrawer();
            }

            setItems(found);
            setExpandedIndex(found.length ? found.length - 1 : false);
        },
        [mapVM]
    );

    // Arm/unarm with CustomToolManager (exclusive)
    useEffect(() => {
        // Activate identify as an exclusive custom tool
        mapVM.tools.activateCustomExclusive(
            "identify",
            (on) => {
                on("click", displayFeatureInfo);
            },
            "crosshair",
            {
                message: { text: "Click on layer feature to get its info    ", severity: "info" }
                // actions: [{ label: "Cancel", onClick: () => vm.tools.offCustomTool("measure") }]
            }
        );

        // Cleanup on unmount
        return () => {
            mapVM.tools.offCustomTool("identify");
        };
    }, [mapVM, displayFeatureInfo]);

    // Keep selection layer in sync with the expanded panel


    useEffect(() => {
        if (typeof expandedIndex !== "number") return;

        const item = items[expandedIndex];
        if (!item) return;

        const selectionLayer = mapVM.getSelectionLayer();
        if (!selectionLayer) return;

        if (item.kind === "vector") {
            selectionLayer.addFeature(item.feature as any);
        }

        if (item.kind === "wms") {
            const crs = MapUtils.detectGeoJsonCrs(item.feature);

            // fallback to map projection if unknown
            const dataCrs = crs === "unknown" ? mapVM.getViewProjectionCode() : crs;
            selectionLayer.addGeoJson2Selection(item.feature, true, dataCrs)
        }

    }, [items, expandedIndex, mapVM]);

    return (
        <>
            {items.length === 0
                ? <Typography>Click on feature to see its property</Typography>
                : renderContent()
            }
        </>
    );

});

export default IdentifyResult;
