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

export interface IdentifyResultHandle {
    setFeature: (feature: any) => void;
    clearFeatures: () => void;
}

const IdentifyResult = forwardRef<IdentifyResultHandle>((_, ref) => {
    const mapVM = useMapVM();

    const [features, setFeatures] = useState<Feature<Geometry>[]>([]);
    const [layerTitles, setLayerTitles] = useState<string[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | false>(false);

    // imperative API
    useImperativeHandle(ref, () => ({
        setFeature: (feature) => setFeatures((prev) => [...prev, feature]),
        clearFeatures: () => setFeatures([]),
    }));

    // default content renderer (same logic as before)
    const defaultRenderFeatureContent = (feature: Feature<Geometry>) => {
        const properties = feature.getProperties();
        const keys = Object.keys(properties).filter((k) => k !== "geometry");

        return (
            <TableContainer component={Paper} variant="outlined" sx={{ display: "flex" }}>
                <Table size="small">
                    <TableBody>
                        {keys.map((key) => {
                            const value = properties[key];
                            let displayValue: string;

                            if (typeof value === "number") {
                                displayValue = value.toFixed(3);
                            } else if (Array.isArray(value)) {
                                displayValue = value
                                    .map((v) => (typeof v === "number" ? v.toFixed(3) : v))
                                    .join(", ");
                            } else {
                                displayValue = String(value);
                            }

                            return (
                                <TableRow key={key}>
                                    <TableCell sx={{ fontWeight: "bold" }}>
                                        <strong>{key}</strong>
                                    </TableCell>
                                    <TableCell>{displayValue}</TableCell>
                                </TableRow>
                            );
                        })}
                        <TableRow>
                            <TableCell colSpan={2}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ marginTop: "8px" }}
                                    onClick={() => {
                                        mapVM.getSelectionLayer()?.addFeature(feature);
                                        mapVM.getSelectionLayer()?.zoomToFeature(feature);
                                    }}
                                >
                                    Zoom to Feature
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    // Render content
    const renderContent = useCallback(() => {
        // if (features.length === 0) return null;

        return (
            <Box sx={{ p: 1, overflowY: "auto" }}>
                {features.map((feature, index) => (
                    <Accordion
                        key={index}
                        expanded={expandedIndex === index}
                        onChange={(_, isExpanded) => {
                            setExpandedIndex(isExpanded ? index : false);
                            if (isExpanded) {
                                mapVM.getSelectionLayer()?.addFeature(feature);
                            }
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon sx={{ color: "primary.contrastText" }} />}
                            sx={{
                                backgroundColor: "primary.main",
                                "&.Mui-expanded": {
                                    backgroundColor: "primary.dark",
                                },
                                color: "primary.contrastText",
                            }}
                        >
                            <Typography variant="subtitle1">
                                {layerTitles[index]}-{index}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {(mapVM.getCustomIdentifyRenderer() ?? defaultRenderFeatureContent)(feature)}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        );
    }, [features, expandedIndex, layerTitles, mapVM]);

    // Click handler (uses mapVM + OL)
    const displayFeatureInfo = useCallback(
        (evt: any) => {
            const map = mapVM.getMap();
            if (!map) return;

            const clickedFeatures: Feature<Geometry>[] = [];
            const clickedLayerTitles: string[] = [];

            map.forEachFeatureAtPixel(evt.pixel, (feature: any, layer: any) => {
                if (layer?.get("displayInLayerSwitcher") !== false) {
                    clickedFeatures.push(feature);
                    clickedLayerTitles.push(layer?.get("title") || "Unknown Layer");
                }
            });

            if (clickedFeatures.length === 0) {
                mapVM.showSnackbar("No feature identified at this location");
                mapVM.getRightDrawerRef()?.current?.closeDrawer();
            } else {
                mapVM.getRightDrawerRef()?.current?.openDrawer();
            }

            setFeatures(clickedFeatures);
            setLayerTitles(clickedLayerTitles);
            setExpandedIndex(clickedFeatures.length > 0 ? clickedFeatures.length - 1 : false);
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
        if (features.length > 0 && typeof expandedIndex === "number" && features[expandedIndex]) {
            mapVM.getSelectionLayer()?.addFeature(features[expandedIndex]);
        }
    }, [features, expandedIndex, mapVM]);

    return (
        <>
            {features.length === 0
                ? <Typography>Click on feature to see its property</Typography>
                : renderContent()
            }
        </>
    );

});

export default IdentifyResult;
