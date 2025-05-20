import {useParams} from "react-router-dom";

// import TimeSlider, { IDateRange } from "../components/controls/TimeSlider";
// import MVTLayer from "../layers/da_layers/MVTLayer";
import {AppBar, Button, Toolbar, Typography, useTheme} from "@mui/material";
import MapView from "@/components/map/MapView";
import {getMapVM} from "@/components/map/models/MapVMContext";


interface IProps {
    isEditor?: boolean;
}

const DAMap = (props: IProps) => {
    const {mapId = ''} = useParams();

    //@ts-ignore
    // const mapViewRef: React.RefObject<typeof MapView> = useRef();
    // const timeSliderRef: RefObject<TimeSlider> = useRef(null);
    // const sliderRef = useRef<any>(null);

    // const onDateChange = (date: Date) => {
    //     const uuid: string = "3d070b54566111eeaaaeacde48001122";
    //     // @ts-ignore
    //     const daLayer: MVTLayer = mapViewRef?.current?.getMapVM().getDALayer(uuid);
    //     if (daLayer) {
    //         daLayer.updateTemporalData(date);
    //     }
    // };
    //
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         if (mapViewRef.current && !sliderRef.current) {
    //             const mapVM = mapViewRef.current.getMapVM();
    //             if (mapVM) {
    //                 sliderRef.current = mapVM.addTimeSliderControl(timeSliderRef, onDateChange);
    //                 const minDate = new Date();
    //                 minDate.setDate(minDate.getDate() - 10);
    //                 const s: IDateRange = {
    //                     minDate: minDate,
    //                     maxDate: new Date(),
    //                 };
    //                 setTimeout(() => timeSliderRef?.current?.setDateRange(s), 2000);
    //                 clearInterval(interval);
    //             }
    //         }
    //     }, 100);
    //
    //     return () => clearInterval(interval); // Cleanup the interval on unmount
    // }, [timeSliderRef]);

    const handleRandomClick = () => {
        const mapVM = getMapVM()
        mapVM?.showSnackbar("working map VM", "info")
    }

    // const buttonAdded = useRef(false);
    // useEffect(() => {
    //     const mapVM = getMapVM();
    //
    //     if (!buttonAdded.current && mapVM?.getMapToolbar) {
    //         mapVM.getMapToolbar().addButton(
    //             <Tooltip title="Layer of Interest">
    //                 <LOISelector />
    //             </Tooltip>
    //         );
    //         mapVM.setIsDesigner(true);
    //         buttonAdded.current = true;
    //     }
    // }, []);
    const theme = useTheme()
    return (
        <div style={{width: "100%", height: "calc(100% - 30px)"}}>
            {props.isEditor ? (
                <MapView
                    // ref={mapViewRef}
                    uuid={mapId || '-1'}
                    isMap={true}
                    theme={theme}
                >
                    <AppBar>
                        <Toolbar>
                            <Button variant="contained" color="secondary">
                                Test Button
                            </Button>
                        </Toolbar>
                    </AppBar>
                </MapView>
            ) : (
                <MapView uuid={mapId || ''} isMap={true} theme={theme}>
                    <AppBar position="static" color="default" elevation={2}>
                        <Toolbar variant="dense">
                            <Typography variant="h6" sx={{flexGrow: 1}}>
                                Map Toolbar
                            </Typography>
                            <Button variant="contained" color="secondary" onClick={handleRandomClick}>
                                Random
                            </Button>
                        </Toolbar>
                    </AppBar>
                </MapView>
            )}
        </div>
    );
};

export default DAMap;
