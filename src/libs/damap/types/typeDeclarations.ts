import MapVM from "@damap/components/map/models/MapVM";
import {RefObject} from "react";
import {RightDrawerHandle} from "@damap/components/map/drawers/RightDrawer";
import {LeftDrawerHandle} from "@damap/components/map/drawers/LeftDrawer";
import  {DADialogBoxHandle} from "@damap/components/base/DADialogBox";
import {pointShapeTypes} from "@damap/components/map/layer_styling/vector/symbolizer/PointSymbolizer";
import {DAMapLoadingHandle} from "@damap/components/map/widgets/DAMapLoading";
import {TimeSliderHandle} from "@damap/components/map/time_slider/TimeSlider";
import {DASnackbarHandle} from "@damap/components/base/DASnackbar";
import {BottomDrawerHandle} from "@damap/components/map/drawers/BottomDrawer";
import {Column, Row} from "@damap/types/gridTypeDeclaration";
import AbstractDALayer from "@damap/components/map/layers/da_layers/AbstractDALayer";
import OverlayVectorLayer from "@damap/components/map/layers/overlay_layers/OverlayVectorLayer";
import IDWLayer from "@damap/components/map/layers/overlay_layers/IDWLayer";
import SelectionLayer from "@damap/components/map/layers/overlay_layers/SelectionLayer";
import XYZLayer from "@damap/components/map/layers/overlay_layers/XYZLayer";
import {IdentifyResultHandle} from "@damap/components/map/widgets/IdentifyResult";
import {ContextMenuHandle} from "@damap/components/map/layer_switcher_mui/LayerSwitcherLayerMenu";
import {AttributeTableToolbarHandle} from "@damap/components/map/table/AttributeTableToolbar";


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
    contextMenuRef?: RefObject<ContextMenuHandle | null>;
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
    name:string  // this contain uuid
    title: string;
    uuid: string;
    style?: IFeatureStyle;
    zoomRange?: number[];
    geomType?: string[];
    dataModel?: string;
    category?: string;
    dataURL?: string;
    extent3857?: [];
    layerSetting?: any;
    format?: string;
    zIndex?: number;
    declutter?: boolean;
    dateRangeURL?: string;
}

export interface IWMSLayerParams {
    uuid?: string;
    title?: string;
    url: string;
    layers: string;
    tiled?: boolean;
    format?: string;
    transparent?: boolean;
    version?: string;
    visible?: boolean;
    opacity?: number;
    zIndex?: number;
}
export interface IMapGroupInfo {
    key: string;
    title: string;
    order?: number;
    collapsed?: boolean;
}
export interface IMapLayerInfo {
    uuid: string;
    name?: string;
    title?: string;

    style?: IFeatureStyle;
    type?: string;

    visible?: boolean;
    opacity?: number;
    isBase?: boolean;
    key?: string;
    zIndex?: number;

    params?: IWMSLayerParams | Record<string, any>;

    // old support
    groupName?: string;

    // new group support
    groupKey?: string | null;
    groupTitle?: string | null;

    zoomRange?: [number, number];
}

export interface IMapInfo {
    uuid: string;
    title?: string;

    groups?: IMapGroupInfo[];
    layers: IMapLayerInfo[];

    extent?: number[];
    srid?: number;
    units?: string;
    description?: string;
    isEditor?: boolean;
}

export interface ILabelLayerInfo {
    showLabel?: boolean;
    labelProperty?: string;
    textStyle?: ITextStyle;
    minLabelZoom?: number;
    maxLabelZoom?: number;
}


export interface ILabelableLayer {
    layerInfo: ILabelLayerInfo;
    setShowLabel(showLabel: boolean): void;
    getShowLabel(): boolean | undefined;
    setLabelProperty(labelProperty: string): void;
    getLabelProperty(): string | undefined;
    setTextStyle(textStyle: ITextStyle): void;
    getTextStyle(): ITextStyle | undefined;
    updateLabelOptions(
        labelProperty: string,
        textStyle?: ITextStyle,
        showLabel?: boolean,
        minLabelZoom?: number,
        maxLabelZoom?: number
    ): void;
    getAttributeList(): string[] | Promise<string[]>;
}

export const isLabelableLayer = (layer: unknown): layer is ILabelableLayer => {
    const obj = layer as Partial<ILabelableLayer> | null;

    return !!obj &&
        typeof obj.setShowLabel === "function" &&
        typeof obj.getShowLabel === "function" &&
        typeof obj.setLabelProperty === "function" &&
        typeof obj.getLabelProperty === "function" &&
        typeof obj.setTextStyle === "function" &&
        typeof obj.getTextStyle === "function" &&
        typeof obj.updateLabelOptions === "function" &&
        typeof obj.getAttributeList === "function";
};

export interface ITextStyle {
    font?: string;            //"bold 14px Arial"
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    offsetX?: number;
    offsetY?: number;
    placement?: "point" | "line";
}

export interface IFeatureTextConfig {
    labelField?: string;
    style?: ITextStyle;
    showLabel?: boolean;
    minLabelZoom?: number;
    maxLabelZoom?: number;
}

export interface IFeatureStyle {
    type: "single" | "multiple" | "density" | "sld";
    style: {
        default?: IGeomStyle;
        rules?: IRule[];
    };
    text?: IFeatureTextConfig;
}

export interface IGeomStyle {
    // Point
    pointShape?: (typeof pointShapeTypes)[number];
    pointSize?: number;
    pointRotation?: number;

    pointIconSrc?: string;
    pointIconScale?: number;
    pointIconOpacity?: number;
    pointIconAnchor?: [number, number];

    // Stroke
    strokeColor?: string;
    strokeWidth?: number;
    strokeOpacity?: number;

    lineDash?: number[];
    lineDashOffset?: number;
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    lineOffset?: number;

    // Fill
    fillColor?: string;
    fillOpacity?: number;

    fillPattern?: "none" | "solid" | "diagonal" | "cross" | "dot" | "horizontal" | "vertical";

    // Rendering
    zIndex?: number;
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


export const isGeoJSON = (
    data: unknown
): data is IGeoJSON | IGeoJSONFeature => {
    if (typeof data !== "object" || data === null) return false;

    const obj = data as any;

    // Case 1: FeatureCollection (IGeoJSON)
    if (
        obj.type === "FeatureCollection" &&
        "features" in obj &&
        Array.isArray(obj.features)
    ) {
        return true;
    }

    // Case 2: Single Feature (IGeoJSONFeature)
    return obj.type === "Feature" &&
        "geometry" in obj &&
        "properties" in obj;


};
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
    // isEditable :boolean;
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
