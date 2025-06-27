// ✅ Import all required global CSS (including OL, OL-EXT, and component styles)
import './assets/css/all-css.css';


// -------------------------
// ✅ Page-level Components
// -------------------------
export {default as MapInfoAdmin} from './pages/admin/MapInfoAdmin';
export {default as LayerInfoAdmin} from './pages/admin/LayerInfoAdmin';
export {default as LayerDesigner} from "./pages/LayerDesigner";
export {default as DAMap} from './pages/DAMap';


// -------------------------
// ✅ Core Map Components
// -------------------------
export {default as MapView} from './components/map/MapView';
export {default as AttributeTable} from './components/map/table/AttributeTable';


// -------------------------
// ✅ Hooks & Models
// -------------------------
export {useMapVM, getMapVM} from "./hooks/MapVMContext";
export {useMapApi} from "./hooks/useMapApi";
export {useAuth} from './hooks/useAuth';           // ✅ Custom auth hook
export {default as MapVM} from "./components/map/models/MapVM";


// -------------------------
// ✅ API Services & Constants
// -------------------------
export {default as MapApi} from './api/MapApi';
export {MapAPIs} from './api/MapApi';
export {default as AuthServices} from './api/authServices';  // ✅ Auth service


// -------------------------
// ✅ UI Components & Types
// -------------------------
export {default as DASnackbar} from './components/base/DASnackbar';
export type {DASnackbarHandle} from './components/base/DASnackbar';
export type {RightDrawerHandle} from './components/map/drawers/RightDrawer';
export type {BottomDrawerHandle} from './components/map/drawers/BottomDrawer';
export type {LeftDrawerHandle} from './components/map/drawers/LeftDrawer';

// -------------------------
// ✅ Map Layers
// -------------------------
export * from './components/map/layers/overlay_layers';
export * from './components/map/layers/da_layers';

export {pointShapeTypes} from './components/map/layer_styling/vector/symbolizer/PointSymbolizer'
export {getPointSVG} from './components/map/layer_styling/vector/symbolizer/PointSymbolizer'
export {getPointShapes} from './components/map/layer_styling/vector/symbolizer/PointSymbolizer'
export type {IFeatureStyle} from './types/typeDeclarations'
export type {IGeomStyle} from './types/typeDeclarations'

export type {ILayerSourcesInfo} from './types/typeDeclarations'
export type {ILayerInfo} from './types/typeDeclarations'
export type {IMapInfo} from './types/typeDeclarations'
export type {IMapToolbarProps} from './types/typeDeclarations'

export type {IGeoJSON} from './types/typeDeclarations'
export type {IRule} from './types/typeDeclarations'
export type {IFilter} from './types/typeDeclarations'


// -------------------------
// ✅ Table Components (Named Exports)
// -------------------------
export * from './components/map/table/AttributeTable';

// -------------------------
// ✅ Auth Guards
// -------------------------
export {AuthGuard} from './components/auth/AuthGuard';

// -------------------------
// ✅ Time Slider Component
// -------------------------
export {default as TimeSlider} from './components/map/time_slider/TimeSlider';
export type {TimeSliderHandle} from './components/map/time_slider/TimeSlider';

// -------------------------
// ✅ Toolbar Container & Optional Toolbar Buttons
// -------------------------
export {default as MapToolbarContainer} from './components/map/toolbar/MapToolbarContainer';

// 🔁 Optional Buttons (can be injected via `dynamicButtons` into MapToolbarContainer)
export {default as AddLayer} from './components/map/toolbar/controls/AddLayer';
// export { default as SaveMap } from './components/map/toolbar/controls/SaveMap';
// export { default as SymbologyControl } from './components/map/toolbar/controls/SymbologyControl';
// export { default as RasterArea } from './components/map/toolbar/controls/RasterArea';
// export { default as AddClassificationSurface } from './components/map/toolbar/controls/AddClassificationSurface';

