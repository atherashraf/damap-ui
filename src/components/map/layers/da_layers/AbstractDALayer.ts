import MapVM from "../../models/MapVM";
import VectorLayer from "ol/layer/Vector";
import {Style} from "ol/style";
import autoBind from "auto-bind";
import {MapAPIs} from "@/api/MapApi";
import {Feature} from "ol";
import VectorTileLayer from "ol/layer/VectorTile";

import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import SLDStyleParser from "@/components/map/layer_styling/utils/SLDStyleParser";
import StylingUtils from "../../layer_styling/utils/StylingUtils";
import {IFeatureStyle, ILayerInfo} from "@/types/typeDeclarations";

class AbstractDALayer {
    dataSource: any;
    //@ts-ignore
    layer: VectorLayer<any> | VectorTileLayer | TileLayer<any> | ImageLayer<any>;
    layerInfo: ILayerInfo;
    style: IFeatureStyle;
    mapVM: MapVM;
    uuid: string;
    extent?: number[];
    //@ts-ignore
    features: any[];
    urlParams: string = "";
    resolutions: number[] = [];
    tileSize: number = 512

    constructor(info: ILayerInfo, mapVM: MapVM) {
        autoBind(this);
        this.layerInfo = info;
        this.mapVM = mapVM;
        //@ts-ignore
        this.uuid = info && "uuid" in info && info["uuid"];
        //@ts-ignore
        this.style = info && "style" in info && info["style"];
        this.setLayer();
        //@ts-ignore
        this.layer && this.mapVM.getMap().addLayer(this.layer);
        //@ts-ignore
        this.layer && this.addLayerChangeEvent();
    }

    getZIndex() {
        return this.layerInfo.zIndex;
    }

    addLayerChangeEvent() {
        this.layer.on("propertychange", (e) => {
            if (e.key === "map" && e.target.values_[e.key] == null) {
                this.mapVM.removeDALayer(this.layerInfo.uuid);
            }
            if (e.key === "map" && e.oldValue == null) {
                this.mapVM.daLayers[this.layerInfo.uuid] = this;
            }
        });
    }

    setSlDStyleAndLegendToLayer() {
        const type = this.style?.type || "";
        let lyr = this.layer;
        if (type === "sld") {
            let sldObj = new SLDStyleParser(this);
            //@ts-ignore
            sldObj.convertSLDTextToOL(this.style["style"], lyr);
        } else {
            if (!(lyr instanceof TileLayer || lyr instanceof ImageLayer)) {
                //@ts-ignore
                lyr.setStyle(this.vectorStyleFunction.bind(this));
                if (this.layerInfo?.geomType && this.layerInfo?.geomType.length > 0)
                    StylingUtils.addLegendGraphic(lyr, this.style, this.layerInfo?.geomType[0])
                this.mapVM.getLegendPanel()?.refresh();
            }
        }
    }

    // addLegendGraphic(layer: any) {
    //     //@ts-ignore
    //     // this.mapVM.legendPanel.addItem({
    //     //     title: layer.get('title'),
    //     //     typeGeom: this.layerInfo.geomType,
    //     //     style: laye r.getStyle()
    //     // });
    //     const styles = []
    //     // const c = "<canvas width=\"107\" height=\"80\"></canvas>"
    //     // const canvas = docum
    //     this.style.style.rules.forEach((rule: IRule) => {
    //         const fStyle =this.createOLStyle(this.layerInfo.geomType[0], rule.style)
    //         styles.push(fStyle);
    //     });
    //     let img = ol_legend_Legend.getLegendImage({
    //         style:styles,
    //         typeGeom: this.layerInfo.geomType[0],
    //         textStyle: null,
    //         title: layer.get('title'),
    //         className: ""
    //     });
    //     console.log("canvas", img)
    //
    //     // console.log("style", this.style)
    //     // console.log("layer style", layer.getStyle())
    //     // const graphic = new ol_legend_Legend({
    //     //     title: "",
    //     //     style: this.styleFunction.bind(this),
    //     //
    //     // });
    //     // graphic.setStyle(styles)
    //     // graphic.setTitle("working")
    //     layer.legend = {sType: 'ol', graphic: img}
    //     this.mapVM.legendPanel.refresh()
    // }

    setStyle(style: IFeatureStyle) {
        // this.mapVM.showSnackbar("Updating layer style")
        this.style = style;
        this.setSlDStyleAndLegendToLayer();
        this.refreshLayer();
    }

    updateStyle() {
        // this.mapVM.showSnackbar("Updating layer style")
        // console.log("layer Info", this.layerInfo)
        if (this.layerInfo.dataModel === "V") {
            this.mapVM
                .getApi()
                .get(MapAPIs.DCH_GET_STYLE, {
                    uuid: this.uuid,
                    map_uuid: this.mapVM.getMapUUID(),
                })
                .then((payload) => {
                    if (payload) {
                        this.style = payload;
                        this.setSlDStyleAndLegendToLayer();
                        this.refreshLayer();
                    }
                });
        }
    }

    setAdditionalUrlParams(params: string) {
        this.urlParams = params;
    }

    async getExtent(): Promise<number[]> {
        if (!this.extent) {
            this.extent = await this.mapVM
                .getApi()
                .get(MapAPIs.DCH_LAYER_EXTENT, {uuid: this.getLayerId()});
        }
        //@ts-ignore
        return this.extent;
    }

    getGeomType(): string[] {
        //@ts-ignore
        return this.layerInfo.geomType;
    }

    getDataModel(): string {
        //@ts-ignore
        return this.layerInfo.dataModel;
    }

    getCategory(): string {
        //@ts-ignore
        return this.layerInfo.category;
    }

    getLayerTitle(): string {
        return this.layer.get("title");
    }

    getLayerId(): string {
        return this.uuid;
    }

    setLayer() {
    }

    // async getLayerExtent() {
    //     const extent = await this.mapVM.getApi().get(APIs.DCH_LAYER_EXTENT, {uuid: this.getLayerId()});
    //     return extent;
    //
    // }

    setDataSource() {
    }

    getOlLayer() {
        return this.layer;
    }

    refreshLayer() {
        const source = this.layer?.getSource();
        if (source) {
            source.clear();
            source.changed();
            source.refresh();
        }
        // this.layer.getSource().changed();
    }

    getDataSource() {
        if (!this.dataSource) this.setDataSource();

        return this.dataSource;
    }

    clearAllDataSources() {
        let source = this.layer.getSource();
        while (source) {
            source.clear();
            source =
                typeof source.getSource === "function" ? source.getSource() : null;
        }
    }

    vectorStyleFunction(feature: Feature): Style {
        return StylingUtils.vectorStyleFunction(feature, this.style);
    }


    //@ts-ignore
    updateTemporalData(date: Date) {
    }
}

export default AbstractDALayer;
