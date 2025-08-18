import {AppBar, Paper} from "@mui/material";
import MapView from "@/components/map/MapView";
import GroundWaterToolbar from "@/components/test/GroundWaterToolbar";




const TestIDWLayer = () => {
    const appbarHeight = 50;
    return (
        <Paper
            elevation={6}
            sx={{
                width: "100%",
                // height: `calc(100% - ${infoGridHeight}px - ${appbarHeight}px)`,
                height: "500px",
                minHeight: "300px",
                p: 0,
                m: 0,
            }}
        >
            <MapView  uuid={"f11f37f9-e96d-11ed-b488-601895253350"}>
                <AppBar position="static" sx={{height: appbarHeight}} color={"secondary"}>
                    <GroundWaterToolbar />
                </AppBar>
            </MapView>
        </Paper>
    )
}
export default TestIDWLayer;