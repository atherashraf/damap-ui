import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Slider,
    Typography,
    Grid
} from "@mui/material";
import {
    forwardRef, useCallback, useEffect,
    useImperativeHandle, useRef,
    useState
} from "react";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import MapVM from "@/components/map/models/MapVM";
import AbstractDALayer from "@/components/map/layers/da_layers/AbstractDALayer";


export interface IDateRange {
    minDate: Date | string;
    maxDate: Date | string;
}

interface ITimeSliderProps {
    mapVM: MapVM;
    onDateChange?: (date: Date) => void;
}

export interface TimeSliderHandle {
    setDateRange: (range: IDateRange) => void;
    getSelectedDate?: () => Date | null;
    getSelectedLayer?: () => AbstractDALayer | null;
    hasControl: boolean
}

const TimeSlider = forwardRef<TimeSliderHandle, ITimeSliderProps>((props, ref) => {
    const {mapVM} = props;
    const sliderRef = useRef<HTMLSpanElement | null>(null); // MUI Slider renders as a <span>

    const [selectedLayerUUID, setSelectedLayerUUID] = useState<string>("");
    const [currentDayOffset, setCurrentDayOffset] = useState<number>(0);

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const [minDate, setMinDate] = useState<Date | null>(yesterday);
    const [maxDate, setMaxDate] = useState<Date | null>(today);


    const temporalLayerOptions = Object.keys(mapVM.temporalLayers).map((uuid) => ({
        uuid,
        title: mapVM.temporalLayers[uuid].getLayerTitle(),
    }));

    function toValidDate(input: Date | string): Date | null {
        const date = input instanceof Date ? input : new Date(input);
        return isNaN(date.getTime()) ? null : date;
    }

    useImperativeHandle(ref, () => ({
        hasControl: false,
        setDateRange: ({minDate, maxDate}: IDateRange) => {
            const parsedMin = toValidDate(minDate);
            const parsedMax = toValidDate(maxDate);

            if (!parsedMin || !parsedMax) {
                console.warn("Invalid date range passed to setDateRange", {minDate, maxDate});
                return;
            }

            setMinDate(parsedMin);
            setMaxDate(parsedMax);
            setCurrentDayOffset(getDayOffset(parsedMax, parsedMin));
        },
        getSelectedDate: (): Date | null => {
            return getDateFromOffset(currentDayOffset);
        },
        getSelectedLayer: (): AbstractDALayer | null => {
            if (!selectedLayerUUID) return null;
            return mapVM.temporalLayers[selectedLayerUUID];
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
        getDateRange(uuid);
    };

    const getDateRange = (uuid: string) => {
        const layerInfo = mapVM.temporalLayers[uuid].layerInfo;
        const url = layerInfo.dateRangeURL;
        if (url)
            mapVM.getApi().get(url).then((payload: IDateRange) => {
                const defaultMin = toValidDate(payload.minDate);
                const defaultMax = toValidDate(payload.maxDate);

                if (!defaultMin || !defaultMax) {
                    console.warn("Invalid dates in API response", payload);
                    return;
                }

                setMinDate(defaultMin);
                setMaxDate(defaultMax);
                setCurrentDayOffset(getDayOffset(defaultMax, defaultMin));
            });
    };

    useEffect(() => {
        if (temporalLayerOptions.length > 0 && !selectedLayerUUID) {
            const firstUUID = temporalLayerOptions[0].uuid;
            setSelectedLayerUUID(firstUUID);
            getDateRange(firstUUID);
        }
    }, [temporalLayerOptions, selectedLayerUUID]);

    function useDebouncedCallback<T extends (...args: any[]) => void>(
        callback: T,
        delay: number
    ): T {
        const timer = useRef<NodeJS.Timeout | null>(null);

        return useCallback((...args: any[]) => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
            timer.current = setTimeout(() => {
                callback(...args);
            }, delay);
        }, [callback, delay]) as T;
    }

    const debouncedPropHandler = useDebouncedCallback((date: Date) => {
        props.onDateChange?.(date);
    }, 300);

    const debouncedUpdateLayer = useDebouncedCallback((date: Date) => {
        const daLayer = mapVM.temporalLayers[selectedLayerUUID];
        daLayer.updateTemporalData(date);
    }, 300);

    const onDateChange = (date: Date) => {
        if (props.onDateChange) {
            debouncedPropHandler(date);
        } else {
            debouncedUpdateLayer(date);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!minDate || !maxDate) return;

            const maxOffset = getDayOffset(maxDate, minDate);

            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                setCurrentDayOffset((prev) => {
                    const next = Math.max(prev - 1, 0);
                    const nextDate = getDateFromOffset(next);
                    if (nextDate) onDateChange(nextDate);
                    return next;
                });
            } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                setCurrentDayOffset((prev) => {
                    const next = Math.min(prev + 1, maxOffset);
                    const nextDate = getDateFromOffset(next);
                    if (nextDate) onDateChange(nextDate);
                    return next;
                });
            }
        };

        // Attach global listener
        window.addEventListener("keydown", handleKeyDown);

        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [minDate, maxDate]); // make sure to track these as dependencies


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
            <Grid container spacing={2} alignItems="center" justifyContent="stretch">
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

                {/* Date Picker + Slider */}
                {minDate && maxDate && (
                    <Grid container spacing={2} size={{xs: 12, sm: 8}}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            {/* Date Picker */}
                            <Grid size={{xs: 12, md: 5}}>
                                <DatePicker
                                    label="Select Date"
                                    value={getDateFromOffset(currentDayOffset)}
                                    minDate={minDate}
                                    maxDate={maxDate}
                                    onChange={(newValue: Date | null) => {
                                        if (!newValue || !minDate) return;
                                        const newOffset = getDayOffset(newValue, minDate);
                                        setCurrentDayOffset(newOffset);
                                        onDateChange(newValue);
                                    }}
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            fullWidth: true,
                                        },
                                    }}
                                />
                            </Grid>

                            {/* Slider */}
                            <Grid size={{xs: 12, md: 7}}>
                                <Box
                                    sx={{
                                        position: "relative",
                                        border: "1px solid rgba(0, 0, 0, 0.2)",
                                        borderRadius: 1,
                                        py: 1,
                                        px: 2,
                                        backgroundColor: "rgba(255, 255, 255, 0.4)",
                                        width: "90%", // ✅ ensure full width
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            position: "absolute",
                                            top: -10,
                                            left: 8,
                                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                                            px: 0.5,
                                            fontSize: "0.75rem",
                                            color: "rgba(0, 0, 0, 0.9)",
                                        }}
                                    >
                                        {getDateFromOffset(currentDayOffset)?.toDateString()}
                                    </Typography>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            width: "100%",
                                        }}
                                    >
                                        {/* Minus Button */}
                                        <Box
                                            sx={{
                                                border: "1px solid rgba(0,0,0,0.2)",
                                                borderRadius: 1,
                                                px: 1.5,
                                                py: 0.5,
                                                cursor: "pointer",
                                                backgroundColor: "rgba(255,255,255,0.6)",
                                                userSelect: "none",
                                            }}
                                            onClick={() => {
                                                setCurrentDayOffset((prev) => {
                                                    const next = Math.max(prev - 1, 0);
                                                    const nextDate = getDateFromOffset(next);
                                                    if (nextDate) onDateChange(nextDate);
                                                    return next;
                                                });
                                            }}
                                        >
                                            <Typography variant="body2">➖</Typography>
                                        </Box>

                                        {/* Slider */}
                                        <Slider
                                            value={currentDayOffset}
                                            ref={sliderRef}
                                            min={0}
                                            max={getDayOffset(maxDate, minDate)}
                                            step={1}
                                            onChange={handleSliderChange}
                                            size="small"
                                            sx={{flexGrow: 1}}
                                        />

                                        {/* Plus Button */}
                                        <Box
                                            sx={{
                                                border: "1px solid rgba(0,0,0,0.2)",
                                                borderRadius: 1,
                                                px: 1.5,
                                                py: 0.5,
                                                cursor: "pointer",
                                                backgroundColor: "rgba(255,255,255,0.6)",
                                                userSelect: "none",
                                            }}
                                            onClick={() => {
                                                setCurrentDayOffset((prev) => {
                                                    const max = getDayOffset(maxDate!, minDate!);
                                                    const next = Math.min(prev + 1, max);
                                                    const nextDate = getDateFromOffset(next);
                                                    if (nextDate) onDateChange(nextDate);
                                                    return next;
                                                });
                                            }}
                                        >
                                            <Typography variant="body2">➕</Typography>
                                        </Box>
                                    </Box>


                                </Box>
                            </Grid>

                        </LocalizationProvider>
                    </Grid>
                )}


            </Grid>
        </Box>
    );
});

export default TimeSlider;
