import AppGuard from "@/components/auth/AppGuard";
import {Box} from "@mui/material";
import MapRoutes from "@/routes/MapRoutes.tsx";


const App = () => (
    <AppGuard>
        <Box>
            <MapRoutes/>
        </Box>
    </AppGuard>
);

export default App;
