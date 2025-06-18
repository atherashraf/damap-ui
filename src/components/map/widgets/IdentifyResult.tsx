import * as React from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const IdentifyResult = () => {
    const mapVM = useMapVM();
    const [features, setFeatures] = React.useState<Feature<Geometry>[]>([]);
    const [layerTitles, setLayerTitles] = React.useState<string[]>([]);
    const [expandedIndex, setExpandedIndex] = React.useState<number | false>(false);

    const clickListenerRef = React.useRef<any>(null);

    /**
     * Display attributes of features clicked on the map
     */
    const displayFeatureInfo = (evt: any) => {
        const map = mapVM.getMap();
        const clickedFeatures: Feature<Geometry>[] = [];
        const clickedLayerTitles: string[] = [];

        // Collect features and their layer titles
        map.forEachFeatureAtPixel(evt.pixel, (feature: any, layer: any) => {
            clickedFeatures.push(feature);
            clickedLayerTitles.push(layer?.get("title") || "Unknown Layer");
        });

        setFeatures(clickedFeatures);
        setLayerTitles(clickedLayerTitles);
        setExpandedIndex(clickedFeatures.length > 0 ? clickedFeatures.length - 1 : false);
    };

    /**
     * Attach map click listener to identify features
     */
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

    // Initialize the identify interaction
    React.useEffect(() => {
        identifyFeature();

        return () => {
            const map = mapVM.getMap();
            if (clickListenerRef.current) {
                map.un("click", clickListenerRef.current);
                clickListenerRef.current = null;
            }
        };
    }, [mapVM]);

    React.useEffect(() => {
        if (
            features.length > 0 &&
            typeof expandedIndex === "number" &&
            features[expandedIndex]
        ) {
            // mapVM.highlightFeature(features[expandedIndex]);
            mapVM.getSelectionLayer()?.addFeature(features[expandedIndex]);
        }
    }, [features, expandedIndex]);

    const renderFeatureContent = (feature: Feature<Geometry>) => {
        const properties = feature.getProperties();
        const keys = Object.keys(properties).filter(k => k !== "geometry");

        return (
            <Box sx={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
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
                        <Typography key={key} variant="body2" sx={{ marginBottom: "4px" }}>
                            <strong>{key}:</strong> {displayValue}
                        </Typography>
                    );
                })}

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
            </Box>
        );
    };

    return (
        <Box sx={{ padding: "10px", maxHeight: "400px", overflowY: "auto" }}>
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
                                mapVM.getSelectionLayer()?.addFeature(feature); // 🔍 Highlight on expand
                            }
                        }}
                    >

                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">{layerTitles[index]}-{index}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>{renderFeatureContent(feature)}</AccordionDetails>
                    </Accordion>
                ))
            )}
        </Box>
    );
};

export default IdentifyResult;
