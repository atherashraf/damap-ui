import * as React from "react";
import MapView from "@/components/map/MapView";
import {useParams} from "react-router-dom";
import {useRef, useEffect} from "react";
import {AppBar,  Toolbar, Tooltip, Typography, useTheme} from "@mui/material";
import {getMapVM} from "@/hooks/MapVMContext";
// import SymbologyControl from "@/components/map/toolbar/controls/SymbologyControl";
// import AddIcon from "@mui/icons-material/Add";
import SaveMap from "@/components/map/toolbar/controls/SaveMap"; // any icon you prefer


// const timeSliderRef: RefObject<TimeSliderHandle | null> = React.createRef<TimeSliderHandle | null>();

const MapEditor = () => {
    // const {layerId} = useParams();
    const {mapId = ''} = useParams();

    const buttonAdded = useRef(false);
    useEffect(() => {
        const mapVM = getMapVM();

        if (!buttonAdded.current && mapVM?.getMapToolbar) {
            mapVM.getMapToolbar().addButton(// <SymbologyControl/>
                <Tooltip title="save map">
                    <span><SaveMap/></span>
                </Tooltip>);
            // mapVM.getMapToolbar().addButton(
            //     <Tooltip title={"test"}><IconButton onClick={() => alert("working..")}><AddIcon/></IconButton></Tooltip>
            // )
            mapVM.setIsDesigner(false);
            buttonAdded.current = true;
        }
    }, []);

    const theme = useTheme();
    return (<React.Fragment>
            <MapView uuid={mapId || ''} isMap={true} theme={theme}>
                <AppBar position="static" color="secondary" elevation={2}>
                    <Toolbar variant="dense">
                        <Typography variant="h6" sx={{flexGrow: 1}}>
                            Layer Designer Toolbar
                        </Typography>

                    </Toolbar>
                </AppBar>
            </MapView>
        </React.Fragment>);
};

export default MapEditor;
