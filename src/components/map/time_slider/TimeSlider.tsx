import {
    Box,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Slider,
    Typography,
} from "@mui/material";
import {
    forwardRef, useEffect,
    useImperativeHandle,
    useState,
} from "react";
import MapVM from "@/components/map/models/MapVM.ts";


export interface IDateRange {
    minDate: Date;
    maxDate: Date;
}

interface TimeSliderProps {
    mapVM: MapVM;
    onDateChange: (date: Date) => void;
}

const TimeSlider = forwardRef((props: TimeSliderProps, ref) => {
    const {mapVM, onDateChange} = props;

    const [selectedLayerUUID, setSelectedLayerUUID] = useState<string>("");
    const [minDate, setMinDate] = useState<Date | null>(null);
    const [maxDate, setMaxDate] = useState<Date | null>(null);
    const [currentDayOffset, setCurrentDayOffset] = useState<number>(0);

    const temporalLayerOptions = Object.keys(mapVM.temporalLayers).map((uuid) => ({
        uuid,
        title: mapVM.temporalLayers[uuid].getLayerTitle(),
    }));

    useImperativeHandle(ref, () => ({
        setDateRange: ({minDate, maxDate}: IDateRange) => {
            setMinDate(minDate);
            setMaxDate(maxDate);
            setCurrentDayOffset(getDayOffset(maxDate, minDate));
        },
    }));

    const getDayOffset = (d1: Date, d0: Date) => {
        return Math.round((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getDateFromOffset = (offset: number) => {
        if (!minDate) return null;
        const d = new Date(minDate);
        d.setDate(d.getDate() + offset);
        return d;
    };

    const handleSliderChange = (_: Event, value: number | number[]) => {
        const offset = Array.isArray(value) ? value[0] : value;
        setCurrentDayOffset(offset);
        const selectedDate = getDateFromOffset(offset);
        if (selectedDate) onDateChange(selectedDate);
    };

    const handleLayerChange = (event: SelectChangeEvent) => {
        const uuid = event.target.value;
        setSelectedLayerUUID(uuid);

        // Set default range (you can customize this with metadata later)
        const defaultMin = new Date("2023-07-23");
        const defaultMax = new Date("2023-09-23");
        setMinDate(defaultMin);
        setMaxDate(defaultMax);
        setCurrentDayOffset(getDayOffset(defaultMax, defaultMin));
    };

    useEffect(() => {
        if (
            temporalLayerOptions.length > 0 &&
            !selectedLayerUUID
        ) {
            const firstUUID = temporalLayerOptions[0].uuid;
            setSelectedLayerUUID(firstUUID);

            // Set default date range (can be replaced with real metadata)
            const defaultMin = new Date("2023-07-23");
            const defaultMax = new Date("2023-09-23");
            setMinDate(defaultMin);
            setMaxDate(defaultMax);
            setCurrentDayOffset(
                getDayOffset(defaultMax, defaultMin)
            );
        }
    }, [temporalLayerOptions, selectedLayerUUID]);


    return (
        <Box
            sx={{
                mx: 1,
                p: 1,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 1,
                backdropFilter: "blur(4px)",
                boxShadow: 2,
                width: "97%",
            }}
        >
            <Grid
                container
                spacing={2}
                alignItems="center"
                justifyContent={"stretch"}
            >
                {/* Layer Selector */}
                <Grid size={{xs: 12, sm: 4}}>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Temporal Layer</InputLabel>
                        <Select
                            value={selectedLayerUUID}
                            label="Temporal Layer"
                            onChange={handleLayerChange}
                        >
                            {temporalLayerOptions.map(({uuid, title}) => (
                                <MenuItem key={uuid} value={uuid}>
                                    {title}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Slider Section */}
                {minDate && maxDate && (
                    <Grid size={{xs: 12, sm: 8}}>

                        <Box
                            sx={{
                                border: "1px solid rgba(0, 0, 0, 0.2)",
                                borderRadius: 1,
                                py: 1,
                                px: 5,
                                position: "relative",
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    position: "absolute",
                                    top: -10,
                                    left: 8,
                                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                                    px: 0.5,
                                    fontSize: "0.75rem",
                                    color: "rgba(0, 0, 0, 0.9)",
                                }}
                            >
                                {getDateFromOffset(currentDayOffset)?.toDateString()}

                            </Typography>

                            <Slider
                                value={currentDayOffset}
                                min={0}
                                max={getDayOffset(maxDate, minDate)}
                                step={1}
                                onChange={handleSliderChange}
                                size="small"
                            />
                        </Box>


                    </Grid>
                )}
            </Grid>
        </Box>
    );


});

export default TimeSlider;
