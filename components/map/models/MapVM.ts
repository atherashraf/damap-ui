//@damap/components/map/models/MapVM;

import "ol/ol.css";
import "ol-ext/dist/ol-ext.css";
import "@damap/assets/css/da-ol.css";
import OLMap from "ol/Map.js";
import OLView from "ol/View.js";
import {defaults as defaultControls} from "ol/control";
import BaseLayers from "../layers/BaseLayers";
import MapToolbar from "@damap/components/map/toolbar/MapToolbar";
import MapApi, {MapAPIs} from "@damap/api/MapApi";
import {ReactNode, RefObject} from "react";
import {
    IDomRef,
    IFeatureStyle,
    IGeoJSON,
    IGeomStyle,
    ILayerInfo,
    IMapInfo,
    IRule,
} from "@damap/types/typeDeclarations";
import {RightDrawerHandle} from "@damap/components/map/drawers/RightDrawer";
import {LeftDrawerHandle} from "@damap/components/map/drawers/LeftDrawer";
import {DADialogBoxHandle} from "@damap/components/base/DADialogBox";

// @ts-ignore
import Legend from "ol-ext/control/Legend";
// @ts-ignore
import ol_legend_Legend from "ol-ext/legend/Legend";
import RasterTileLayer from "@damap/components/map/layers/da_layers/RasterTileLayer";
import AbstractDALayer from "@damap/components/map/layers/da_layers/AbstractDALayer";


import autoBind from "auto-bind";
import {DAMapLoadingHandle} from "@damap/components/map/widgets/DAMapLoading";
import {TimeSliderHandle} from "@damap/components/map/time_slider/TimeSlider";
import IDWLayer from "@damap/components/map/layers/overlay_layers/IDWLayer";
import OverlayVectorLayer from "@damap/components/map/layers/overlay_layers/OverlayVectorLayer";
import {IXYZLayerInfo} from "@damap/components/map/layers/overlay_layers/XYZLayer";
import BaseLayer from "ol/layer/Base";
import {DASnackbarHandle} from "@damap/components/base/DASnackbar";
import {BottomDrawerHandle} from "@damap/components/map/drawers/BottomDrawer";
import {AlertColor, Theme} from "@mui/material";

import SelectionLayer, {SelectionLayerMode} from "@damap/components/map/layers/overlay_layers/SelectionLayer";
import {Column, Row} from "@damap/types/gridTypeDeclaration";
import {Feature} from "ol";


import ColorUtils from "@damap/utils/colorUtils";

import {createEmpty, extend, isEmpty} from 'ol/extent';
import {IdentifyResultHandle} from "@damap/components/map/widgets/IdentifyResult";
import {MapToolbarHandle} from "@damap/components/map/toolbar/MapToolbarContainer";
// import {ContextMenuHandle} from "@damap/components/map/layer_switcher_mui/LayerSwitcherLayerMenu";
import {Geometry} from "ol/geom";
import TimeSliderControl from "@damap/components/map/time_slider/TimeSliderControl";

import {AttributeTableToolbarHandle} from "@damap/components/map/table/AttributeTableToolbar";
import CustomToolManager, {ArmerFn, OLMapEventType} from "@damap/components/map/manager/CustomToolManager";
import WMSLayer, {IGeoServerWMSInfo} from "@damap/components/map/layers/overlay_layers/WMSLayer";
import WFSLayer, {IGeoServerWFSInfo} from "@damap/components/map/layers/overlay_layers/WFSLayer";
import {SelectionManager} from "@damap/components/map/manager/SelectionManager";
import AttributeTableManager from "@damap/components/map/manager/AttributeTableManager";
import DMLManager from "@damap/components/map/manager/DMLManager";
import LayerSwitcherManager from "@damap/components/map/layer_switcher_mui/LayerSwitcherManager";
import MapLayoutManager from "@damap/components/map/manager/MapLayoutManager";
import {transform} from "ol/proj";
import LayerManager, {LayerKind} from "@damap/components/map/manager/LayerManager";
import {LayerSwitcherType} from "@damap/components/map/MapView";


