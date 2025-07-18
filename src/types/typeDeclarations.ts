import MapVM from "@/components/map/models/MapVM";
import {RefObject} from "react";
import RightDrawer from "@/components/map/drawers/RightDrawer";
import LeftDrawer from "@/components/map/drawers/LeftDrawer";
import DADialogBox from "@/components/base/DADialogBox";
import {pointShapeTypes} from "@/components/map/layer_styling/vector/symbolizer/PointSymbolizer";
import DAMapLoading from "@/components/map/widgets/DAMapLoading";
import  {TimeSliderHandle} from "@/components/map/time_slider/TimeSlider";
import {DASnackbarHandle} from "@/components/base/DASnackbar";
import BottomDrawer from "@/components/map/drawers/BottomDrawer";
import {Column, Row} from "@/types/gridTypeDeclaration";
import AbstractDALayer from "@/components/map/layers/da_layers/AbstractDALayer";
import OverlayVectorLayer from "@/components/map/layers/overlay_layers/OverlayVectorLayer";
import IDWLayer from "@/components/map/layers/overlay_layers/IDWLayer";
import SelectionLayer from "@/components/map/layers/overlay_layers/SelectionLayer";
import XYZLayer from "@/components/map/layers/overlay_layers/XYZLayer";
import {IdentifyResultHandle} from "@/components/map/widgets/IdentifyResult";

export interface IBaseMapProps {
    mapVM: MapVM;
    layerId?: string;
    mapId?: string;
}

export interface IControlProps {
    mapVM: MapVM;
}

export interface IDomRef {
    rightDrawerRef?: RefObject<RightDrawer | null>;
    leftDrawerRef?: RefObject<LeftDrawer | null>;
    bottomDrawerRef?: RefObject<BottomDrawer | null>
    dialogBoxRef: RefObject<DADialogBox | null>;
    snackBarRef: RefObject<DASnackbarHandle | null>;
    loadingRef: RefObject<DAMapLoading | null>;
    timeSliderRef?: RefObject<TimeSliderHandle>;
    identifyResultRef?: RefObject<IdentifyResultHandle | null>;
}

export interface IMapToolbarProps {
    target?: any;
    mapVM: MapVM;
    isDesigner?: boolean;
    isCreateMap?: boolean;
}

export interface ILayerSourcesInfo {
    source: string;
    imagerySet?: string;
    visible: boolean;
    title: string;
}

export interface ILayerSources {
    [key: string]: ILayerSourcesInfo;
}

export interface ILayerInfo {
    title?: string;
    uuid: string;
    style?: IFeatureStyle;
    zoomRange?: number[]
    geomType?: string[]
    dataModel?: string // "V" or "R"
    category?: string
    dataURL?: string
    extent3857?: []
    layerSetting?: any
    format?: string
    zIndex?: number
    declutter: boolean
    dateRangeURL?:string
}

export interface IMapInfo {
    uuid: string;
    title?: string;
    layers: {
        uuid: string;
        style?: IFeatureStyle;
        visible?: boolean;
        isBase?: boolean;
        key?: string;
    }[];
    extent?: number[];
    srid?: number;
    units?: string;
    description?: string;
    isEditor?: boolean;
}

export interface IFeatureStyle {
    type: "single" | "multiple" | "density" | "sld";
    style: {
        default?: IGeomStyle;
        rules?: IRule[];
    };
}

export interface IGeomStyle {
    pointShape?: (typeof pointShapeTypes)[number];
    pointSize?: number;
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
}

export interface IFilter {
    field: string;
    op: "==" | ">=" | "<=" | ">" | "<" | "!=" | "between";
    value: string | number[];
    logicalOp?: "And" | "Or";
}

export interface IRule {
    title: string;
    filter?: IFilter;
    style: IGeomStyle;
}

export interface IGeoJSON {
    type: string;
    features: IGeoJSONFeature[];
    crs?: any;
    style?: any;
}

export interface IGeoJSONFeature {
    type: string;
    geometry: any;
    properties: any;
}

export interface IData {
    [key: string]: any;
}

// Interface for requesting the Attribute table
export interface AttributeTableRequest {
    columns: Column[];
    rows: Row[];
    pkCols: string[];
    pivotTableSrc?: string;
    tableHeight?: number;
}


export interface IDALayers {
    [key: string]: AbstractDALayer;
}

export interface IOverlays {
    [key: string]: OverlayVectorLayer | IDWLayer | SelectionLayer;
}

export interface IXYZLayers {
    [key: string]: XYZLayer
}