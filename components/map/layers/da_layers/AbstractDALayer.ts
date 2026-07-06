import MapVM from "../../models/MapVM";
import VectorLayer from "ol/layer/Vector";
import {Style} from "ol/style";
import autoBind from "auto-bind";
import {MapAPIs} from "@damap/api/MapApi";
import {Feature} from "ol";
import VectorTileLayer from "ol/layer/VectorTile";

import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import SLDStyleParser from "@damap/components/map/layer_styling/utils/SLDStyleParser";
import StylingUtils from "../../layer_styling/utils/StylingUtils";
import {IFeatureStyle, ILayerInfo} from "@damap/types/typeDeclarations";

abstract class AbstractDALayer {
    dataSource: any;
    layer?: VectorLayer<any> | VectorTileLayer | TileLayer<any> | ImageLayer<any>;
    layerInfo: ILayerInfo;
    style: IFeatureStyle;
    mapVM: MapVM;
    uuid: string;
    extent?: number[] | null;
    //@ts-ignore
    features: any[];
    urlParams: string = "";
    resolutions: number[] = [];
    tileSize: number = 512

    constructor(info: ILayerInfo, mapVM: MapVM) {
        autoBind(this);
        info.declutter ??= true;

        this.layerInfo = info;
        this.mapVM = mapVM;
        this.uuid = info && "uuid" in info ? info["uuid"] : "";
        this.style = info && "style" in info ? info["style"] : undefined as any;

        this.setLayer();

        if (this.layer) {
            this.addLayerChangeEvent();
        }
    }

    getZIndex() {
        return this.layerInfo.zIndex;
    }

    // addLayerChangeEvent() {
    //     this.layer.on("propertychange", (e) => {
    //         if (e.key === "map" && e.target.values_[e.key] == null) {
    //             this.mapVM.removeDALayer(this.layerInfo.uuid);
    //         }
    //         if (e.key === "map" && e.oldValue == null) {
    //             this.mapVM.daLayers[this.layerInfo.uuid] = this;
    //         }
    //     });
    // }

    addLayerChangeEvent() {
        this.layer?.on("propertychange", (e: any) => {
            if (e.key !== "map") return;

            const isRemovedFromMap = e.target?.get?.("map") == null;
            if (isRemovedFromMap) {
                this.mapVM.removeDALayer(this.layerInfo.uuid);
            }
        });
    }

    setSlDStyleAndLegendToLayer() {
        const type = this.style?.type || "";
        const lyr = this.layer;

        if (!lyr) return;

        let legendCreated = false;

        if (type === "sld") {
            const sldObj = new SLDStyleParser(this);
            //@ts-ignore
            sldObj.convertSLDTextToOL(this.style["style"], lyr);

            const legend = lyr.get?.("legend") || (lyr as any)?.legend;
            legendCreated = !!legend;
        } else {
            if (!(lyr instanceof TileLayer || lyr instanceof ImageLayer)) {
                //@ts-ignore
                lyr.setStyle(this.vectorStyleFunction.bind(this));

                const resolvedGeomType = this.resolveGeomType();

                if (resolvedGeomType) {
                    StylingUtils.addLegendGraphic(lyr, this.style, resolvedGeomType);

                    const legend = lyr.get?.("legend") || (lyr as any)?.legend;
                    legendCreated = !!legend;
                } else {
                    console.warn("Legend skipped: missing geomType", {
                        title: lyr?.get?.("title"),
                        styleType: this.style?.type,
                        geomType: this.layerInfo?.geomType,
                        resolvedGeomType,
                        layerClass: lyr?.constructor?.name,
                    });
                }

                this.mapVM.getLegendPanel()?.refresh();
            }
        }

        lyr.set("style_added", true);
        lyr.set("legend_ready", legendCreated);
        lyr.set("da_ready", true);
    }

    resolveGeomType(): string | undefined {
        const raw = this.layerInfo?.geomType?.[0];

        // 1. Prefer explicit geomType from layerInfo
        if (raw  && raw.trim().length > 0) {
            switch (raw.trim()) {
                case "Point":
                case "MultiPoint":
                    return raw.trim();

                case "Polyline":
                case "Line":
                case "LineString":
                    return "LineString";

                case "MultiPolyline":
                case "MultiLine":
                case "MultiLineString":
                    return "MultiLineString";

                case "Polygon":
                    return "Polygon";

                case "MultiPolygon":
                    return "MultiPolygon";

                default:
                    return raw.trim();
            }
        }

        // 2. Fallback by title when geomType is missing
        const title = (this.layerInfo?.title || this.layer?.get?.("title") || "")
            .toString()
            .toLowerCase();

        if (!title) return undefined;

        // Point-like layers
        if (
            title.includes("manhole") ||
            title.includes("valve") ||
            title.includes("hydrant") ||
            title.includes("meter") ||
            title.includes("pole") ||
            title.includes("point") ||
            title.includes("well") ||
            title.includes("chamber")
        ) {
            return "Point";
        }

        // Line-like layers
        if (
            title.includes("line") ||
            title.includes("pipe") ||
            title.includes("sewer") ||
            title.includes("drain") ||
            title.includes("network") ||
            title.includes("road") ||
            title.includes("channel") ||
            title.includes("stream")
        ) {
            return "LineString";
        }

        // Polygon-like layers
        if (
            title.includes("subdivision") ||
            title.includes("parcel") ||
            title.includes("boundary") ||
            title.includes("block") ||
            title.includes("area") ||
            title.includes("zone") ||
            title.includes("sector") ||
            title.includes("plot") ||
            title.includes("polygon")
        ) {
            return "Polygon";
        }

        return undefined;
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
            this.extent  = await this.mapVM
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
        return this.layer?.get("title");
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
        let source = this.layer?.getSource();
        while (source) {
            source.clear();
            source =
                typeof source.getSource === "function" ? source.getSource() : null;
        }
    }


    vectorStyleFunction(feature: Feature, _resolution?: number): Style {
        const geomType = StylingUtils.normalizeGeomType(
            feature.getGeometry()?.getType() || ""
        );

        return StylingUtils.vectorStyleFunction(feature, this.style) ||
            StylingUtils.getDefaultStyle(geomType);

    }


    updateTemporalData(date: Date) {
        console.log("date",date)
    }
}

export default AbstractDALayer;