export interface IDALayers {
    [key: string]: AbstractDALayer;
}

// interface IOverlays {
//     [key: string]: OverlayVectorLayer | IDWLayer | SelectionLayer | WMSLayer | WFSLayer;
// }
//
// interface IXYZLayers {
//     [key: string]: XYZLayer
// }


class MapVM {

    // @ts-ignore
    private map: OLMap;
    private _domRef: IDomRef;
    private _layerOfInterest: string | null = null;
    mapExtent: number[] | undefined;  //this._loadMapExtent();
    isInit: boolean = false;
    public readonly api: MapApi;
    private isDesigner: boolean;
    private _isMapEditor: boolean = false
    // private readonly fullScreen: FullScreen;
    private legendPanel: any = null;
    // @ts-ignore
    private mapInfo: IMapInfo | undefined;
    // private additionalToolbarButtons: JSX.Element[] = [];


    private selectionLayer: SelectionLayer | undefined;
    private selectionManager: SelectionManager | undefined;
    private readonly mapToolbar: MapToolbar;
    private _theme: Theme | undefined;
    private _identifierFeatureRenderer: ((feature: Feature<Geometry>) => ReactNode) | null = null;
    public tools: CustomToolManager;
    public attributeTableManager: AttributeTableManager;
    public dmlManager: DMLManager;
    public layerSwitcherManager: LayerSwitcherManager
    private layerSwitcherType: LayerSwitcherType;
    public layoutManager: MapLayoutManager;
    private readonly layerManager: LayerManager;
    private extentConstraint: number[] | undefined;

    constructor(domRef: IDomRef, isDesigner: boolean = false) {
        this._domRef = domRef;
        this.isDesigner = isDesigner;
        this.api = new MapApi(domRef.snackBarRef);
        autoBind(this);
        this.mapToolbar = new MapToolbar({
            mapVM: this
            // isDesigner: this.isDesigner,
            // isCreateMap: (!this.isDesigner && !mapInfo) || mapInfo?.isEditor || false,
        })
        // this.initProjections();
        this.tools = new CustomToolManager(() => this.getMap?.(), (cursor) => this.setMapCursor(cursor));
        this.attributeTableManager = new AttributeTableManager(this);
        this.selectionLayer = new SelectionLayer(this);
        this.selectionManager = new SelectionManager(this);
        this.dmlManager = new DMLManager(this);
        this.layerSwitcherManager = new LayerSwitcherManager(this);
        this.layoutManager = new MapLayoutManager();
        this.layerManager = new LayerManager(this, this.api);
        this.layerSwitcherType = "MUI"
    }

    /** Safely set the map target’s cursor (uses provided setter if available) */
    public setMapCursor(cursor: string) {
        const t = this.getMap()?.getTargetElement?.();
        if (t) t.style.cursor = cursor;
    }

    public setLayerSwitcherType(lstype:LayerSwitcherType){
        this.layerSwitcherType = lstype;
    }
    public getLayerSwitcherType(): string {
        return this.layerSwitcherType;
    }


    initMap(mapInfo?: IMapInfo) {
        this.mapInfo = mapInfo;

        this.map = new OLMap({
            controls: defaultControls().extend([this.mapToolbar]),
            view: new OLView({
                center: [7723464, 3569764],
                zoom: 5,
            }),
        });

        // Restore saved base layer first
        const savedBase: string =
            mapInfo?.layers?.find((l) => l.isBase)?.key || "Google Hybrid";

        new BaseLayers(this).addBaseLayers(savedBase);

        if (mapInfo?.extent) {
            this.mapExtent = mapInfo.extent;
            setTimeout(this.zoomToMapExtent, 100);
        }

        if (mapInfo?.layers?.length) {
            (async () => {
                // await this.layerManager.restoreFromMapInfo(mapInfo.layers || []);
                await this.layerManager.restoreFromMapInfo(mapInfo);
            })();
        }
        // if (mapInfo?.layers?.length) {
        //     this.layerManager.restoreFromMapInfo(mapInfo.layers);
        // }

        this.addSidebarController();
        this.isInit = true;
        window.dispatchEvent(new Event("MAP_INIT"));
    }

