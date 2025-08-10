import {Routes, Route} from "react-router-dom";
import React, {Suspense} from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import MapInfoAdmin from "@/pages/admin/MapInfoAdmin";
import MapOverlayer from "@/pages/MapOverlayer";
import CustomizeAttributeTable from "@/pages/CustomizeAttributeTable";



const DashboardLayout = React.lazy(() => import("@/layouts/DashboardLayout"));
const MapAdmin = React.lazy(() => import("@/pages/MapAdmin"));
const LayerDesigner = React.lazy(() => import("@/pages/LayerDesigner"));
const LayerInfoAdmin = React.lazy(() => import("@/pages/admin/LayerInfoAdmin"));
const DAMap = React.lazy(() => import("@/pages/DAMap"));
const LoginForm = React.lazy(() => import("@/components/auth/LoginForm"));

const MapRoutes = () => (
    <Suspense fallback={<div style={{padding: "1rem", color: "white"}}>Loading Routes...</div>}>
        <Routes>
            <Route path="/login" element={<LoginForm/>}/>

            <Route element={<DashboardLayout/>}>
                <Route index element={<MapAdmin/>}/>
                <Route path="LayerInfo" element={<AuthGuard><LayerInfoAdmin key="layer-info-key"/></AuthGuard>}/>
                <Route path="MapInfo" element={<AuthGuard><MapInfoAdmin key="map-info-key" /></AuthGuard>} />

                <Route path="designer/:layerId/" element={<AuthGuard><LayerDesigner /></AuthGuard>} />
                <Route path="ViewMap/:mapId/" element={<DAMap />} />
                {/*<Route path="EditMap/:mapId/" element={<DAMap isEditor />} />*/}
                <Route path={"MapOverlays"} element={<MapOverlayer/>} />
                <Route path={"CustomizeAttributeTable"} element={<CustomizeAttributeTable />} />
            </Route>

            {/*<Route path="*" element={<Navigate to="/" replace />} />*/}
            {/*<Route path="*" element={<Navigate to="/login" replace />} />*/}

        </Routes>
    </Suspense>
);

export default MapRoutes;
