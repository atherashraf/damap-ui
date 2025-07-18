/**
 * IdentifyResult Component
 * -------------------------
 * This component listens for clicks on the OpenLayers map and displays attribute information
 * about the identified features in a collapsible accordion format.
 *
 * ✅ It supports dynamic feature rendering by exposing a `setFeatureRenderer` method via `ref`.
 *
 * Usage Example:
 * --------------
 * const mapVM = useMapVM()
 * const identifyRef = mapVM.getIdentifierResultRef()
 *
 * // Set a custom renderer for identified features (optional)
 * useEffect(() => {
 *     identifyRef.current?.setFeatureRenderer((feature) => {
 *         return <CustomFeatureViewer feature={feature} />;
 *     });
 * }, [identifyRef.current]);
 *
 * return <IdentifyResult ref={identifyRef} />;
 *
 * Default Behavior:
 * -----------------
 * If no external renderer is provided via `setFeatureRenderer`, a default feature property
 * table will be shown.
 *
 * Exposed API via ref:
 * --------------------
 * interface IdentifyResultHandle {
 *   setFeatureRenderer: (renderer: ((feature: Feature<Geometry>) => ReactNode) | null) => void;
 * }
 */

import {
    useImperativeHandle,
    forwardRef,
    useState,
    useRef,
    useEffect,
    ReactNode,
} from "react";
import {useMapVM} from "@/hooks/MapVMContext";
import {Feature} from "ol";
import {Geometry} from "ol/geom";
import {
    Accordion, AccordionSummary, AccordionDetails, Typography,
    Button, Box, Paper, TableContainer, Table, TableCell, TableRow,
    TableBody,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export interface IdentifyResultHandle {
    setFeatureRenderer: (renderer: ((feature: Feature<Geometry>) => ReactNode) | null) => void;
}

const IdentifyResult = forwardRef<IdentifyResultHandle>((_, ref) => {
    const mapVM = useMapVM();
    const [features, setFeatures] = useState<Feature<Geometry>[]>([]);
    const [layerTitles, setLayerTitles] = useState<string[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | false>(false);
    const [externalRenderer, setExternalRenderer] = useState<((feature: Feature<Geometry>) => ReactNode) | null>(null);

    const clickListenerRef = useRef<any>(null);

    // Expose the setFeatureRenderer method to allow custom rendering of features
    useImperativeHandle(ref, () => ({
        setFeatureRenderer: (renderer) => {
            setExternalRenderer(() => renderer); // ensure closure safety
        },
    }));

    // Handle map click and collect features and their source layer titles
    const displayFeatureInfo = (evt: any) => {
        const map = mapVM.getMap();
        const clickedFeatures: Feature<Geometry>[] = [];
        const clickedLayerTitles: string[] = [];

        map.forEachFeatureAtPixel(evt.pixel, (feature: any, layer: any) => {
            if(layer.get("displayInLayerSwitcher") == true) {
                clickedFeatures.push(feature);
                clickedLayerTitles.push(layer?.get("title") || "Unknown Layer");
            }
        });

        setFeatures(clickedFeatures);
        setLayerTitles(clickedLayerTitles);
        setExpandedIndex(clickedFeatures.length > 0 ? clickedFeatures.length - 1 : false);
    };

    // Attach click listener for feature identification
    const identifyFeature = () => {
        const map = mapVM.getMap();

        if (clickListenerRef.current) {
            map.un("click", clickListenerRef.current);
            clickListenerRef.current = null;
        }

        const handler = (evt: any) => {
            displayFeatureInfo(evt);
        };

        map.on("click", handler);
        clickListenerRef.current = handler;
    };

    // Initialize identification on mount
    useEffect(() => {
        identifyFeature();
        return () => {
            const map = mapVM.getMap();
            if (clickListenerRef.current) {
                map.un("click", clickListenerRef.current);
                clickListenerRef.current = null;
            }
        };
    }, [mapVM]);

    // Highlight selected feature on expand
    useEffect(() => {
        if (
            features.length > 0 &&
            typeof expandedIndex === "number" &&
            features[expandedIndex]
        ) {
            mapVM.getSelectionLayer()?.addFeature(features[expandedIndex]);
        }
    }, [features, expandedIndex]);

    // Default table layout for displaying feature properties
    const defaultRenderFeatureContent = (feature: Feature<Geometry>) => {
        const properties = feature.getProperties();
        const keys = Object.keys(properties).filter(k => k !== "geometry");

        return (
            <TableContainer component={Paper} variant="outlined" sx={{display: "flex"}}>
                <Table size="small">
                    <TableBody>
                        {keys.map((key) => {
                            const value = properties[key];
                            let displayValue: string;

                            if (typeof value === "number") {
                                displayValue = value.toFixed(3);
                            } else if (Array.isArray(value)) {
                                displayValue = value.map(v => typeof v === "number" ? v.toFixed(3) : v).join(", ");
                            } else {
                                displayValue = String(value);
                            }

                            return (
                                <TableRow key={key}>
                                    <TableCell sx={{fontWeight: 'bold'}}>
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
                                    sx={{marginTop: "8px"}}
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

    return (
        <Box sx={{p: 1, overflowY: "auto"}}>
            {features.length === 0 ? (
                <Typography>No feature identified at this location.</Typography>
            ) : (
                features.map((feature, index) => (
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
                            expandIcon={<ExpandMoreIcon sx={{ color: 'primary.contrastText' }} />}
                            sx={{
                                backgroundColor: 'primary.main',
                                '&.Mui-expanded': {
                                    backgroundColor: 'primary.dark',
                                },
                                color: 'primary.contrastText',
                            }}
                        >
                            <Typography variant="subtitle1">
                                {layerTitles[index]}-{index}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {(externalRenderer ?? defaultRenderFeatureContent)(feature)}
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Box>
    );
});

export default IdentifyResult;
