import * as React from "react";
import MapView from "@/components/map/MapView.tsx";
import {useParams} from "react-router-dom";
import {RefObject, useRef, useEffect} from "react";
import TimeSlider, {IDateRange} from "@/components/map/widgets/TimeSlider";
import MVTLayer from "@/components/map/layers/da_layers/MVTLayer";
import TimeSliderControl from "@/components/map/widgets/TimeSliderControl.tsx";
import {AppBar, Button, Toolbar, Typography} from "@mui/material";

const timeSliderRef: RefObject<TimeSlider | null> = React.createRef<TimeSlider>();

const LayerDesigner = () => {
    const {layerId} = useParams();
    // console.log("layerId", layerId);
    //@ts-ignore
    const mapContainerRef: React.RefObject<MapView> = useRef();
    const sliderRef = useRef<TimeSliderControl | null>(null);
    // let slider: TimeSliderControl
    // const layerId = "2378481c-cfe1-11ed-924d-367dda4cf16d"
    // const layerId = "6e0f2ab0-d53d-11ed-82a6-acde48001122"
    // const layerId = "04fc474e-da80-11ed-85fe-601895253350"

    const onDateChange = (date: Date) => {
        // console.log("on date change", date)
        const uuid: string = "3d070b54566111eeaaaeacde48001122";
        // @ts-ignore
        const daLayer: MVTLayer = mapContainerRef?.current?.getMapVM().getDALayer(uuid);
        if (daLayer) {
            daLayer.updateTemporalData(date);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (mapContainerRef.current && !sliderRef.current) {
                const mapVM = mapContainerRef?.current?.getMapVM();
                if (mapVM) {
                    //@ts-ignore
                    sliderRef.current = mapVM.addTimeSliderControl(timeSliderRef, onDateChange);
                    const minDate = new Date();
                    minDate.setDate(minDate.getDate() - 10);
                    const s: IDateRange = {
                        minDate: minDate,
                        maxDate: new Date(),
                    };
                    setTimeout(() => timeSliderRef?.current?.setDateRange(s), 2000);
                    clearInterval(interval);
                }
            }
        }, 100);

        return () => clearInterval(interval); // Cleanup the interval on unmount
    }, []);

    function handleRandomClick() {
        alert("Random Click");
    }

    return (
        <React.Fragment>
            <MapView uuid={layerId} isMap={false} isDesigner={true}>
                <AppBar position="static" color="default" elevation={2}>
                    <Toolbar variant="dense">
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Map Toolbar
                        </Typography>
                        <Button variant="contained" color="secondary" onClick={handleRandomClick}>
                            Random
                        </Button>
                    </Toolbar>
                </AppBar>
            </MapView>
        </React.Fragment>
    );
};

export default LayerDesigner;
