import MapVM from "@/components/map/models/MapVM";
import {RefObject} from "react";
import {RightDrawerHandle} from "@/components/map/drawers/RightDrawer";
import {LeftDrawerHandle} from "@/components/map/drawers/LeftDrawer";
import  {DADialogBoxHandle} from "@/components/base/DADialogBox";
import {pointShapeTypes} from "@/components/map/layer_styling/vector/symbolizer/PointSymbolizer";
import {DAMapLoadingHandle} from "@/components/map/widgets/DAMapLoading";
import {TimeSliderHandle} from "@/components/map/time_slider/TimeSlider";
import {DASnackbarHandle} from "@/components/base/DASnackbar";
import {BottomDrawerHandle} from "@/components/map/drawers/BottomDrawer";
import {Column, Row} from "@/types/gridTypeDeclaration";
import AbstractDALayer from "@/components/map/layers/da_layers/AbstractDALayer";
import OverlayVectorLayer from "@/components/map/layers/overlay_layers/OverlayVectorLayer";
import IDWLayer from "@/components/map/layers/overlay_layers/IDWLayer";
import SelectionLayer from "@/components/map/layers/overlay_layers/SelectionLayer";
import XYZLayer from "@/components/map/layers/overlay_layers/XYZLayer";
import {IdentifyResultHandle} from "@/components/map/widgets/IdentifyResult";
import {ContextMenuHandle} from "@/components/map/layer_switcher/ContextMenu";
import {AttributeTableToolbarHandle} from "@/components/map/table/AttributeTableToolbar";

export interface IBaseMapProps {
    mapVM: MapVM;
    layerId?: string;
    mapId?: string;
}

export interface IControlProps {
    mapVM: MapVM;
}

export interface IDomRef {
    rightDrawerRef: RefObject<RightDrawerHandle | null>;
    leftDrawerRef: RefObject<LeftDrawerHandle | null>;
    bottomDrawerRef: RefObject<BottomDrawerHandle | null>
    dialogBoxRef: RefObject<DADialogBoxHandle | null>;
    snackBarRef: RefObject<DASnackbarHandle | null>;
    loadingRef: RefObject<DAMapLoadingHandle | null>;
    timeSliderRef?: RefObject<TimeSliderHandle | null>;
    identifyResultRef: RefObject<IdentifyResultHandle | null>;
    contextMenuRef: RefObject<ContextMenuHandle | null>;
    attributeTableToolbarRef: RefObject<AttributeTableToolbarHandle | null>;
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
    dateRangeURL?: string
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
export interface ITextStyle {
    font?: string;  //"bold 14px Arial"
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    offsetX?: number;
    offsetY?: number;
    placement?: "point" | "line";
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
    pointIconSrc?: string;
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
    id?: number | string;
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