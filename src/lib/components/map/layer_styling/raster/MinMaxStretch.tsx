import React, { useRef, useState } from "react";
import { Box, TextField, Button, FormControl } from "@mui/material";
import ColorRamp from "../atoms/ColorRamp";
import MapVM from "@/components/map/models/MapVM";
import { MapAPIs } from "@/api/MapApi";

interface BandStats {
    mean: number;
    median: number;
    std: number;
    min: number;
    q25: number;
    q75: number;
    max: number;
    sum: number;
}

interface BandInfo {
    bandCount: number;
    bandsInfo: {
        [bandIndex: number]: BandStats;
    };
}

interface Props {
    mapVM: MapVM;
    bandInfo: BandInfo;
}

const MinMaxStretch: React.FC<Props> = ({ mapVM, bandInfo }) => {
    const stats = bandInfo.bandsInfo[0];

    const [minVal, setMinVal] = useState<number>(stats.min);
    const [maxVal, setMaxVal] = useState<number>(stats.max);
    const [ignoreVal, setIgnoreVal] = useState<string>("");

    const colorRampRef = useRef<ColorRamp | null>(null);

    const applyStretch = () => {
        mapVM.showSnackbar("Applying min-max stretch");
        const noOfColor = maxVal >=255 ? 255 : maxVal;
        const colorRamp = colorRampRef.current?.getColorRamp(noOfColor);
        console.log("color ramp", colorRamp);
        if (!colorRamp || colorRamp.length === 0) {
            mapVM.showSnackbar("Color ramp not defined");
            return;
        }

        const payload = {
            min_val: minVal,
            max_val: maxVal,
            palette: colorRamp,
            ignore_val: ignoreVal !== "" ? parseFloat(ignoreVal) : null,
        };

        mapVM
            .getApi()
            .post(MapAPIs.DCH_SAVE_STYLE, payload, {
                uuid: mapVM.getLayerOfInterest(),
                map_uuid: "-1"
            })
            .then(() => {
                mapVM.showSnackbar("Min-Max stretch applied successfully");
                const daLayer = mapVM.getDALayer(mapVM.getLayerOfInterest());
                setTimeout(() => daLayer?.refreshLayer(), 2000);
            });
    };

    return (
        <>
            <Box sx={{ display: "flex", gap: 2, pt: 1 }}>
                <FormControl fullWidth size="small">
                    <TextField
                        type="number"
                        label="Min Value"
                        value={minVal}
                        onChange={(e) => setMinVal(parseFloat(e.target.value))}
                    />
                </FormControl>
                <FormControl fullWidth size="small">
                    <TextField
                        type="number"
                        label="Max Value"
                        value={maxVal}
                        onChange={(e) => setMaxVal(parseFloat(e.target.value))}
                    />
                </FormControl>
            </Box>

            <Box sx={{ pt: 2 }}>
                <FormControl fullWidth size="small">
                    <TextField
                        type="number"
                        label="Ignore Value (Optional)"
                        value={ignoreVal}
                        onChange={(e) => setIgnoreVal(e.target.value)}
                    />
                </FormControl>
            </Box>

            <Box sx={{ pt: 2 }}>Color Ramp:</Box>
            <Box sx={{ pt: 1 }}>
                <ColorRamp ref={colorRampRef} mapVM={mapVM} />
            </Box>

            <Box sx={{ pt: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ width: "100%" }}
                    onClick={applyStretch}
                >
                    Apply Min-Max Stretch
                </Button>
            </Box>
        </>
    );
};

export default MinMaxStretch;
