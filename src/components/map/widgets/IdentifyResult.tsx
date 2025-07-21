import {
    useImperativeHandle,
    forwardRef,
    useState,
    useRef,
    useEffect,
    ReactNode,
    useCallback
} from "react";
import { useMapVM } from "@/hooks/MapVMContext";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import {
    Accordion, AccordionSummary, AccordionDetails, Typography,
    Button, Box, Paper, TableContainer, Table, TableCell, TableRow,
    TableBody,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export interface IdentifyResultHandle {
    setFeatureRenderer: (renderer: ((feature: Feature<Geometry>) => ReactNode) | null) => void;
    render: () => ReactNode;
    setFeature: (feature: any) => void;
    clearFeatures: () => void;
}

const IdentifyResult = forwardRef<IdentifyResultHandle>((_, ref) => {
    const mapVM = useMapVM();
    const [features, setFeatures] = useState<Feature<Geometry>[]>([]);
    const [layerTitles, setLayerTitles] = useState<string[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | false>(false);
    const [externalRenderer, setExternalRenderer] = useState<((feature: Feature<Geometry>) => ReactNode) | null>(null);

    const clickListenerRef = useRef<any>(null);

    const renderContent = useCallback(() => {
        if (features.length === 0) {
            return (
                <Box sx={{ p: 1 }}>
                    <Typography>No feature identified at this location.</Typography>
                </Box>
            );
        }

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
                ))}
            </Box>
        );
    }, [features, expandedIndex, externalRenderer, layerTitles, mapVM]);

    useImperativeHandle(ref, () => ({
        setFeatureRenderer: (renderer) => {
            setExternalRenderer(() => renderer);
        },
        render: () => renderContent(),
        setFeature: (feature) => setFeatures(prev => [...prev, feature]),
        clearFeatures: () => setFeatures([]),
    }));

    const displayFeatureInfo = (evt: any) => {
        const map = mapVM.getMap();
        const clickedFeatures: Feature<Geometry>[] = [];
        const clickedLayerTitles: string[] = [];

        map.forEachFeatureAtPixel(evt.pixel, (feature: any, layer: any) => {
            if (layer.get("displayInLayerSwitcher") === true) {
                clickedFeatures.push(feature);
                clickedLayerTitles.push(layer?.get("title") || "Unknown Layer");
            }
        });

        setFeatures(clickedFeatures);
        setLayerTitles(clickedLayerTitles);
        setExpandedIndex(clickedFeatures.length > 0 ? clickedFeatures.length - 1 : false);
    };

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

    useEffect(() => {
        if (
            features.length > 0 &&
            typeof expandedIndex === "number" &&
            features[expandedIndex]
        ) {
            mapVM.getSelectionLayer()?.addFeature(features[expandedIndex]);
        }
    }, [features, expandedIndex]);

    const defaultRenderFeatureContent = (feature: Feature<Geometry>) => {
        const properties = feature.getProperties();
        const keys = Object.keys(properties).filter(k => k !== "geometry");

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
                                displayValue = value.map(v => typeof v === "number" ? v.toFixed(3) : v).join(", ");
                            } else {
                                displayValue = String(value);
                            }

                            return (
                                <TableRow key={key}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>
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

    return renderContent();
});

export default IdentifyResult;
