import {Routes, Route} from "react-router-dom";
import React, {Suspense} from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import MapInfoAdmin from "@/pages/admin/MapInfoAdmin";
import MapOverlayer from "@demo/pages/MapOverlayer";
import CustomizeAttributeTable from "@demo/pages/CustomizeAttributeTable";
import TestIDWLayer from "@demo/pages/TestIDWLayer";
import GISViewer from "@demo/pages/GISViewer";
import GeoServerTest from "@demo/pages/GeoserverTest";



const DashboardLayout = React.lazy(() => import("@demo//layouts/DashboardLayout"));
const MapAdmin = React.lazy(() => import("@demo/pages/MapAdmin"));
const MapEditor = React.lazy(() => import("@/pages/admin/MapEditor"));
const LayerDesigner = React.lazy(() => import("@/pages/LayerDesigner"));
const LayerInfoAdmin = React.lazy(() => import("@/pages/admin/LayerInfoAdmin"));
const DAMap = React.lazy(() => import("@/pages/DAMap"));
const LoginForm = React.lazy(() => import("@/components/auth/LoginForm"));
// const GISViewer = React.lazy(() => import("@/pages/GISViewer"));


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
                <Route path="EditMap/:mapId/" element={<MapEditor />} />
                <Route path={"MapOverlays"} element={<MapOverlayer />} />
                <Route path={"CustomizeAttributeTable"} element={<CustomizeAttributeTable />} />
                <Route path={"TestIDWLayer"} element={<TestIDWLayer />} />

            </Route>
            <Route path={"/GeoserverTest"} element={<GeoServerTest />} />
            <Route path={"/GISViewer"} element={<GISViewer />} />
            {/*<Route path="*" element={<Navigate to="/" replace />} />*/}
            {/*<Route path="*" element={<Navigate to="/login" replace />} />*/}

        </Routes>
    </Suspense>
);

export default MapRoutes;
