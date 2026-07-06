import { useEffect, useRef, useState } from "react";
import {
    Box,
    Button, Divider,
    FormControl,
    InputLabel,
    MenuItem,
    SelectChangeEvent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
} from "@mui/material";

import {
    DAFieldSet,
    DASelect,
} from "@damap/components/styled/styledMapComponents";

import {
    IFeatureStyle,
    isLabelableLayer,
} from "@damap/types/typeDeclarations";

import { MapAPIs } from "@damap/api/MapApi";
import MapVM from "@damap/components/map/models/MapVM";

import BaseStyleForm from "./vector/BaseStyleForm";
import SingleStyleForm from "./vector/SingleStyleForm";
import DensityStyleForm from "./vector/DensityStyleForm";
import MultipleStyleForm from "./vector/MultipleStyleForm";
import SLDForm from "./SLDForm";
import TextStyleForm from "@damap/components/map/layer_styling/vector/TextStyleForm";
import ZoomVisibilitySetting from "@damap/components/map/layer_styling/ZoomVisibilitySettings";

interface IVectorStylingProps {
    mapVM: MapVM;
}

type StyleType = "" | "sld" | "single" | "multiple" | "density";

const VectorStyling = ({ mapVM }: IVectorStylingProps) => {
    const geomFormRef = useRef<BaseStyleForm | null>(null);
    const textFormRef = useRef<BaseStyleForm | null>(null);

    const [styleType, setStyleType] = useState<StyleType>("");

    const styleTypes: { name: string; val: Exclude<StyleType, ""> }[] = [
        { name: "SLD / DA Style", val: "sld" },
        { name: "Single", val: "single" },
        { name: "Multiple", val: "multiple" },
        { name: "Density", val: "density" },
    ];

    const layerId = mapVM.getLayerOfInterest();
    const daLayer = layerId ? mapVM.getDALayer(layerId) : undefined;
    const currentStyle = daLayer?.style;
    const isLabelable = isLabelableLayer(daLayer);
    const isDisable = !(mapVM.isMapEditor || mapVM.isLayerDesigner());

    useEffect(() => {
        if (currentStyle?.type) {
            setStyleType(currentStyle.type as StyleType);
        } else {
            setStyleType("");
        }
    }, [currentStyle?.type]);

    if (!layerId) return null;

    const updateStyle = (style?: IFeatureStyle | null) => {
        const layer = mapVM.getDALayer(layerId);
        if (!layer) return;

        layer.style = style || undefined;

        if (isLabelableLayer(layer)) {
            if (style?.text) {
                layer.setLabelProperty(style.text.labelField || "");
                layer.setTextStyle(style.text.style || {});
                layer.setShowLabel(style.text.showLabel ?? true);
            } else {
                layer.setLabelProperty("");
                layer.setTextStyle({});
                layer.setShowLabel(false);
            }
        }

        layer.updateStyle();

        if (typeof mapVM.refreshMap === "function") {
            mapVM.refreshMap();
        }
    };

    const handleSelectType = (event: SelectChangeEvent<unknown>) => {
        setStyleType(event.target.value as StyleType);
    };

    const handleSaveStyle = async () => {
        try {
            if (styleType === "sld") {
                mapVM.showSnackbar("SLD style is managed separately");
                return;
            }

            if (!geomFormRef.current?.getFeatureStyle) {
                mapVM.showSnackbar("Style form is not ready");
                return;
            }

            const geomStyle = geomFormRef.current.getFeatureStyle();

            const textStyle =
                isLabelable && textFormRef.current?.getFeatureStyle
                    ? textFormRef.current.getFeatureStyle()
                    : undefined;

            const finalStyle: IFeatureStyle | undefined = geomStyle
                ? {
                    ...geomStyle,
                    ...(textStyle?.text ? { text: textStyle.text } : {}),
                }
                : textStyle;

            if (!finalStyle) {
                mapVM.showSnackbar("No style selected");
                return;
            }

            const mapUUID = mapVM.isMapEditor
                ? mapVM.getMapUUID() ?? "-1"
                : "-1";

            await mapVM.getApi().post(MapAPIs.DCH_SAVE_STYLE, finalStyle, {
                uuid: layerId,
                map_uuid: mapUUID,
            });

            updateStyle(finalStyle);
            mapVM.showSnackbar("Style saved successfully");
        } catch (error) {
            console.error("Error saving style:", error);
            mapVM.showSnackbar("Failed to save style");
        }
    };

    const handleRemoveStyle = async () => {
        try {
            mapVM.showSnackbar("Removing style");

            const mapUUID = mapVM.isMapEditor
                ? mapVM.getMapUUID() ?? "-1"
                : "-1";

            await mapVM.getApi().post(MapAPIs.DCH_SAVE_STYLE, {}, {
                uuid: layerId,
                map_uuid: mapUUID,
            });

            updateStyle(undefined);
            mapVM.showSnackbar("Style removed successfully");
        } catch (error) {
            console.error("Error removing style:", error);
            mapVM.showSnackbar("Failed to remove style");
        }
    };

    const renderGeometryStyleForm = () => {
        switch (styleType) {
            case "sld":
                return <SLDForm mapVM={mapVM} />;

            case "single":
                return (
                    <SingleStyleForm
                        key={`single-style-${layerId}`}
                        layerId={layerId}
                        mapVM={mapVM}
                        ref={(ref) => {
                            geomFormRef.current = ref;
                        }}
                    />
                );

            case "density":
                return (
                    <DensityStyleForm
                        key={`density-style-${layerId}`}
                        layerId={layerId}
                        mapVM={mapVM}
                        ref={(ref) => {
                            geomFormRef.current = ref;
                        }}
                    />
                );

            case "multiple":
                return (
                    <MultipleStyleForm
                        key={`multiple-style-${layerId}`}
                        layerId={layerId}
                        mapVM={mapVM}
                        ref={(ref) => {
                            geomFormRef.current = ref;
                        }}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <DAFieldSet>
            <legend>Vector Styling</legend>
            {/* 💡 RENDER THE ISOLATED VISIBILITY CONTROLLER COMPONENT HERE */}

            <Accordion defaultExpanded={false} sx={{ mt: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Visibility Setting</Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 1 }}>
                    <ZoomVisibilitySetting mapVM={mapVM} activeUuid={layerId} />
                </AccordionDetails>
            </Accordion>
            <Divider sx={{ my: 2 }} />


            <FormControl fullWidth size="small">
                <InputLabel id="style-type-label">Style Type</InputLabel>
                <DASelect
                    labelId="style-type-label"
                    id="style-type-select"
                    value={styleType}
                    label="Style Type"
                    onChange={handleSelectType}
                >
                    {styleTypes.map(({ name, val }) => (
                        <MenuItem key={val} value={val}>
                            {name}
                        </MenuItem>
                    ))}
                </DASelect>
            </FormControl>

            {styleType !== "" && (
                <Accordion defaultExpanded sx={{ mt: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Geometry Styling</Typography>
                    </AccordionSummary>

                    <AccordionDetails sx={{ p: 1 }}>
                        {renderGeometryStyleForm()}
                    </AccordionDetails>
                </Accordion>
            )}

            {isLabelable && styleType !== "" && styleType !== "sld" && (
                <Accordion sx={{ mt: 1 }} defaultExpanded={!!currentStyle?.text}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Text / Label Styling</Typography>
                    </AccordionSummary>

                    <AccordionDetails sx={{ p: 1 }}>
                        <TextStyleForm
                            key={`text-style-${layerId}`}
                            layerId={layerId}
                            mapVM={mapVM}
                            ref={(ref) => {
                                textFormRef.current = ref;
                            }}
                        />
                    </AccordionDetails>
                </Accordion>
            )}

            {styleType !== "sld" && styleType !== "" && (
                <Box sx={{ m: 1 }}>
                    <Button
                        fullWidth
                        color="success"
                        variant="contained"
                        onClick={handleSaveStyle}
                        disabled={isDisable}
                    >
                        Save Style
                    </Button>
                </Box>
            )}

            <Box sx={{ m: 1 }}>
                <Button
                    fullWidth
                    color="primary"
                    variant="contained"
                    onClick={handleRemoveStyle}
                    disabled={isDisable}
                >
                    Remove Style
                </Button>
            </Box>
        </DAFieldSet>
    );
};

export default VectorStyling;