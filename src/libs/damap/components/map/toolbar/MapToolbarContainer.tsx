/**
 * MapToolbarContainer — Central React component for rendering OpenLayers map toolbar buttons.
 *
 * 💡 Purpose:
 * - Provides a consistent, pluggable toolbar UI for map interactions.
 * - Uses `MapVMInjectProvider` to make the `MapVM` instance available to all nested controls.
 * - Supports dynamic button injection via props or exposed ref API.
 *
 * ✅ Usage Example:
 *
 * ```tsx
 * import { createRoot } from 'react-dom/client';
 * import MapToolbarContainer from './MapToolbarContainer';
 *
 * const root = createRoot(domElement);
 * root.render(<MapToolbarContainer mapVM={mapVM} dynamicButtons={[<MyButton />]} />);
 * ```
 *
 * 🔌 Exposed Methods via `ref` (using `forwardRef`):
 * ```ts
 * ref.current?.addButton(<MyCustomButton />);
 * ref.current?.clearButtons();
 * ```
 * - `addButton`: Add a new button to the toolbar dynamically at runtime.
 * - `clearButtons`: Remove all dynamically added buttons.
 *
 * 🧱 Built-in Buttons (Rendered by Default):
 * - `<AddLayer />` — Dialog to add new map layers (DALayers).
 * - `<LayerSwitcherControl />` — Toggle layer visibility.
 * - `<Zoom2Extent />` — Zoom to the map’s full configured extent.
 * - `<RefreshMap />` — Reload all DALayers.
 * - `<ClearSelection />` — Clear selected/highlighted features.
 * - `<Identifier />` — Enable identify tool to click and inspect features.
 * - `<AttributeTableControl />` — View and interact with attribute data.
 * - `<LOISelector />` — Layer of Interest selector (with tooltip).
 *
 * 🧩 Optional Built-in Buttons (Available but Commented Out):
 * - `<AddClassificationSurface />` — Loads classification surfaces.
 * - `<RasterArea />` — Enables polygon drawing for raster analysis.
 * - `<NavigationTreeControl />` — Hierarchical navigation of layers.
 * - `<SymbologyControl />` — UI for styling layers.
 * - `<SaveMap />` — Save current map configuration (useful in design mode).
 *
 * ➕ Dynamic Buttons via Props:
 * - Pass custom buttons through `dynamicButtons`:
 * ```tsx
 * <MapToolbarContainer mapVM={mapVM} dynamicButtons={[<CustomZoomButton />]} />
 * ```
 *
 * 🧠 Access `mapVM` in Custom Buttons:
 * Use the `useMapVM()` hook:
 * ```tsx
 * import { useMapVM } from "@damap/components/map/models/MapVMContext";
 *
 * const MyCustomButton = () => {
 *   const mapVM = useMapVM();
 *
 *   return <IconButton onClick={() => mapVM.zoomToFullExtent()} />;
 * };
 * ```
 */

import React, {forwardRef, JSX, ReactElement, ReactNode, useImperativeHandle, useState} from "react";

import type MapVM from "@damap/components/map/models/MapVM";

import LayerSwitcherControl from "@damap/components/map/toolbar/controls/LayerSwitcherControl";
// import NavigationTreeControl from "@damap/components/map/toolbar/controls/NavigationTreeControl";
import Zoom2Extent from "@damap/components/map/toolbar/controls/Zoom2Extent";
import Identifier from "@damap/components/map/toolbar/controls/Identifier";
import RefreshMap from "@damap/components/map/toolbar/controls/RefreshMap";
import ClearSelection from "@damap/components/map/toolbar/controls/ClearSelection";
import AttributeTableControl from "@damap/components/map/toolbar/controls/AttributeTableControl";
import {MapVMInjectProvider} from "@damap/hooks/MapVMContext";
import LOISelector from "@damap/components/map/toolbar/controls/LOISelector";
import {Tooltip} from "@mui/material";
import {AddLayer} from "@/libs/damap"
import AddTextStyle from "@damap/components/map/toolbar/controls/external/AddTextStyle";
import GoToButton from "@damap/components/map/toolbar/controls/GotoXY";
import MeasurementButton from "@damap/components/map/toolbar/controls/MeasurementButton";
import PrintLayoutButton from "@damap/components/map/toolbar/controls/PrintLayoutButton";
// import PrintLayoutButton from "@damap/components/map/toolbar/controls/PrintLayoutButton";

// import SaveMap from "@damap/components/map/toolbar/controls/SaveMap";

interface Props {
    mapVM: MapVM;
    dynamicButtons?: JSX.Element[];
}
export interface MapToolbarHandle {
    addButton: (button: ReactElement) => void;
    clearButtons: () => void;
}

const MapToolbarContainer = forwardRef<MapToolbarHandle, Props>(
    ({ mapVM, dynamicButtons = [] }, ref) => {
        const [externalButtons, setExternalButtons] = useState<ReactNode[]>([]);

        useImperativeHandle(ref, () => ({
            addButton: (button: ReactNode) => {
                setExternalButtons((prev) => [...prev, button]);
            },
            clearButtons: () => {
                setExternalButtons([]);
            }
        }));

    return (
        <MapVMInjectProvider mapVM={mapVM}>
            <AddLayer />
            <LayerSwitcherControl />
            <AddTextStyle />
            {/* Add more static buttons as needed */}
            {/*<AddClassificationSurface mapVM={mapVM}/>*/}
            {/*<NavigationTreeControl />*/}
            <Zoom2Extent />
            {/*/!*<RasterArea mapVM={mapVM} drawerRef={mapVM?.getRightDrawerRef()}/>*!/*/}
            <RefreshMap />
            {/*{optOptions.isCreateMap && <SaveMap />}*/}
            <Identifier />
            {/*<SelectControl />*/}
            <ClearSelection />
            {/*{optOptions.isDesigner && (*/}
            {/*    <SymbologyControl />*/}
            {/*)}*/}

            <AttributeTableControl />
            {/*{!optOptions.isDesigner && <LOISelector mapVM={mapVM} />}*/}

            {dynamicButtons.map((btn, i) => (
                <React.Fragment key={i}>{btn}</React.Fragment>
            ))}
            {externalButtons.map((btn, i) => (
                <React.Fragment key={`ext-${i}`}>{btn}</React.Fragment>
            ))}
            <GoToButton />
            <MeasurementButton />
            <PrintLayoutButton />
            <Tooltip title="Layer of Interest">
                <LOISelector />
            </Tooltip>

        </MapVMInjectProvider>
    );
});

export default MapToolbarContainer;
