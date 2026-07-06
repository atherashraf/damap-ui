import * as React from "react";
import {
    Box,
    Button,
    Divider,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { useMapVM } from "@damap/hooks/MapVMContext";

import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
import Geometry from "ol/geom/Geometry";
import { getArea, getLength } from "ol/sphere";
import { Fill, Stroke, Style, Circle as CircleStyle } from "ol/style";
import { unByKey } from "ol/Observable";
import type { EventsKey } from "ol/events";

import MeasurementConversionUtils, {
    AREA_UNITS,
    LENGTH_UNITS,
    type AreaUnit,
    type LengthUnit,
    type MeasureMode,
    type MeasureUnit,
} from "@damap/components/map/manager/conversionManager";

const TOOL_ID = "measure";

const MeasurementPanel = (): React.ReactElement => {
    const mapVM = useMapVM();
    const drawerRef = mapVM.getRightDrawerRef();

    const [mode, setMode] = React.useState<MeasureMode>("length");
    const [unit, setUnit] = React.useState<MeasureUnit>("m");
    const [rawValue, setRawValue] = React.useState<number>(0);

    const sourceRef = React.useRef<VectorSource | null>(null);
    const layerRef = React.useRef<VectorLayer<VectorSource> | null>(null);
    const drawRef = React.useRef<Draw | null>(null);
    const sketchListenerRef = React.useRef<EventsKey | null>(null);

    const formattedResult = React.useMemo(() => {
        if (mode === "length") {
            return MeasurementConversionUtils.formatLength(
                rawValue,
                unit as LengthUnit
            );
        }

        return MeasurementConversionUtils.formatArea(
            rawValue,
            unit as AreaUnit
        );
    }, [mode, rawValue, unit]);

    const clearSketchListener = React.useCallback(() => {
        if (sketchListenerRef.current) {
            unByKey(sketchListenerRef.current);
            sketchListenerRef.current = null;
        }
    }, []);

    const removeDrawInteraction = React.useCallback(() => {
        const map = mapVM.getMap();
        if (drawRef.current) {
            map.removeInteraction(drawRef.current);
            drawRef.current = null;
        }
        clearSketchListener();
    }, [mapVM, clearSketchListener]);

    const cleanupMeasurement = React.useCallback(() => {
        const map = mapVM.getMap();

        removeDrawInteraction();

        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
        }

        sourceRef.current = null;
        mapVM.setMapCursor("");
    }, [mapVM, removeDrawInteraction]);

    const clearMeasurements = React.useCallback(() => {
        sourceRef.current?.clear();
        setRawValue(0);
    }, []);

    const setupMeasurementArtifacts = React.useCallback(
        (nextMode: MeasureMode) => {
            const map = mapVM.getMap();

            cleanupMeasurement();

            const source = new VectorSource();

            const layer = new VectorLayer({
                source,
                zIndex: 9999,
                style: new Style({
                    stroke: new Stroke({
                        color: "rgba(25,118,210,1)",
                        width: 3,
                    }),
                    fill: new Fill({
                        color: "rgba(25,118,210,0.15)",
                    }),
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({
                            color: "rgba(25,118,210,1)",
                        }),
                        stroke: new Stroke({
                            color: "#ffffff",
                            width: 2,
                        }),
                    }),
                }),
            });

            const draw = new Draw({
                source,
                type: nextMode === "length" ? "LineString" : "Polygon",
            });

            draw.on("drawstart", (evt) => {
                clearSketchListener();

                const geometry = evt.feature.getGeometry();

                sketchListenerRef.current = geometry?.on("change", (e: any) => {
                    const geom = e.target as Geometry;

                    if (geom instanceof LineString) {
                        const value = getLength(geom, {
                            projection: map.getView().getProjection(),
                        });
                        setRawValue(value);
                    } else if (geom instanceof Polygon) {
                        const value = getArea(geom, {
                            projection: map.getView().getProjection(),
                        });
                        setRawValue(value);
                    }
                }) as EventsKey;
            });

            draw.on("drawend", () => {
                clearSketchListener();
            });

            map.addLayer(layer);
            map.addInteraction(draw);

            sourceRef.current = source;
            layerRef.current = layer;
            drawRef.current = draw;
        },
        [mapVM, cleanupMeasurement, clearSketchListener]
    );

    const activateMeasureTool = React.useCallback(
        (nextMode: MeasureMode) => {
            setupMeasurementArtifacts(nextMode);

            mapVM.tools.activateCustomExclusive(
                TOOL_ID,
                (on) => {
                    on("pointermove", () => {}, {
                        esc: {
                            enabled: true,
                            onEsc: () => {
                                cleanupMeasurement();
                                drawerRef.current?.closeDrawer();
                            },
                        },
                    });
                },
                "crosshair",
                {
                    message: {
                        text: "Draw on map to measure. Press ESC to exit.",
                        severity: "info",
                    },
                    esc: {
                        enabled: true,
                        onEsc: () => {
                            cleanupMeasurement();
                            drawerRef.current?.closeDrawer();
                        },
                    },
                }
            );
        },
        [mapVM, drawerRef, setupMeasurementArtifacts, cleanupMeasurement]
    );

    React.useEffect(() => {
        activateMeasureTool(mode);

        return () => {
            cleanupMeasurement();
            mapVM.tools.offCustomTool(TOOL_ID);
        };
    }, [activateMeasureTool, cleanupMeasurement, mapVM.tools, mode]);

    const handleModeChange = (
        _: React.MouseEvent<HTMLElement>,
        value: MeasureMode | null
    ) => {
        if (!value || value === mode) return;

        setMode(value);
        setUnit(value === "length" ? "m" : "m2");
        setRawValue(0);

        cleanupMeasurement();
        mapVM.tools.offCustomTool(TOOL_ID);
        activateMeasureTool(value);
    };

    const handleUnitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUnit(event.target.value as MeasureUnit);
    };

    const handleClose = () => {
        cleanupMeasurement();
        mapVM.tools.offCustomTool(TOOL_ID);
        drawerRef.current?.closeDrawer();
    };

    const unitOptions = mode === "length" ? LENGTH_UNITS : AREA_UNITS;

    return (
        <Box sx={{ width: "100%", p: 1.5 }}>
            <Stack spacing={2}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Measurement Tool
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Draw on the map to measure distance or area.
                    </Typography>
                </Box>

                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    size="small"
                    fullWidth
                >
                    <ToggleButton value="length">Length</ToggleButton>
                    <ToggleButton value="area">Area</ToggleButton>
                </ToggleButtonGroup>

                <TextField
                    select
                    label="Unit"
                    value={unit}
                    onChange={handleUnitChange}
                    size="small"
                    fullWidth
                >
                    {unitOptions.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                            {item.label}
                        </MenuItem>
                    ))}
                </TextField>

                <Divider />

                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Result
                    </Typography>
                    <Typography variant="h6">{formattedResult}</Typography>
                </Box>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button onClick={clearMeasurements}>Clear</Button>
                    <Button color="inherit" onClick={handleClose}>
                        Close
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};

export default MeasurementPanel;