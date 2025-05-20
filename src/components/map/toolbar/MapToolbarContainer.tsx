/**
 * MapToolbarContainer — Central component to render OpenLayers toolbar buttons.
 *
 * This component provides context (`MapVMInjectProvider`) to make the `MapVM` instance available
 * to all toolbar buttons without prop-drilling.
 *
 * ✅ Usage:
 * 1. Render from inside your custom MapToolbar control using React's root renderer:
 *
 *    ```tsx
 *    const root = createRoot(domElement);
 *    root.render(<MapToolbarContainer mapVM={mapVM} dynamicButtons={[<MyButton />]} />);
 *    ```
 *
 * 2. Built-in Buttons Included by Default:
 *    - `<LayerSwitcherControl />` — Toggle visibility of map layers.
 *    - `<NavigationTreeControl />` — Opens navigation tree for structured layer hierarchy.
 *    - `<Zoom2Extent />` — Zooms to the full extent of the configured map.
 *    - `<RefreshMap />` — Refreshes all DALayers on the map.
 *    - `<ClearSelection />` — Clears any highlighted/selected features from the interaction layer.
 *    - `<Identifier />` — Activates Identify tool for clicking features on the map.
 *    - `<AttributeTableControl />` — Opens the attribute table in a drawer for selected layer.
 *
 * 3. Optional / On-Demand Built-in Buttons (available but not rendered by default):
 *      import AddLayer from "@/components/map/toolbar/controls/AddLayer";
 *    - `<AddLayer />` — Launches dialog to add new DALayers to the map.
 *    - `<CommentButton />` — Opens a panel to view or submit comments on layers/features.
 *    - `<SaveMap />` — Saves the current map configuration (useful in designer mode).
 *    - `<LOISelector />` — Lets the user select Layer of Interest (LOI).
 *    - `<SymbologyControl />` — Provides UI to change the symbology of layers.
 *    - `<RasterArea />` — Enables polygon drawing for raster analysis.
 *    - `<AddClassificationSurface />` — Loads classification surface for land cover or AI results.
 *
 *    You can enable these by uncommenting the relevant lines or injecting dynamically.
 *
 * 4. Dynamic Buttons:
 *    - Pass custom buttons through `dynamicButtons`:
 *      ```tsx
 *      <MapToolbarContainer mapVM={mapVM} dynamicButtons={[<MyCustomButton />]} />
 *      ```
 *
 * 5. Accessing MapVM in Custom Buttons:
 *    Use `useMapVM()` from `"@/components/map/models/MapVMContext.tsx"`:
 *
 *    ```tsx
 *    import { useMapVM } from "@/components/map/models/MapVMContext";
 *    import { IconButton, Tooltip } from "@mui/material";
 *    import BuildIcon from "@mui/icons-material/Build";
 *
 *    const MyCustomButton = () => {
 *      const mapVM = useMapVM();
 *      return (
 *        <Tooltip title="Custom Action">
 *          <IconButton onClick={() => mapVM.zoomToFullExtent()}>
 *            <BuildIcon />
 *          </IconButton>
 *        </Tooltip>
 *      );
 *    };
 *    ```
 */


import React, {JSX} from "react";

import type MapVM from "@/components/map/models/MapVM";

import LayerSwitcherControl from "@/components/map/toolbar/controls/LayerSwitcherControl";
// import NavigationTreeControl from "@/components/map/toolbar/controls/NavigationTreeControl";
import Zoom2Extent from "@/components/map/toolbar/controls/Zoom2Extent";
import Identifier from "@/components/map/toolbar/controls/Identifier";
import RefreshMap from "@/components/map/toolbar/controls/RefreshMap";
import ClearSelection from "@/components/map/toolbar/controls/ClearSelection";
import AttributeTableControl from "@/components/map/toolbar/controls/AttributeTableControl";
import {MapVMInjectProvider} from "@/components/map/models/MapVMContext";
import LOISelector from "@/components/map/toolbar/controls/LOISelector";
import {Tooltip} from "@mui/material";

interface Props {
    mapVM: MapVM;
    dynamicButtons?: JSX.Element[];
}

const MapToolbarContainer: React.FC<Props> = ({ mapVM, dynamicButtons = [] }) => {
    // const theme = mapVM.getTheme();
    return (
        <MapVMInjectProvider mapVM={mapVM}>
            {/*<AddLayer />*/}
            <LayerSwitcherControl />
            {/* Add more static buttons as needed */}
            {/*<AddClassificationSurface mapVM={mapVM}/>*/}
            {/*<NavigationTreeControl />*/}
            <Zoom2Extent />
            {/*/!*<RasterArea mapVM={mapVM} drawerRef={mapVM?.getRightDrawerRef()}/>*!/*/}
            <RefreshMap />
            {/*{optOptions.isCreateMap && <SaveMap mapVM={mapVM} />}*/}
            <ClearSelection />
            {/*{optOptions.isDesigner && (*/}
            {/*    <SymbologyControl*/}
            {/*        mapVM={mapVM}*/}
            {/*        drawerRef={mapVM?.getRightDrawerRef()}*/}
            {/*    />*/}
            {/*)}*/}
            <Identifier />
            <AttributeTableControl />
            {/*{!optOptions.isDesigner && <LOISelector mapVM={mapVM} />}*/}

            {dynamicButtons.map((btn, i) => (
                <React.Fragment key={i}>{btn}</React.Fragment>
            ))}

            <Tooltip title="Layer of Interest">
                <LOISelector />
            </Tooltip>
        </MapVMInjectProvider>
    );
};

export default MapToolbarContainer;
