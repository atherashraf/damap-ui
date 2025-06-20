import "ol/ol.css";
import "ol-ext/dist/ol-ext.css";
import "@/assets/css/da-ol.css";
import Map from "ol/Map.js";
import View from "ol/View.js";
import {defaults as defaultControls} from "ol/control";
import BaseLayers from "../layers/BaseLayers";
import MapToolbar from "@/components/map/toolbar/MapToolbar";
import MVTLayer from "../layers/da_layers/MVTLayer";
import MapApi, {MapAPIs} from "@/api/MapApi";
import {JSX, RefObject} from "react";
import {
    IFeatureStyle,
    IDomRef,
    ILayerInfo,
    IMapInfo,
} from "@/types/typeDeclarations";
import RightDrawer from "@/components/map/drawers/RightDrawer";
import LeftDrawer from "@/components/map/drawers/LeftDrawer";
import DADialogBox from "@/components/base/DADialogBox";
// @ts-ignore
import Legend from "ol-ext/control/Legend";
// @ts-ignore
import ol_legend_Legend from "ol-ext/legend/Legend";
import RasterTileLayer from "@/components/map/layers/da_layers/RasterTileLayer";
import AbstractDALayer from "@/components/map/layers/da_layers/AbstractDALayer";


import autoBind from "auto-bind";
import DAMapLoading from "@/components/map/widgets/DAMapLoading";
import {TimeSliderHandle} from "@/components/map/time_slider/TimeSlider";
import DAVectorLayer from "@/components/map/layers/da_layers/DAVectorLayer";
import IDWLayer from "@/components/map/layers/overlay_layers/IDWLayer";
import OverlayVectorLayer from "@/components/map/layers/overlay_layers/OverlayVectorLayer";
import XYZLayer, {IXYZLayerInfo} from "@/components/map/layers/overlay_layers/XYZLayer";
import BaseLayer from "ol/layer/Base";
import {DASnackbarHandle} from "@/components/base/DASnackbar";
import BottomDrawer from "@/components/map/drawers/BottomDrawer";
import {AlertColor, Theme} from "@mui/material";

import SelectionLayer from "@/components/map/layers/overlay_layers/SelectionLayer";
import {Column, Row} from "@/types/gridTypeDeclaration";
import {Feature} from "ol";
import _ from "@/utils/lodash";
import TimeSliderControl from "@/components/map/time_slider/TimeSliderControl";
import timeSliderControl from "@/components/map/time_slider/TimeSliderControl";


export interface IDALayers {
    [key: string]: AbstractDALayer;
}

interface IOverlays {
    [key: string]: OverlayVectorLayer | IDWLayer | SelectionLayer;
}

interface IXYZLayers {
    [key: string]: XYZLayer
}

class MapVM {

