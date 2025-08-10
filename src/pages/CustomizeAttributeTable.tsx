import {AppBar, Paper, } from "@mui/material";
import CropToolbar from "@/components/test/CropToolbar";
import MapView from "@/components/map/MapView";



const CustomizeAttributeTable = () => {
    const appbarHeight = 50;
    const map_uuid = "df1326f6-06cc-11ee-b6fc-aae473ddcb05"
    // const theme = useTheme()
    return (
        <>

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
                <MapView uuid={map_uuid}>
                    <AppBar position="static" sx={{height: appbarHeight}} color={"secondary"}>
                        <CropToolbar />
                    </AppBar>
                </MapView>
            </Paper>
        </>
    );
}
export default CustomizeAttributeTable;