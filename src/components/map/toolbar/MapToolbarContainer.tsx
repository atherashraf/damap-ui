/**
 * MapToolbarContainer — Central component to render OpenLayers toolbar buttons.
 *
 * This component provides context (`MapToolbarVMContext`) so that all buttons inside
 * can access the shared MapVM instance without requiring prop-drilling.
 *
 * Usage:
 * 1. Render it inside your MapToolbar control class:
 *
 *    const root = createRoot(element);
 *    root.render(<MapToolbarContainer mapVM={mapVM} />);
 *
 * 2. Add static or dynamic buttons:
 *    - Static buttons like <AddLayer /> and <LayerSwitcherControl /> are rendered directly.
 *    - You can pass `dynamicButtons` prop for externally injected buttons.
 *
 * 3. Inside a button, use `useMapVM()` to access mapVM:
 *
 *    ```tsx
 *    import { useMapVM } from "@/components/map/toolbar/MapToolbarVMContext";
 *    import { IconButton } from "@mui/material";
 *
 *    const MyButton = () => {
 *      const mapVM = useMapVM();
 *      return <IconButton onClick={() => mapVM.zoomToFullExtent()}>Zoom</IconButton>;
 *    };
 *    ```
 */

import React from "react";

import type MapVM from "@/components/map/models/MapVM";
import AddLayer from "@/components/map/toolbar/controls/AddLayer";
import LayerSwitcherControl from "@/components/map/toolbar/controls/LayerSwitcherControl.tsx";
import NavigationTreeControl from "@/components/map/toolbar/controls/NavigationTreeControl.tsx";
import Zoom2Extent from "@/components/map/toolbar/controls/Zoom2Extent.tsx";
import Identifier from "@/components/map/toolbar/controls/Identifier.tsx";
import RefreshMap from "@/components/map/toolbar/controls/RefreshMap.tsx";
import ClearSelection from "@/components/map/toolbar/controls/ClearSelection.tsx";
import AttributeTableControl from "@/components/map/toolbar/controls/AttributeTableControl.tsx";
import {MapVMInjectProvider} from "@/components/map/models/MapVMContext.tsx";

interface Props {
    mapVM: MapVM;
    dynamicButtons?: JSX.Element[];
}

const MapToolbarContainer: React.FC<Props> = ({ mapVM, dynamicButtons = [] }) => {
    return (
        <MapVMInjectProvider mapVM={mapVM}>
            <AddLayer />
            <LayerSwitcherControl />
            {/* Add more static buttons as needed */}
            {/*<AddClassificationSurface mapVM={mapVM}/>*/}
            <NavigationTreeControl />
            <Zoom2Extent />
            {/*/!*<RasterArea mapVM={mapVM} drawerRef={mapVM?.getRightDrawerRef()}/>*!/*/}
            <Identifier />
            <RefreshMap />
            {/*{optOptions.isCreateMap && <SaveMap mapVM={mapVM} />}*/}
            <ClearSelection />
            {/*{optOptions.isDesigner && (*/}
            {/*    <SymbologyControl*/}
            {/*        mapVM={mapVM}*/}
            {/*        drawerRef={mapVM?.getRightDrawerRef()}*/}
            {/*    />*/}
            {/*)}*/}
            <AttributeTableControl />
            {/*{!optOptions.isDesigner && <LOISelector mapVM={mapVM} />}*/}
            {/*{mapVM.getAdditionalToolbarButtons().map((elem: JSX.Element) => elem)}*/}
            {dynamicButtons.map((btn, i) => (
                <React.Fragment key={i}>{btn}</React.Fragment>
            ))}
        </MapVMInjectProvider>
    );
};

export default MapToolbarContainer;