    setTarget(target: string) {
        this.map.setTarget(target);
        //Note: dont use zoome to map extent here its  cause delay
        // this.zoomToMapExtent();
        setTimeout(() => this.map.updateSize(), 2000);
        // console.log("dispatching map ready")
        window.dispatchEvent(new Event("MAP_READY"));
    }



    setIsDesigner(isDesigner: boolean) {
        this.isDesigner = isDesigner;
    }


    isLayerDesigner(): boolean {
        return this.isDesigner;
    }

    getLayerManager(): LayerManager {
        return this.layerManager;
    }

    getMapInfo(): IMapInfo | undefined {
        return this.mapInfo;
    }

    getLayoutManager(): MapLayoutManager {
        return this.layoutManager;
    }

    getMapToolbar(): MapToolbar {
        return this.mapToolbar
    }

    // getAttributeTableSelectedRowKey(): string | null {
    //     return this.attributeTableSelectedRowKey;
    // }

    getLegendPanel(): any {
        return this.legendPanel;
    }

    getBaseLayer(): any {
        const layers = this.map.getLayers().getArray();
        let currentBaseLayer: BaseLayer | null = null;
        layers.forEach(function (layer) {
            if (layer.get('title') === "Base Layers" && layer.getVisible()) {
                // If it's the layer group and it's visible, get the base layer within the group
                //@ts-ignore
                const subLayers = layer.getLayers().getArray();
                subLayers.forEach(function (subLayer: BaseLayer) {
                    if (subLayer.getVisible()) {
                        currentBaseLayer = subLayer;
                    }
                });
            }

        });
        return currentBaseLayer
    }


    addLegendControlToMap() {
        // Define a new legend
        this.legendPanel = new ol_legend_Legend({
            title: "Legend", margin: 5, padding: 10, maxHeight: 150, //maxWidth: 100
        });
        const legendCtrl = new Legend({
            legend: this.legendPanel, // collapsed: true
        });
        //@ts-ignore
        this.map.addControl(legendCtrl);
    }