    // @ts-ignore
    private map: Map;
    daLayers: IDALayers = {};
    temporalLayers: IDALayers = {};
    overlayLayers: IOverlays = {};
    geeLayers: IXYZLayers = {}
    xyzLayer: IXYZLayers = {}
    private _domRef: IDomRef;
    private _layerOfInterest: string | null = null;
    private _daLayerAddedEvent = new Event("DALayerAdded");
    // @ts-ignore
    currentMapInteraction = null;
    // leftDrawerRef: any
    mapExtent: Array<number> = [
        7031250.271849444, 2217134.3474655207, 8415677.728150556, 4922393.652534479,
    ];
    isInit: Boolean = false;
    public readonly api: MapApi;
    private isDesigner: boolean;
    // private readonly fullScreen: FullScreen;
    private legendPanel: any = null;
    // @ts-ignore
    private mapInfo: IMapInfo;
    private additionalToolbarButtons: JSX.Element[] = [];
    private attributeTableSelectedRowKey: string | null = null;
    private attributeTableScrollTop: number = 0;
    private selectionLayer: SelectionLayer | undefined;
    private mapToolbar: MapToolbar;
    private _theme: Theme | undefined;


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
    }

    setIsDesigner(isDesigner: boolean) {
        this.isDesigner = isDesigner;
    }

    initMap(mapInfo?: IMapInfo) {
        // @ts-ignore
        this.mapInfo = mapInfo;
        this.map = new Map({
            controls: defaultControls().extend([
                // this.fullScreen,
                this.mapToolbar
            ]),
            view: new View({
                center: [7723464, 3569764],
                zoom: 5,
            }),
        });
        let baseLayer;
        // const weatherLayerInfos: any[] = [];
        if (mapInfo) {
            if ("extent" in mapInfo) {
                // @ts-ignore
                this.mapExtent = mapInfo?.extent;
            }

            mapInfo?.layers?.forEach(async (layerInfo: {
                uuid: string;
                style?: IFeatureStyle;
                visible?: boolean;
                isBase?: boolean;
                key?: string
            }, index) => {
                if (layerInfo.uuid !== "-1") {
                    await this.addDALayer(layerInfo, index);
                    if (index == 0) this.setLayerOfInterest(layerInfo.uuid, false);
                } else if (layerInfo.isBase) {
                    baseLayer = layerInfo.key;
                } else {
                    console.log("weather layer", layerInfo)
                }
            });
        }

        new BaseLayers(this).addBaseLayers(baseLayer);
        this.addSidebarController();
        this.isInit = true;
        this.selectionLayer = new SelectionLayer(this);
    }

    isLayerDesigner(): boolean {
        return this.isDesigner;
    }

    getMapInfo(): IMapInfo | undefined {
        return this.mapInfo;
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
            title: "Legend",
            margin: 5,
            padding: 10,
            maxHeight: 150,
            //maxWidth: 100
        });
        let legendCtrl = new Legend({
            legend: this.legendPanel,
            // collapsed: true
        });
        //@ts-ignore
        this.map.addControl(legendCtrl);
    }

    isLegendItemExist(legend: any, title: string) {
        let items = legend?.getItems()?.getArray() || [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].get("title") === title) {
                return true;
            }
        }
        return false;
    }

    setMapFullExtent(extent: number[]) {
        this.mapExtent = extent;
    }

    getApi() {
        return this.api;
    }


    getMapLoadingRef(): RefObject<DAMapLoading | null> {
        return this._domRef.loadingRef;
    }

    setTimeSliderRef(timeSliderRef: RefObject<TimeSliderHandle>) {
        this._domRef.timeSliderRef = timeSliderRef;
    }

    getTimeSliderRef(): RefObject<TimeSliderHandle> {
        // @ts-ignore
        return this._domRef.timeSliderRef;
    }

    getRightDrawerRef(): RefObject<RightDrawer> {
        // @ts-ignore
        return this._domRef.rightDrawerRef;
    }

    getBottomDrawerRef(): RefObject<BottomDrawer> {
        // @ts-ignore
        return this._domRef.bottomDrawerRef;
    }

    getLeftDrawerRef(): RefObject<LeftDrawer> {
        // @ts-ignore
        return this._domRef.leftDrawerRef;
    }


    getDialogBoxRef(): RefObject<DADialogBox | null> {
        return this._domRef.dialogBoxRef;
    }

    getSnackbarRef(): RefObject<DASnackbarHandle | null> {
        return this._domRef.snackBarRef;
    }

    getLayerOfInterest(): string {
        // @ts-ignore
        return this._layerOfInterest;
    }

    getMapUUID(): string {
        if (this.mapInfo) {
            return this.mapInfo?.uuid;
        } else {
            this.showSnackbar("Please save map before proceeding");
            return "-1";
        }
    }

    isMapEditor(): boolean {
        // console.log("is Editor", this.mapInfo?.isEditor)
        // @ts-ignore
        return this.mapInfo?.isEditor;
    }

    setLayerOfInterest(uuid: string, closeDrawer: boolean = true) {
        this._layerOfInterest = uuid;
        setTimeout(() => {
            const sel: HTMLSelectElement = document.getElementById(
                "loi-select"
            ) as HTMLSelectElement;
            if (sel) {
                //@ts-ignore
                sel.selectedIndex = [...sel.options].findIndex(
                    (option) => option.value === uuid
                );
            }
        }, 1000);

        // const mapBoxRef = this.getMapPanelRef();
        const bottomDrawerRef = this.getBottomDrawerRef();
        let open = bottomDrawerRef.current?.isOpen();
        if (open && closeDrawer) {
            bottomDrawerRef.current?.closeDrawer();
        }
    }

    isLayerExist(uuid: string) {
        // const k: string[] = Object.keys(this.daLayers)
        for (let key in this.daLayers) {
            if (key === uuid) return true;
        }
        return false;
    }

    addSidebarController() {
        // let sidebarElem: HTMLElement = document.querySelector('.sidebar');
        // sidebarElem.style.display = "block";
        // let sidebar: Sidebar = new Sidebar({element: 'sidebar', position: 'right'});
        // this.getMap().addControl(sidebar);
    }

    setTarget(target: string) {
        this.map.setTarget(target);
        this.zoomToFullExtent();
        setTimeout(() => this.map.updateSize(), 2000);
    }

    refreshMap() {
        setTimeout(() => {
            // this.map?.render()
            // this.map?.updateSize()
            // this.map?.setSize(this.map.getSize())
            // this.map?.updateSize()
            this.showSnackbar("Refreshing map...", "info", 2000);
            Object.keys(this.daLayers).forEach((key) => {
                this.daLayers[key].refreshLayer();
            });
        }, 100);
    }

    getMap(): Map {
        return this.map;
    }

    zoomToFullExtent() {
        // const extent = [7031250.271849444, 2217134.3474655207, 8415677.728150556, 4922393.652534479]
        this.mapExtent &&
        //@ts-ignore
        this.map.getView().fit(this.mapExtent, this.map?.getSize());
    }

    zoomToExtent(extent: number[]) {
        // @ts-ignore
        this.map.getView().fit(extent, this.map.getSize());
    }

    getCurrentExtent() {
        return this.map.getView().calculateExtent(this.map.getSize());
    }

    getExtent() {
        return this.mapExtent ? this.mapExtent : this.getCurrentExtent();
    }


    isLayerAdded(targetLayer: any) {
        let layerFound = false;
        targetLayer && this.getMap().getLayers().forEach(layer => {
            if (layer === targetLayer) {
                layerFound = true;
            }
        });
        // if(!layerFound) targetLayer.dispose ? targetLayer.dispose() : null;
        return layerFound;
    };

    isGEELayerExist(uuid: string): boolean {
        let isExist;
        isExist = uuid in this.geeLayers
        isExist = isExist && this.isLayerAdded(this.geeLayers[uuid]?.olLayer)
        // console.log("is layer in map", this.isLayerAdded(this.geeLayers[uuid]?.olLayer))
        // if (isExist && !layerInMap) {
        //     console.log("gee layer disposed", this.geeLayers[uuid]?.olLayer.dispose)
        //     isExist = layerInMap
        // }

        return isExist;
    }

    addGEELayer(layerInfo: IXYZLayerInfo) {
        if (!this.isGEELayerExist(layerInfo.uuid)) {
            const xyzLayer = new XYZLayer(layerInfo, this);
            this.geeLayers[layerInfo.uuid] = xyzLayer;
            this.map.addLayer(xyzLayer.olLayer);
        } else {
            this.getSnackbarRef()?.current?.show("Layer already exists");
        }
    }

    addOverlayLayer(overlayLayer: IDWLayer | OverlayVectorLayer | SelectionLayer) {

        const layer = overlayLayer.olLayer
        const key = layer.get("name")

        if (!(key in this.overlayLayers)) {
            this.overlayLayers[key] = overlayLayer;
            this.map.addLayer(layer);
        }
    }

    getOverlayLayer(uuid: string) {
        return this.overlayLayers[uuid]
    }

    getOverlayLayerByTitle(title: string) {
        const uuid = Object.keys(this.overlayLayers).find((uuid) => this.overlayLayers[uuid].olLayer.get("title") === title)
        return uuid && this.isOverlayLayerExist(uuid) && this.getOverlayLayer(uuid)
    }

    isOverlayLayerExist(uuid: string) {
        return uuid in this.overlayLayers;
    }

    isDALayerExists(uuid: string) {
        return uuid in this.daLayers
    }

    removeOverlayLayer(uuid: string) {
        if (uuid in this.overlayLayers) {
            const daLayer = this.overlayLayers[uuid];
            this.map.removeLayer(daLayer.olLayer);
            delete this.overlayLayers[uuid];
        }
    }


    async addDALayer(
        info: {
            uuid: string;
            style?: IFeatureStyle;
            visible?: boolean;
            zoomRange?: [number, number];
            opacity?: number;
        },
        index: number = 0
    ) {
        const {uuid, style, zoomRange} = info;
        if (!(uuid in this.daLayers)) {
            this.getMapLoadingRef()?.current?.openIsLoading();
            try {
                const payload: ILayerInfo = await this.api.get(MapAPIs.DCH_LAYER_INFO, {
                    uuid: uuid,
                });
                if (payload) {
                    payload.zIndex = index;
                    if (style) payload.style = style;
                    if (zoomRange) payload.zoomRange = zoomRange;
                    let daLayer: AbstractDALayer | null;
                    //@ts-ignore
                    this._domRef.snackBarRef.current.show(`Adding ${payload.title} Layer`);

                    if (payload?.dataModel === "V") {
                        if (payload.format === "WFS") {
                            daLayer = new DAVectorLayer(payload, this);
                            this.daLayers[payload.uuid] = daLayer;
                        } else {
                            daLayer = new MVTLayer(payload, this);
                            this.daLayers[payload.uuid] = daLayer;
                        }
                    } else {
                        daLayer = new RasterTileLayer(payload, this);
                        this.daLayers[payload.uuid] = daLayer;
                    }
                    if (payload.dateRangeURL) {
                        // console.log("layer info of a temporal layer", payload)
                        // console.log("data url", payload.dataURL)

                        this.temporalLayers[payload.uuid] = daLayer;
                        const event = new CustomEvent("temporalLayerAdded", {
                            detail: {uuid: payload.uuid},
                        });
                        window.dispatchEvent(event);
                    }
                    const visible = info?.visible !== undefined ? info.visible : true;
                    const opacity = info?.opacity !== undefined ? info.opacity : 1;
                    if (daLayer) {
                        const olLayer = daLayer?.getOlLayer();
                        olLayer?.setVisible(visible);
                        olLayer?.setOpacity(opacity);
                        window.dispatchEvent(this._daLayerAddedEvent);
                        setTimeout(() => olLayer.setZIndex(index), 3000);
                    }
                }
            } catch (e) {
                console.error(e)
            }
            this.getMapLoadingRef()?.current?.closeIsLoading();
        }
    }

    getDALayer(layerId: string | undefined): any {
        if (layerId) return this.daLayers[layerId];
        return undefined;
    }

    getDALayerByTitle(title: string): any {
        const uuid = Object.keys(this.daLayers).find((uuid: string) =>
            (this.daLayers[uuid].getLayerTitle().toLowerCase() === title.toLowerCase()))
        return this.getDALayer(uuid)
    }


    showSnackbar(msg: string, severity: AlertColor = 'info', duration: number = 4000) {
        /**
         * Displays a snackbar message with optional severity and duration.
         *
         * @param msg - The message to display.
         * @param duration - How long the snackbar should remain visible (in milliseconds). Default is 4000 ms.
         * @param severity - The visual style of the snackbar, indicating the type of message.
         *                   Accepted values are:
         *                   - 'error'   → for error messages
         *                   - 'info'    → for informational messages (default)
         *                   - 'success' → for success confirmations
         *                   - 'warning' → for warnings
         */
        this._domRef?.snackBarRef?.current?.show(msg, severity, duration);
    }


    static generateUUID() {
        // Public Domain/MIT
        let d = new Date().getTime(); //Timestamp
        let d2 =
            (typeof performance !== "undefined" &&
                performance.now &&
                performance.now() * 1000) ||
            0; //Time in microseconds since page-load or 0 if unsupported
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

    //
    // selectFeature(id: any) {
    //     // console.log("feature " + id)
    //     // @ts-ignore
    //     const layer = this.overlayLayers["project_location"]
    //     const source = layer.getSource()
    //     const feature = source.getFeatures().find((feature: Feature) => {
    //         const properties = feature.getProperties()
    //         if (properties.id === id)
    //             return feature
    //     })
    //     // this.flash(feature)
    //     const sel_source = this.getSelectionLayer().getSource()
    //     sel_source.addFeature(feature)
    //
    // }
    //
    // clearSelectedFeatures() {
    //     const source = this.getSelectionLayer().getSource()
    //     source.clear()
    // }
    //
    // zoomToSelectedFeatures() {
    //     const layer = this.getSelectionLayer()
    //     const extent = buffer(layer.getSource().getExtent(), 20 * 1000)
    //     // @ts-ignore
    //     extent && this.map.getView().fit(extent, this.map.getSize());
    //
    // }


    getAdditionalToolbarButtons() {
        return this.additionalToolbarButtons;
    }

    addAdditionalToolbarButton(elem: JSX.Element) {
        this.additionalToolbarButtons.push(elem);
    }


    removeDALayer(uuid: string) {
        delete this.daLayers[uuid];
    }


    /***
     New  functionalities
     ***/





    getSelectionLayer() {
        return this.selectionLayer;
    }

    hasTemporalLayers() {
        return Object.keys(this.temporalLayers).length > 0;
    }

    addTimeSliderControl(timeSliderRef, onDateChange?: (selectedDate: Date) => void): timeSliderControl {
        // console.log("MapPanel: adding time slider control");
        const timeSliderControl = new TimeSliderControl({
            mapVM: this,
            timeSliderRef,
            onDateChange
        });
        this.getMap()?.addControl(timeSliderControl);
        this.setTimeSliderRef(timeSliderRef)
        return timeSliderControl
    }

    getTemporalLayers(uuid: string) {
        return this.temporalLayers[uuid];
    }

    getTemporalLayerTitles() {
        return Object.keys(this.temporalLayers).map(uuid => this.temporalLayers[uuid].getLayerTitle())
    }

    setAttributeTableState(state: { selectedRowKey?: string | null; scrollTop?: number }) {
        if ('selectedRowKey' in state) {
            this.attributeTableSelectedRowKey = state.selectedRowKey!;
        }
        if ('scrollTop' in state) {
            this.attributeTableScrollTop = state.scrollTop!;
        }
    }

    getAttributeTableState(): { selectedRowKey: string | null; scrollTop: number } {
        return {
            selectedRowKey: this.attributeTableSelectedRowKey,
            scrollTop: this.attributeTableScrollTop,
        };
    }

    openAttributeTable = (tableHeight = 250) => {
        const bottomDrawer = this.getBottomDrawerRef();
        const drawerRef = bottomDrawer.current;
        if (!drawerRef) return;

        const uuid = this.getLayerOfInterest();
        if (!uuid) {
            this.showSnackbar("Please select a layer to view its attributes");
            return;
        }

        if (drawerRef.isOpen()) {
            if (drawerRef.isHidden?.()) {
                drawerRef.handleUnhide?.();
            }
            return;
        }

        if (this.isDALayerExists(uuid)) {
            this.getApi()
                .get(MapAPIs.DCH_LAYER_ATTRIBUTES, {uuid})
                .then((payload: { columns: Column[]; rows: Row[]; pkCols: string[] }) => {
                    if (payload) {
                        bottomDrawer?.current?.requestAttributeTable({
                            columns: payload.columns,
                            rows: payload.rows,
                            pkCols: payload.pkCols,
                            tableHeight: tableHeight,
                        });
                    } else {
                        drawerRef.closeDrawer();
                        this.getSnackbarRef()?.current?.show("No attribute found");
                    }
                })
                .catch(() => {
                    drawerRef.closeDrawer();
                    this.getSnackbarRef()?.current?.show("No attribute found");
                });
        } else if (this.isOverlayLayerExist(uuid)) {
            const overlayLayer = this.getOverlayLayer(uuid);
            const features = overlayLayer.getFeatures();
            const columns: Column[] = [];
            const rows: Row[] = [];
            features?.forEach((feature: Feature, index) => {
                const id = feature.getId();
                const properties = feature.getProperties();
                if (index === 0) {
                    Object.keys(properties).forEach((key) => {
                        columns.push({
                            disablePadding: false,
                            id: key,
                            label: key,
                            type: _.checkPrimitivesType(properties[key]),
                        });
                    });
                }
                //@ts-ignore
                rows.push({...properties, rowId: parseFloat(id)});
            });

            bottomDrawer?.current?.requestAttributeTable({
                columns,
                rows,
                pkCols: ["id"],
                tableHeight: tableHeight,
            });
        }
    };

    setTheme(theme: Theme) {
        this._theme = theme
    }

    getTheme(): Theme | undefined {
        return this._theme
    }
}

export default MapVM;
