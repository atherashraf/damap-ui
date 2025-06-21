import {useParams} from "react-router-dom";

// import TimeSlider, { IDateRange } from "../components/controls/TimeSlider";
// import MVTLayer from "../layers/da_layers/MVTLayer";
import {AppBar, Toolbar, Typography, useTheme} from "@mui/material";
import MapView from "@/components/map/MapView";


interface IProps {
    isEditor?: boolean;
}

const AdminMap = (props: IProps) => {
    const {mapId = ''} = useParams();


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
                            {/*<Button variant="contained" color="secondary">*/}
                            {/*    Test Button*/}
                            {/*</Button>*/}
                        </Toolbar>
                    </AppBar>
                </MapView>
            ) : (
                <MapView uuid={mapId || ''} isMap={true} theme={theme}>
                    <AppBar position="static" color="secondary" elevation={2}>
                        <Toolbar variant="dense">
                            <Typography variant="h6" sx={{flexGrow: 1}}>
                                Map Toolbar
                            </Typography>
                            {/*<Button variant="contained" color="secondary" onClick={handleRandomClick}>*/}
                            {/*    Random*/}
                            {/*</Button>*/}
                        </Toolbar>
                    </AppBar>
                </MapView>
            )}
        </div>
    );
};

export default AdminMap;
