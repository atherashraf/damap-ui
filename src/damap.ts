// ✅ Global CSS
import './assets/css/all-css.css';


// -------------------------
// ✅ Admin Pages
// -------------------------
export { default as MapInfoAdmin } from './pages/admin/MapInfoAdmin';
export { default as LayerInfoAdmin } from './pages/admin/LayerInfoAdmin';


// -------------------------
// ✅ Other Pages
// -------------------------
export { default as LayerDesigner } from './pages/LayerDesigner';
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


// -------------------------
// ✅ Hooks
// -------------------------
export { useMapVM, getMapVM } from './hooks/MapVMContext';
export { useMapApi } from './hooks/useMapApi';
export { useAuth } from './hooks/useAuth';


// -------------------------
// ✅ API Services
// -------------------------
export { default as MapApi } from './api/MapApi';
export { MapAPIs } from './api/MapApi';
export { default as AuthServices } from './api/authServices';


// -------------------------
// ✅ Map Layers
// -------------------------
export * from './components/map/layers/overlay_layers';
export * from './components/map/layers/da_layers';


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

export { default as AddLayer } from './components/map/toolbar/controls/AddLayer';
// export { default as SaveMap } from './components/map/toolbar/controls/SaveMap';
export { default as SymbologyControl } from './components/map/toolbar/controls/SymbologyControl';
// export { default as RasterArea } from './components/map/toolbar/controls/RasterArea';
// export { default as AddClassificationSurface } from './components/map/toolbar/controls/AddClassificationSurface';


// -------------------------
// ✅ Layer Switcher & Context Menu
// -------------------------
export { default as ContextMenu } from './components/map/layer_switcher/ContextMenu';
export { default as LayerSwitcherPaper } from './components/map/layer_switcher/LayerSwitcherPaper';
export type { ContextMenuHandle } from './components/map/layer_switcher/ContextMenu';
export type { CustomMenuItem } from './components/map/layer_switcher/ContextMenu';


// -------------------------
// ✅ UI Utilities & Components
// -------------------------
export { default as DASnackbar } from './components/base/DASnackbar';
export type { DASnackbarHandle } from './components/base/DASnackbar';
export type { DADialogBoxHandle } from './components/base/DADialogBox';
export type { DAMapLoadingHandle } from './components/map/widgets/DAMapLoading';
export type { IdentifyResultHandle } from './components/map/widgets/IdentifyResult';
export { default as ColorUtils } from './utils/colorUtils';


// -------------------------
// ✅ Auth Guards
// -------------------------
export { AuthGuard } from './components/auth/AuthGuard';


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
