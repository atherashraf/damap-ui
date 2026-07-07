// ✅ Global CSS
import './assets/css/all-css.css';

// -------------------------
// ✅ Library Initialization
// -------------------------
export { initDamap, getDamapConfig } from './config';
export type { DamapOptions } from './config';

// -------------------------
// ✅ Auth
// -------------------------
export { useAuth } from './hooks/useAuth';

export { AuthGuard } from './components/auth/AuthGuard';
export { default as LoginForm } from './components/auth/LoginForm';
export { default as Logout } from './components/auth/Logout';
export { default as AuthServices } from './api/authServices';

export type {
    DAMapUserBase,
} from './types/authTypes';


// -------------------------
// ✅ Admin Pages
// -------------------------
export { default as MapInfoAdmin } from './pages/admin/MapInfoAdmin';
export { default as LayerInfoAdmin } from './pages/admin/LayerInfoAdmin';


// -------------------------
// ✅ Other Pages
// -------------------------
export { default as LayerDesigner } from './pages/LayerDesigner';
export { default as MapEditor} from './pages/admin/MapEditor';
export { default as DAMap } from './pages/DAMap';


// -------------------------
// ✅ Core Map Components
// -------------------------
export { default as MapView } from './components/map/MapView';
export { default as MapPanel } from './components/map/MapPanel';


// -------------------------
// ✅ Map Models & ViewModels
// -------------------------
export { default as MapVM } from './components/map/models/MapVM';
export { default as CustomToolManager} from './components/map/manager/CustomToolManager'
export type {OLMapEventType, ArmerFn, OnType, ToolOptions} from './components/map/manager/CustomToolManager'
export type {ChipMessagePayload} from './components/map/manager/CustomToolManager'
export {default as MapMessageChipManager} from './components/map/manager/mapMessageChipManager'
export type {PayloadType, MapMessageAction, SeverityType, MapMessageChipHandle} from './components/map/widgets/MapMessageChip'

// -------------------------
// ✅ Hooks
// -------------------------
export { useMapVM, getMapVM } from './hooks/MapVMContext';
export { useMapApi } from './hooks/useMapApi';


// -------------------------
// ✅ API Services
// -------------------------
export { default as MapApi } from './api/MapApi';
export { MapAPIs } from './api/MapApi';
export {
    initMapApi,
    getMapApi,
    resetMapApi,
} from './api/mapApiInstance';


// -------------------------
// ✅ Map Layers
// -------------------------
// export * from './components/map/layers/overlay_layers';
export { default as AbstractOverlayLayer } from './components/map/layers/overlay_layers/AbstractOverlayLayer';
export { default as IDWLayer } from './components/map/layers/overlay_layers/IDWLayer';
export { default as OverlayVectorLayer } from './components/map/layers/overlay_layers/OverlayVectorLayer';
export { default as SelectionLayer } from './components/map/layers/overlay_layers/SelectionLayer';
export {type SelectionLayerMode} from './components/map/layers/overlay_layers/SelectionLayer';
export { default as XYZLayer } from './components/map/layers/overlay_layers/XYZLayer';
export type {IXYZLayerInfo} from './components/map/layers/overlay_layers/XYZLayer';
export type { IOverLayVectorInfo } from './components/map/layers/overlay_layers/OverlayVectorLayer';
//
// export * from './components/map/layers/da_layers';
export { default as AbstractDALayer } from './components/map/layers/da_layers/AbstractDALayer';
export { default as DAVectorLayer } from './components/map/layers/da_layers/DAVectorLayer';
export { default as MVTLayer } from './components/map/layers/da_layers/MVTLayer';
export { default as RasterTileLayer } from './components/map/layers/da_layers/RasterTileLayer';

export { default as WMSLayer } from './components/map/layers/overlay_layers/WMSLayer';
export type { IGeoServerWMSInfo } from './components/map/layers/overlay_layers/WMSLayer';

// -------------------------
// ✅ Map Layer Styling
// -------------------------
export { default as TextSymbolizer } from './components/map/layer_styling/vector/symbolizer/TextSymbolizer';
export { default as StylingUtils } from './components/map/layer_styling/utils/StylingUtils';
export { default as SLDStyleParser } from './components/map/layer_styling/utils/SLDStyleParser';
export * as MapStyles from './components/map/layer_styling/utils/styles';


export { pointShapeTypes } from './components/map/layer_styling/vector/symbolizer/PointSymbolizer';
export { getPointSVG } from './components/map/layer_styling/vector/symbolizer/PointSymbolizer';
export { getPointShapes } from './components/map/layer_styling/vector/symbolizer/PointSymbolizer';


