import AppGuard from "@/components/auth/AppGuard";
import {Box} from "@mui/material";
import MapRoutes from "@/routes/MapRoutes";


const App = () => (
    <AppGuard>
        <Box>
            <MapRoutes/>
        </Box>
    </AppGuard>
);

export default App;
