import * as React from "react";
import MapView from "@/components/map/MapView";
import {useParams} from "react-router-dom";
import {useRef, useEffect} from "react";
import {AppBar,  IconButton, Toolbar, Tooltip, Typography, useTheme} from "@mui/material";
import {getMapVM} from "@/hooks/MapVMContext";
import SymbologyControl from "@/components/map/toolbar/controls/SymbologyControl";
import AddIcon from "@mui/icons-material/Add"; // any icon you prefer


// const timeSliderRef: RefObject<TimeSliderHandle | null> = React.createRef<TimeSliderHandle | null>();

const LayerDesigner = () => {
    const {layerId} = useParams();



    const buttonAdded = useRef(false);
    useEffect(() => {
        const mapVM = getMapVM();

        if (!buttonAdded.current && mapVM?.getMapToolbar) {
            mapVM.getMapToolbar().addButton(
                <SymbologyControl/>
            );
            mapVM.getMapToolbar().addButton(
                <Tooltip title={"test"}><IconButton onClick={() => alert("working..")}><AddIcon/></IconButton></Tooltip>
            )
            mapVM.setIsDesigner(true);
            buttonAdded.current = true;
        }
    }, []);

    const theme = useTheme();
    return (
        <React.Fragment>
            <MapView uuid={layerId || ''} isMap={false} theme={theme}>
                <AppBar position="static" color="secondary" elevation={2}>
                    <Toolbar variant="dense">
                        <Typography variant="h6" sx={{flexGrow: 1}}>
                            Layer Designer Toolbar
                        </Typography>

                    </Toolbar>
                </AppBar>
            </MapView>
        </React.Fragment>
    );
};

export default LayerDesigner;