    isLegendItemExist(legend: any, title: string) {
        const items = legend?.getItems()?.getArray() || [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].get("title") === title) {
                return true;
            }
        }
        return false;
    }


    getApi() {
        return this.api;
    }

    getAttributeTableToolbarRef(): RefObject<AttributeTableToolbarHandle | null> {
        return this._domRef.attributeTableToolbarRef
    }

    getMapLoadingRef(): RefObject<DAMapLoadingHandle | null> {
        return this._domRef.loadingRef;
    }

    getMapToolbarRef(): RefObject<MapToolbarHandle | null> {
        return this.mapToolbar.getToolbarContainerRef()
    }

    setTimeSliderRef(timeSliderRef: RefObject<TimeSliderHandle>) {
        this._domRef.timeSliderRef = timeSliderRef;
    }

    // setIdentifierResultRef(identifyResultRef: RefObject<IdentifyResultHandle | null>) {
    //     this._domRef.identifyResultRef = identifyResultRef
    // }

    getIdentifierResultRef(): RefObject<IdentifyResultHandle | null> {
        return this._domRef.identifyResultRef;
    }

    getTimeSliderRef(): RefObject<TimeSliderHandle> {
        // @ts-ignore
        return this._domRef.timeSliderRef;
    }

    // setContextMenuRef(contextMenuRef: RefObject<ContextMenuHandle | null>) {
    //     this._domRef.contextMenuRef = contextMenuRef;
    // }

    // getContextMenuRef(): RefObject<ContextMenuHandle | null> {
    //     return this._domRef.contextMenuRef;
    // }

    getRightDrawerRef(): RefObject<RightDrawerHandle> {
        // @ts-ignore
        return this._domRef.rightDrawerRef;
    }

    getBottomDrawerRef(): RefObject<BottomDrawerHandle> {
        // @ts-ignore
        return this._domRef.bottomDrawerRef;
    }

    getLeftDrawerRef(): RefObject<LeftDrawerHandle> {
        // @ts-ignore
        return this._domRef.leftDrawerRef;
    }


    getDialogBoxRef(): RefObject<DADialogBoxHandle | null> {
        return this._domRef.dialogBoxRef;
    }

    getSnackbarRef(): RefObject<DASnackbarHandle | null> {
        return this._domRef.snackBarRef;
    }

    getLayerOfInterest(): string | null {
        return this._layerOfInterest;
    }

    setMapUUID(UUID: string) {
        if (!this.mapInfo) return
        this.mapInfo.uuid = UUID;
    }

    getMapUUID(): string {
        if (this.mapInfo) {
            return this.mapInfo?.uuid;
        } else {
            this.showSnackbar("Please save map before proceeding");
            return "-1";
        }
    }
    public async getMapUUIDByLayerTitle(layerTitle:string): Promise<string | null> {
        const res = await this.api.get(MapAPIs.DCH_MAP_UUID, {layer_title: layerTitle})
        if(res)
            return res
        return null;
    }

    get isMapEditor(): boolean {
        // console.log("is Editor", this.mapInfo?.isEditor)
        // @ts-ignore
        return this._isMapEditor;
    }

    set isMapEditor(isEditor: boolean) {
        this._isMapEditor = isEditor;
    }

    setLayerOfInterest(uuid: string, closeDrawer: boolean = false) {
        this._layerOfInterest = uuid || null;

        const sel = document.getElementById("loi-select") as HTMLSelectElement | null;
        if (sel) {
            sel.value = uuid || "";
        }

        const bottomDrawerRef = this.getBottomDrawerRef().current;
        if (closeDrawer && bottomDrawerRef?.isOpen()) {
            bottomDrawerRef.closeDrawer();
        }
    }

    clearLayerOfInterest() {
        this._layerOfInterest = null;

        const sel = document.getElementById("loi-select") as HTMLSelectElement | null;
        if (sel) {
            sel.value = "";
        }
    }



    addSidebarController() {
        // let sidebarElem: HTMLElement = document.querySelector('.sidebar');
        // sidebarElem.style.display = "block";
        // let sidebar: Sidebar = new Sidebar({element: 'sidebar', position: 'right'});
        // this.getMap().addControl(sidebar);
    }


    refreshMap() {
        this.showSnackbar("Refreshing map...", "info", 2000);
        this.map?.render();
        this.map?.setSize(this.map.getSize());
        this.map?.updateSize();

        setTimeout(() => {
            this.layerManager.refreshAllDALayers();
        }, 100);
    }

    getMap(): OLMap {
        return this.map;
    }

    isValidExtent(extent: unknown): extent is number[] {
        return (
            Array.isArray(extent) &&
            extent.length === 4 &&
            extent.every((v) => Number.isFinite(v))
        );
    };

    bufferExtent(extent: [number, number, number, number], buffer: number = 300): [number, number, number, number] {
        return [
            extent[0] - buffer,
            extent[1] - buffer,
            extent[2] + buffer,
            extent[3] + buffer,
        ];
    }


    setMapExtent(extent: number[]) {
        this.mapExtent = extent;
    }

    zoomToMapExtent(maxZoom: number = 18): void {
        if (this.mapExtent) {
            this.map.getView().fit(this.mapExtent, {
                size: this.map.getSize(), maxZoom, duration: 1000,
            });
        } else {
            this.zoomToAllLayersExtent(maxZoom);
        }
    }

    // zoomToFullExtent(geometry: any) {
    //     console.log("zoomToFullExtent", geometry)
    //     if (!geometry) {
    //         console.error("zoomToFullExtent: No geometry provided.");
    //         return;
    //     }
    //
    //     if (Array.isArray(geometry) && geometry.length === 4) {
    //         this.map.getView().fit(geometry, { duration: 1000 });
    //     } else if (geometry instanceof Geometry) {
    //         //@ts-ignore
    //         this.map.getView().fit(geometry, { duration: 1000 });
    //     } else {
    //         console.error("zoomToFullExtent: Invalid geometry", geometry);
    //         throw new Error("Invalid extent or geometry provided as `geometry`");
    //     }
    // }

    zoomToAllLayersExtent(maxZoom: number = 18): void {
        const map = this.getMap();
        if (!map) return;

        const combinedExtent = createEmpty();
        const layers = map.getLayers().getArray();

        for (const layer of layers) {
            if (!(layer instanceof BaseLayer) || !layer.getVisible()) continue;

            // Prefer layer extent if available, otherwise fallback to source extent
            const layerExtent = layer.getExtent?.();
            //@ts-ignore
            const sourceExtent = layer?.getSource?.()?.getExtent?.();

            const extent = layerExtent ?? sourceExtent;

            if (extent && extent.length === 4 && !isEmpty(extent)) {
                extend(combinedExtent, extent);
            }
        }

        if (!isEmpty(combinedExtent)) {
            map.getView().fit(combinedExtent, {
                size: map.getSize(), maxZoom: maxZoom, duration: 1000
            });
        } else {
            console.warn("No valid layer extents found to zoom.");
        }
    }


    zoomToExtent(extent: number[], zoomLevel: number = 19) {
        if (!this.map || !extent || extent.length !== 4) return;

        this.map.updateSize();

        const view = this.map.getView();
        const size = this.map.getSize();

        if (!size) {
            requestAnimationFrame(() => {
                this.map.getView().fit(extent);
            });
            return;
        }

        view.fit(extent, {
            size,
            maxZoom: zoomLevel,
            padding: [20, 20, 20, 20],
            duration: 500,
        });
    }

    public goToCoordinate(
        x: number,
        y: number,
        sourceSrid: string = "4326",
        zoom: number = 19
    ) {
        const map = this.getMap();
        const view = map.getView();
        const mapProjection = view.getProjection().getCode();

        let coord: [number, number] = [x, y];
        if (`EPSG:${sourceSrid}` !== mapProjection) {
            coord = transform(coord, `EPSG:${sourceSrid}`, mapProjection) as [number, number];
        }

        view.animate({
            center: coord,
            zoom,
            duration: 700,
        });
        this.getSelectionLayer().addWKT2Selection(
            `SRID=${sourceSrid};POINT(${x} ${y})`
        );
    }

    getCurrentExtent() {
        return this.map.getView().calculateExtent(this.map.getSize());
    }

    getExtent() {
        return this.mapExtent ? this.mapExtent : this.getCurrentExtent();
    }


    addGEELayer(layerInfo: IXYZLayerInfo) {
        return this.layerManager.addGEELayer(layerInfo);
    }


    addOverlayLayer(
        overlayLayer: IDWLayer | OverlayVectorLayer | SelectionLayer | WMSLayer | WFSLayer
    ) {
        return this.layerManager.addOverlayLayer(overlayLayer);
    }

    getOverlayLayer(key: string) {
        return this.layerManager.getOverlayLayer(key);
    }

    getOverlayLayerByTitle(title: string) {
        return this.layerManager.getOverlayLayerByTitle(title);
    }

    isOverlayLayerExist(uuid: string) {
        return this.layerManager.isOverlayLayerExist(uuid);
    }

    isDALayerExists(uuid: string) {
        return this.layerManager.isDALayerExists(uuid);
    }

    removeOverlayLayer(uuid: string) {
        this.layerManager.removeOverlayLayer(uuid);
    }


    async addDALayer(
        info: {
            uuid: string;
            style?: IFeatureStyle;
            visible?: boolean;
            zoomRange?: [number, number];
            opacity?: number;
            zIndex?: number;
            groupName?: string;
        },
        index: number = 0
    ) {
        return this.layerManager.addDALayer(info, index);
    }


    addRasterLayer(layerInfo: ILayerInfo) {
        const daLayer = new RasterTileLayer(layerInfo, this);
        this.layerManager.registerExistingDALayer(daLayer);
    }

    getDALayer(layerId: string | undefined): any {
        return this.layerManager.getDALayer(layerId);
    }


    getDALayerByTitle(title: string): any {
        return this.layerManager.getDALayerByTitle(title);
    }

    removeDALayer(uuid: string) {
        this.layerManager.removeDALayer(uuid);
    }

    getTemporalLayerTitles() {
        return this.layerManager.getTemporalLayerTitles();
    }

    getTemporalLayer(uuid: string) {
        return this.layerManager.getLayerRecord(uuid)?.wrapper;
    }

    createWFSLayer(info: IGeoServerWFSInfo): WFSLayer | undefined {
        return this.layerManager.createWFSLayer(info);
    }

    createWMSLayer(info: IGeoServerWMSInfo): WMSLayer | undefined {
        return this.layerManager.createWMSLayer(info);
    }

    createOverlayLayer(uuid: string, geoJSON: IGeoJSON, title: string, style?: IFeatureStyle): OverlayVectorLayer | undefined {
        return this.layerManager.createOverlayLayer(uuid, geoJSON, title, style);
    }

    getLayerRecord(id: string) {
        return this.layerManager.getLayerRecord(id);
    }

    getAllLayerRecords() {
        return this.layerManager.getAllLayerRecords();
    }

    findLayerByTitle(title: string) {
        return this.layerManager.findLayerByTitle(title);
    }

    getLayersByKind(kind: LayerKind) {
        return this.layerManager.getLayersByKind(kind);
    }

    hasTemporalLayers(): boolean {
        return this.layerManager.hasTemporalLayers();
    }


    showSnackbar(
        msg: string | ReactNode,
        severity: AlertColor = "info",
        duration: number = 4000,
        icon?: ReactNode // 👈 optional icon
    ) {
        /**
         * Displays a snackbar message with optional severity, duration, and icon.
         *
         * @param msg - The message to display.
         *              Example:
         *              - "Saved successfully"
         *              - <>Please click <SaveIcon fontSize="small" /> Save</>
         *
         * @param severity - Visual style:
         *        'error' | 'info' | 'success' | 'warning'
         *
         * @param duration - Duration in milliseconds (default: 4000 ms)
         *
         * @param icon - Optional custom icon (e.g., MUI icon component)
         */

        if (icon) {
            // Use object version when icon is provided
            this._domRef?.snackBarRef?.current?.show({
                message: msg,
                severity,
                duration,
                icon,
            });
        } else {
            // Backward-compatible call
            this._domRef?.snackBarRef?.current?.show(msg, severity, duration);
        }
    }

    showMapLoading() {
        this.getMapLoadingRef()?.current?.openIsLoading();
    }

    closeMapLoading() {
        this.getMapLoadingRef()?.current?.closeIsLoading();
    }


    static generateUUID() {
        // Public Domain/MIT
        let d = new Date().getTime(); //Timestamp
        let d2 = (typeof performance !== "undefined" && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported
        return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            let r = Math.random() * 16; //random number between 0 and 16
            if (d > 0) {
                //Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else {
                //Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
    }


    /***
     New  functionalities
     ***/
    getSelectionLayer(mode: SelectionLayerMode = 'default') {
        this.selectionLayer = this.selectionLayer ? this.selectionLayer : new SelectionLayer(this);
        this.selectionLayer.setSelectionMode(mode)
        return this.selectionLayer;
    }



    addTimeSliderControl(
        timeSliderRef: RefObject<TimeSliderHandle>,
        onDateChange?: (selectedDate: Date) => void
    ): TimeSliderControl {
        const timeSliderControl = new TimeSliderControl({
            mapVM: this,
            timeSliderRef,
            onDateChange
        });

        const map = this.getMap();
        if (map) {
            map.addControl(timeSliderControl);
        }

        this.setTimeSliderRef(timeSliderRef);

        return timeSliderControl;
    }


    getAttributeTableManager(): AttributeTableManager {
        return this.attributeTableManager;
    }

    refreshAttributeTable = async () => {
        return this.attributeTableManager.refresh();
    };

    openAttributeTable = (tableHeight = 250) => {
        return this.attributeTableManager.open(tableHeight);
    };


    openCustomAttributeTable = (args: {
        columns: Column[]; rows: Row[]; pkCols?: string[]; tableHeight?: number;
    }) => {
        this.attributeTableManager.openCustomAttributeTable(args)
    };


    setTheme(theme: Theme) {
        this._theme = theme
    }

    getTheme(): Theme | undefined {
        return this._theme
    }

    /****
     overlayer layer new function July  2025
     ***/

    static getDefaultStyle(geomStyle: IGeomStyle = {}, alpha: number = 0.8): IFeatureStyle {
        const baseRGB = ColorUtils.getRandomRGB()
        const fillColor = geomStyle?.fillColor ?? ColorUtils.toRGBA(baseRGB!, alpha);
        const strokeColor = geomStyle?.strokeColor ?? ColorUtils.toRGBA(ColorUtils.darkenColor(baseRGB!, 0.7), 1);

        return {
            type: "single", style: {
                default: {
                    strokeColor: strokeColor,
                    strokeWidth: geomStyle?.strokeWidth ?? 2,
                    fillColor: fillColor,
                    pointShape: geomStyle?.pointShape ?? "circle",
                    pointSize: geomStyle?.pointSize ?? 10
                }
            }
        };
    }


    static getMultipleStyle(rules: IRule[], alpha = 0.8): IFeatureStyle {
        return {
            type: "multiple", style: {
                rules: rules.map(rule => {
                    // If fillColor is not provided, generate a random one
                    const baseRGB = rule.style.fillColor ? null : ColorUtils.getRandomRGB();
                    const fillColor = rule.style.fillColor ?? ColorUtils.toRGBA(baseRGB!, alpha);
                    const strokeColor = rule.style.strokeColor ?? ColorUtils.toRGBA(ColorUtils.darkenColor(baseRGB!, 0.7), 1);

                    return {
                        title: rule.title, filter: rule.filter, style: {
                            strokeColor,
                            strokeWidth: rule.style.strokeWidth ?? 2,
                            fillColor,
                            pointShape: rule.style.pointShape ?? "circle",
                            pointSize: rule.style.pointSize ?? 10
                        }
                    };
                })
            }
        };
    }


    private _mapPanelButtons: ReactNode[] = [];

    setMapPanelButtons(content: ReactNode) {
        this._mapPanelButtons.push(content);
    }

    getMapPanelButtons(): ReactNode[] {
        return this._mapPanelButtons;
    }

    setCustomIdentifyRenderer(renderer: (feature: Feature<Geometry>) => ReactNode | null) {
        this._identifierFeatureRenderer = renderer;
    }

    getCustomIdentifyRenderer() {
        return this._identifierFeatureRenderer;
    }


    /**
     * Auto-proj4 for EPSG:32601–32660 (WGS84 UTM North, zones 1–60)
     * and EPSG:32701–32760 (WGS84 UTM South, zones 1–60).
     */
    // private makeUtmProjDef(epsg: string): string | undefined {
    //     const m = /^EPSG:(326|327)(\d{2})$/.exec(epsg);
    //     if (!m) return undefined;
    //
    //     const hemi = m[1] === "326" ? "north" : "south";
    //     const zone = parseInt(m[2], 10);
    //     if (zone < 1 || zone > 60) return undefined;
    //
    //     // proj4 classic UTM string; +type=crs is fine but optional
    //     return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs ${hemi === "south" ? "+south " : ""}+type=crs`.trim();
    // }

    /**
     * Ensure an EPSG code is available to OpenLayers.
     * - If already present, returns true.
     * - If EPSG is a UTM on WGS84 (326xx/327xx), auto-generates a proj4 def.
     * - Else, uses optional `def` if provided.
     *  proj4.defs("EPSG:32642", "+proj=utm +zone=42 +datum=WGS84 +units=m +no_defs +type=crs");
     *  proj4.defs("EPSG:32643", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs +type=crs");
     */
    // ensureProjection(epsg: string, def?: string): boolean {
    //     if (!epsg) return false;
    //     if (getProjection(epsg)) return true;
    //
    //     // Try to auto-generate def for UTM on WGS84
    //     const auto = this.makeUtmProjDef(epsg);
    //     const toUse = auto ?? def;
    //
    //     if (toUse) {
    //         proj4.defs(epsg, toUse);
    //         return !!getProjection(epsg);
    //     }
    //     return false;
    // }
    getViewProjectionCode() {
        return this.getMap().getView().getProjection().getCode();
    }


    /**
     * Selection Tool
     */
    public async performClickSelection(pixel: any) {
        return await this.selectionManager?.handleIdentifyClick(pixel);
    }

    public async performSpatialSelection(geom: Geometry, selectionMode: SelectionLayerMode = "default", selLayerUUIDs: string[] = []): Promise<void> {
        // if selLayerUUID will not provide all layer will be selected
        if (!this.selectionManager) {
            this.selectionManager = new SelectionManager(this)
        }
        this.selectionManager.selectionLayerMode = selectionMode
        return await this.selectionManager.execute(geom, selLayerUUIDs);
    }

    // ==== Facade methods (same signatures as before) ====

    public onCustomTool(type: OLMapEventType, toolId: string, handler: (...args: any[]) => void) {
        return this.tools.onCustomTool(type, toolId, handler);
    }

    public offCustomTool(toolId: string, resetCursor: boolean = true) {
        this.tools.offCustomTool(toolId, resetCursor);
    }

    public offAllCustom(resetCursor: boolean = true) {
        this.tools.offAllCustom(resetCursor);
    }

    public countCustom(toolId?: string) {
        return this.tools.countCustom(toolId);
    }

    public activateCustomExclusive(toolId: string, armer: ArmerFn, cursor?: string) {
        this.tools.activateCustomExclusive(toolId, armer, cursor);
    }

    /**
     *  Applying constraint on map
     */
    public applyExtentConstraint(
        extent?: number[],
        buffer: number = 300,
        zoomToExtent: boolean = true
    ): void {
        const targetExtent = extent ?? this.mapExtent;

        if (!this.map || !this.isValidExtent(targetExtent)) {
            console.warn("applyExtentConstraint: invalid extent", targetExtent);
            return;
        }

        const oldView = this.map.getView();

        const constrainedExtent = this.bufferExtent(
            targetExtent as [number, number, number, number],
            buffer
        );
        this.extentConstraint = constrainedExtent;

        const size = this.map.getSize();
        const resolutionForExtent = size
            ? oldView.getResolutionForExtent(constrainedExtent, size)
            : undefined;

        const minZoom = resolutionForExtent
            ? oldView.getZoomForResolution(resolutionForExtent)
            : oldView.getMinZoom() ;

        const newView = new OLView({
            projection: oldView.getProjection(),
            center: oldView.getCenter(),
            zoom: oldView.getZoom(),
            rotation: oldView.getRotation(),
            minZoom: (minZoom ?? oldView.getMinZoom()) - 2,
            maxZoom: oldView.getMaxZoom(),
            extent: constrainedExtent,
        });

        this.map.setView(newView);

        if (zoomToExtent) {
            newView.fit(constrainedExtent, {
                size: this.map.getSize(),
                duration: 500,
                nearest: true,
            });
        }

        console.log("Applied map extent constraint", constrainedExtent, "minZoom", minZoom);
    }

    public clearExtentConstraint(): void {
        if (!this.map) return;
        this.extentConstraint = undefined;
        this.map.getView().setProperties({
            extent: undefined,
        });
    }

    public getExtentConstraint(): number[] | undefined {
        return this.extentConstraint;
    }

    public hasExtentConstraint(): boolean {
        return !!this.extentConstraint;
    }
    // private isExtentConstraintApplied(): boolean {
    //     return !!this.getExtentConstraint();
    // }

    /** Optional cleanup */
    public dispose() {
        this.tools.destroy();
    }

    public getLayerZIndex(layer: BaseLayer): number {
        return layer.getZIndex() ?? 0;
    };
}

export default MapVM;
