// MapPanel.tsx
import {
    useEffect,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle
} from "react";
import {Paper} from "@mui/material";
import MapVM from "@/components/map/models/MapVM";



export interface MapPanelHandle {
    getMapHeight: () => number;
    getMaxMapHeight: () => number;
    resizeMapDiv: (height: number) => void;

}

interface MapPanelProps {
    mapVM: MapVM;
}

const mapDivId = "map";

const MapPanel = forwardRef<MapPanelHandle, MapPanelProps>(({}, ref) => {
    // const rightDrawer = mapVM.getRightDrawerRef().current;

    const [totalMapHeight, setTotalMapHeight] = useState(0);
    const [mapDivHeight, setMapDivHeight] = useState<string>("100%");
    const mapDivRef = useRef<HTMLDivElement | null>(null);

    const resizeMapDiv = (paperHeight: number) => {
        const newHeight =
            paperHeight === 0 || totalMapHeight < paperHeight
                ? `${totalMapHeight}px`
                : `${totalMapHeight - paperHeight}px`;
        setMapDivHeight(newHeight);
    };





    useImperativeHandle(ref, () => ({
        getMapHeight: () => totalMapHeight,
        getMaxMapHeight: () => 300,
        resizeMapDiv,

    }));

    useEffect(() => {
        const mapHeight = document.getElementById(mapDivId)?.clientHeight;
        if (mapHeight) setTotalMapHeight(mapHeight);
    }, []);

    return (
        <Paper sx={{width: "100%", height: "auto"}} elevation={6}>
            <div
                id={mapDivId}
                ref={mapDivRef}
                style={{width: "100%", height: mapDivHeight}}
            />
        </Paper>
    );
});

export default MapPanel;
