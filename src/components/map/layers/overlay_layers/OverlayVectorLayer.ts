import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import MapVM from "@/components/map/models/MapVM";
import autoBind from "auto-bind";
import {Style} from "ol/style";

import {Feature} from "ol";

import GeoJSON from "ol/format/GeoJSON";
import {WKT} from "ol/format";
import AbstractOverlayLayer from "./AbstractOverlayLayer";
import {IFeatureStyle, IGeoJSON, ITextStyle} from "@/types/typeDeclarations";
import StylingUtils from "../../layer_styling/utils/StylingUtils";

// import _ from "../../utils/lodash";

export interface IOverLayVectorInfo {
    uuid: string  // use mapVM.generateUUID()
    title: string
    style: IFeatureStyle
    dataModel?: "V" | "R"
    geomType?: "Polygon" | "LineString" | "Point"

    // ✅ Labeling-related options
    showLabel?: boolean;              // Whether to show label or not
    labelProperty?: string;          // Feature property to label by (e.g., "unique_id", "name")
    textStyle?: ITextStyle;          // Style config for the label text
}

class OverlayVectorLayer extends AbstractOverlayLayer {
    olLayer: VectorLayer<VectorSource>;
    mapVM: MapVM;
    layerInfo: IOverLayVectorInfo

    //@ts-ignore
    constructor(info: IOverLayVectorInfo, mapVM: MapVM) {
        super()
        this.mapVM = mapVM;
        this.layerInfo = info
        this.layerInfo["dataModel"] = "V"
        this.layerInfo.showLabel = info.showLabel !== undefined ? info.showLabel : false;
        autoBind(this);
        this.olLayer = this.createLayer();
        this.mapVM.addOverlayLayer(this);
        const gtype = this.getGeometryType()
        // console.log("geom type", gtype)
        StylingUtils.addLegendGraphic(this.olLayer, this.layerInfo.style, gtype)
    }

    getLayerUUID(): string {
        return this.layerInfo.uuid;
    }


    getLayerTitle(): string {
        return this.olLayer?.get("title");
    }

    createLayer() {
        // const title = title;
        return new VectorLayer({
            // @ts-ignore
            name: this.layerInfo.uuid,
            title: this.layerInfo.title,
            displayInLayerSwitcher: true,
            source: new VectorSource(),
            //@ts-ignore
            style: this.vectorStyleFunction,
            zIndex: 1000,
        });

    }

    getFeatures() {
        super.getFeatures();
        return this.getSource()?.getFeatures() || []
    }

    addGeojsonFeature(geojson: IGeoJSON, clearPreviousSelection: boolean = true) {
        if (clearPreviousSelection) {
            this.clearSelection();
        }
        const features = new GeoJSON({
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
        }).readFeatures(geojson);
        // @ts-ignore
        this.getSource().addFeatures(features);
    }

    getGeometryType(): string {
        if (this.layerInfo.geomType) {
            return this.layerInfo.geomType
        } else {
            const features = this.getFeatures()
            // @ts-ignore
            return features.length > 0 ? features[0]?.getGeometry()?.getType().toString() : "Polygon";
        }
    }

    addWKTFeature(wkt: string, clearPreviousSelection: boolean = true) {
        if (clearPreviousSelection) {
            this.clearSelection();
        }
        const features = new WKT().readFeatures(wkt);
        this.getSource().addFeatures(features);
    }

    toggleShowLabel() {
        if (!this.layerInfo) return;
        // Toggle the showLabel flag
        this.layerInfo.showLabel = !this.layerInfo.showLabel;
        // Force re-render so the vectorStyleFunction gets called again
        this.forcedRefresh();
    }

    setLabelProperty(labelProperty: string) {
        this.layerInfo.labelProperty = labelProperty || "";
        // this.forcedRefresh()
    }

    setTextStyle(textStyle: ITextStyle) {
        this.layerInfo.textStyle = textStyle;
        // this.forcedRefresh()
    }

    updateLabelOptions(labelProperty: string, textStyle?: ITextStyle, showLabel?: boolean) {
        if (!this.layerInfo) return;

        // Always set the label property
        this.layerInfo.labelProperty = labelProperty || "";

        // Conditionally update text style
        if (textStyle) {
            this.layerInfo.textStyle = textStyle;
        }

        // Optionally toggle showLabel

        this.layerInfo.showLabel = showLabel!=undefined? showLabel:  !this.layerInfo.showLabel;


        // Force style re-evaluation
        this.forcedRefresh();
    }


    forcedRefresh() {
        // Trigger the style function again for each feature
        const source = this.getSource();
        source.getFeatures().forEach((f) => f.changed());
    }

    vectorStyleFunction(feature: Feature): Style {
        const baseStyle = StylingUtils.vectorStyleFunction(feature, this.layerInfo.style);
        const styled = baseStyle.clone();

        const {showLabel, labelProperty, textStyle} = this.layerInfo;

        if (showLabel && labelProperty) {
            const label = feature.get(labelProperty);
            if (label !== undefined && label !== null) {
                const fillColor = baseStyle.getFill()?.getColor()?.toString() ?? '#000'; // or any sensible default

                styled.setText(
                    StylingUtils.getTextStyle(
                        String(label), fillColor, textStyle || {}
                    )
                );
            }
        }

        return styled;
    }


    zoomToFeatures() {
        if (this.getSource().getFeatures().length > 0) {
            const extent = this.getSource().getExtent();
            this.mapVM.zoomToExtent(extent);
        } else {
            this.mapVM.showSnackbar("Please select feature before zoom to");
        }
    }

    clearSelection() {
        this.getSource().clear();
    }

    getSource(): VectorSource {
        //@ts-ignore
        return this.getOlLayer().getSource();
    }

    getOlLayer(): VectorLayer<VectorSource> {
        return this.olLayer;
    }

    getFeaturesById() {
        super.getFeaturesById();
    }

    toGeoJson() {
        const geojsonFormat = new GeoJSON();
        const features = this.getFeatures()
        return geojsonFormat.writeFeaturesObject(features, {
            featureProjection: 'EPSG:3857', // Change the projection to match your needs
        });
    }

    // openAttributeTable(){
    //     const features = this.getFeatures()
    //     const columns: Column[] = []
    //     const rows: Row[] = []
    //     features?.forEach((feature: Feature, index) => {
    //         const id = feature.getId()
    //         const properties = feature.getProperties()
    //         if (index === 0) {
    //             Object.keys(properties).forEach((key) => {
    //                 columns.push({
    //                     disablePadding: false,
    //                     id: key,
    //                     label: key,
    //                     type: _.checkPremitivesType(properties[key])
    //                 })
    //             })
    //         }
    //         // rows.push(_.cloneObjectWithoutKeys(properties, ["geometry"]))
    //         //@ts-ignore
    //         rows.push({...properties, rowId: parseFloat(id)})
    //     })
    //     this.createAttributeTable(columns, rows, ['id'], tableHeight, daGridRef);
    // }
}

export default OverlayVectorLayer;
