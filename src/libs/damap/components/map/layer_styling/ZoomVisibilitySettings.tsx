import * as React from "react";
import { Box, Button, Typography, Stack } from "@mui/material";
import MapVM from "@damap/components/map/models/MapVM";
import DANumberField from "@damap/components/base/DANumberField";
import {MapAPIs} from "@/libs/damap";


export interface ZoomVisibilitySettingProps {
    mapVM: MapVM;
    activeUuid: string;
}

const ZoomVisibilitySetting = ({ mapVM, activeUuid }: ZoomVisibilitySettingProps) => {
    // 1. Retrieve the layer instance based on the active UUID passed down
    const daLayer = mapVM.getDALayer(activeUuid);

    // 2. Read fallback values safely out of our database model instance
    const zoomRange = daLayer?.layerInfo?.zoom_range || [0, 24];
    const [minZoom, setMinZoom] = React.useState<number>(zoomRange[0] ?? 0);
    const [maxZoom, setMaxZoom] = React.useState<number>(zoomRange[1] ?? 24);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);

    // 3. Keep inputs updated if the user selects a different layer
    React.useEffect(() => {
        if (daLayer?.layerInfo?.zoom_range) {
            setMinZoom(daLayer.layerInfo.zoom_range[0] ?? 0);
            setMaxZoom(daLayer.layerInfo.zoom_range[1] ?? 24);
        }
    }, [activeUuid, daLayer]);

    // 4. Input boundary validations
    const handleZoomChange = (newMin: number, newMax: number) => {
        let cleanMin = newMin;
        const cleanMax = newMax;

        if (cleanMin > cleanMax) {
            cleanMin = cleanMax;
        }

        setMinZoom(cleanMin);
        setMaxZoom(cleanMax);

        // Mutate the local layer state immediately for local UI tracking
        if (daLayer?.layerInfo) {
            daLayer.layerInfo.zoom_range = [cleanMin, cleanMax];
        }
    };

    // 5. Commit payload directly to the new dedicated backend router endpoint
    const handleSaveVisibility = async () => {
        setIsSaving(true);
        try {
            // const response = await fetch(`/api/dch/admin/update_layer_zoom/${activeUuid}/`, {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify({
            //         zoom_range: [minZoom, maxZoom]
            //     })
            // });
            const response = await mapVM.api.post(MapAPIs.DCH_LAYER_VISIBILITY_ZOOM,
                {zoom_range: [minZoom, maxZoom]},{uuid:activeUuid} )
            if (response){
                mapVM.showSnackbar("Visibility range saved successfully.");
            }
            // if (!response.ok) {
            //     throw new Error("Failed to save visibility configuration.");
            // }

            console.log("Layer visibility constraint array saved successfully.");
        } catch (err) {
            console.error("Error updating scale range parameters:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ mb: 3, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
                Visibility Zoom Limits
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                <DANumberField
                    label="Min Zoom"
                    size="small"
                    min={0}
                    max={24}
                    value={minZoom}
                    onValueChange={(val: number) => handleZoomChange(val, maxZoom)}
                    fullWidth
                />
                <DANumberField
                    label="Max Zoom"
                    size="small"
                    min={0}
                    max={24}
                    value={maxZoom}
                    onValueChange={(val: number) => handleZoomChange(minZoom, val)}
                    fullWidth
                />
            </Stack>

            <Button
                size="small"
                variant="outlined"
                color="secondary"
                fullWidth
                disabled={isSaving}
                onClick={handleSaveVisibility}
            >
                {isSaving ? "Saving Boundaries..." : "Save Visibility Range"}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Determines map scale boundaries where this asset layer stays visible.
            </Typography>
        </Box>
    );
};

export default ZoomVisibilitySetting;