// -------------------------
// ✅ Table Components
// -------------------------
export * from './components/map/table/AttributeTable'; // named exports
export { default as AttributeTable } from './components/map/table/AttributeTable'; // default export

// -------------------------
// ✅ Attribute Table Toolbar (types + component, if you want to expose it)
// -------------------------
export {
    AttributeTableToolbar,
} from "./components/map/table/AttributeTableToolbar";

export type {
    AttributeTableToolbarHandle,
    AttributeTableToolbarProps,
    ToolbarEntry,
    ToolbarSlot,
} from "./components/map/table/AttributeTableToolbar";



// -------------------------
// ✅ Time Slider
// -------------------------
export { default as TimeSlider } from './components/map/time_slider/TimeSlider';
export type { TimeSliderHandle } from './components/map/time_slider/TimeSlider';


// -------------------------
// ✅ Map Toolbar & Buttons
// -------------------------
export { default as MapToolbarContainer } from './components/map/toolbar/MapToolbarContainer';
export { default as MapToolbar } from './components/map/toolbar/MapToolbar';
export type { MapToolbarHandle } from './components/map/toolbar/MapToolbarContainer';
export {default as AddTextStyle} from './components/map/toolbar/controls/external/AddTextStyle'

export { default as AddLayer } from './components/map/toolbar/controls/AddLayer';
// export { default as SaveMap } from './components/map/toolbar/controls/SaveMap';
export { default as SymbologyControl } from './components/map/toolbar/controls/SymbologyControl';
// export { default as RasterArea } from './components/map/toolbar/controls/RasterArea';
// export { default as AddClassificationSurface } from './components/map/toolbar/controls/AddClassificationSurface';


// -------------------------
// ✅ Layer Switcher & Context Menu
// -------------------------
// export { default as ContextMenu } from './components/map/layer_switcher/ContextMenu';
export {default as LayerSwitcherLayerMenu} from './components/map/layer_switcher_mui/LayerSwitcherLayerMenu'
export { default as LayerSwitcherPaper } from './components/map/layer_switcher/LayerSwitcherPaper';
export {default as LayerSwitcherMUIPaper} from "./components/map/layer_switcher_mui/LayerSwitcherMUIPaper";
export type { ContextMenuHandle } from './components/map/layer_switcher_mui/LayerSwitcherLayerMenu';
export type { CustomMenuItem } from './components/map/layer_switcher_mui/LayerSwitcherLayerMenu';


// -------------------------
// ✅ UI Utilities & Components
// -------------------------
export { default as DASnackbar } from './components/base/DASnackbar';
export type { DASnackbarHandle } from './components/base/DASnackbar';
export type { DADialogBoxHandle } from './components/base/DADialogBox';
export type { DAMapLoadingHandle } from './components/map/widgets/DAMapLoading';
export type { IdentifyResultHandle } from './components/map/widgets/IdentifyResult';
export { default as ColorUtils } from './utils/colorUtils';
export {default as MapUtils} from './utils/mapUtils';
export {
    getMediaUrl,
    getImageThumbnailUrl,
    getImageCellUrl,
    getImageCellThumbnailUrl,
    preloadImageUrl,
    isImageUrlPreloaded,
    setThumbnailUrlBuilder,
} from './utils/mediaUtils';

export type {
    ThumbnailUrlBuilder,
} from './utils/mediaUtils';






// -------------------------
// ✅ Drawer Handles
// -------------------------
export type { RightDrawerHandle } from './components/map/drawers/RightDrawer';
export type { BottomDrawerHandle } from './components/map/drawers/BottomDrawer';
export type { LeftDrawerHandle } from './components/map/drawers/LeftDrawer';


// -------------------------
// ✅ Type Declarations
// -------------------------
export type { IDomRef } from './types/typeDeclarations';
export type { ILayerSourcesInfo } from './types/typeDeclarations';
export type { ILayerInfo } from './types/typeDeclarations';
export type { IMapInfo } from './types/typeDeclarations';
export type { IMapToolbarProps } from './types/typeDeclarations';
export type { IFeatureStyle } from './types/typeDeclarations';
export type { IGeomStyle } from './types/typeDeclarations';
export type { ITextStyle } from './types/typeDeclarations';
export type { IRule } from './types/typeDeclarations';
export type { IFilter } from './types/typeDeclarations';
export type {IGeoJSON} from './types/typeDeclarations';
export type {IGeoJSONFeature} from './types/typeDeclarations';
export type {Column} from './types/gridTypeDeclaration'
export type {Row} from './types/gridTypeDeclaration'
export type {Filter} from './types/gridTypeDeclaration'


