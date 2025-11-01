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
import {Extent, createEmpty, extend} from 'ol/extent';
import {Geometry} from "ol/geom";

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

    getExtent(): Extent {
        const features = this.getSource().getFeatures();

        // Calculate the extent
        const featureExtent = createEmpty();
        features.forEach((feature: any) => {
            extend(featureExtent, feature?.getGeometry?.().getExtent?.());
        });
        return featureExtent;
    }

    createLayer() {
        // const title = title;
        return new VectorLayer({
            // @ts-ignore
            name: this.layerInfo.uuid,
            title: this.layerInfo.title,
            displayInLayerSwitcher: true,
            source: new VectorSource(), //@ts-ignore
            style: this.vectorStyleFunction,
            zIndex: 1000,
        });

    }

    getFeatures() {
        super.getFeatures();
        return this.getSource()?.getFeatures() || []
    }

    // addGeojsonFeature(geojson: IGeoJSON, clearPreviousFeatures: boolean = true) {
    //     if (clearPreviousFeatures) {
    //         this.clearFeatures();
    //     }
    //     const features = new GeoJSON({
    //         dataProjection: "EPSG:4326",
    //         featureProjection: "EPSG:3857",
    //     }).readFeatures(geojson);
    //     // @ts-ignore
    //     this.getSource().addFeatures(features);
    // }

    addGeojsonFeature(geojson: IGeoJSON, clearPreviousFeatures: boolean = true, dataCRS: string = "EPSG:4326", // proj4def?: string
    ): number {
        if (clearPreviousFeatures) this.clearFeatures();

        // Optional: detect EPSG from payload if present
        const detected = (geojson as any)?.crs?.properties?.name ?? (geojson as any)?.crs?.name;
        const srid = typeof detected === "string" && /^EPSG:\d+$/.test(detected) ? detected : dataCRS;

        // Ensure we know this projection (MapVM can auto-build UTM defs on demand)
        // const ok = this.mapVM.ensureProjection(srid, proj4def);
        // if (!ok) {
        //     this.mapVM.showSnackbar(`Projection ${srid} is not registered.`);
        //     return 0;
        // }

        try {
            const viewProj = "EPSG:3857"; // or this.mapVM.getViewProjectionCode?.() ?? "EPSG:3857"
            const features = new GeoJSON({
                dataProjection: srid, featureProjection: viewProj,
            }).readFeatures(geojson);

            if (!features?.length) {
                this.mapVM.showSnackbar("No features found in GeoJSON.");
                return 0;
            }

            this.getSource().addFeatures(features);
            return features.length;
        } catch (e) {
            this.mapVM.showSnackbar(`Failed to read GeoJSON (${srid} → 3857): ${(e as Error)?.message ?? e}`);
            return 0;
        }
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

    addWKTFeature(wkt: string, clearPreviousFeatures: boolean = true) {
        if (clearPreviousFeatures) {
            this.clearFeatures();
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

    setShowLabel(showLabel: boolean) {
        if (!this.layerInfo) return;
        // Toggle the showLabel flag
        this.layerInfo.showLabel = showLabel;
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

    getTextStyle(): ITextStyle | undefined {
        return this.layerInfo.textStyle || undefined;
    }

    getLabelProperty(): string | undefined {
        return this.layerInfo.labelProperty || undefined;
    }

    getShowLabel(): boolean | undefined {
        return this.layerInfo.showLabel || undefined;
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

        this.layerInfo.showLabel = showLabel != undefined ? showLabel : !this.layerInfo.showLabel;


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

                styled.setText(StylingUtils.getTextStyle(String(label), fillColor, textStyle || {}));
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

    clearFeatures() {
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

    getAttributeList(): string[] {
        const features: Feature<Geometry>[] = this.getFeatures();
        if (!features.length) return [];

        // Extract property names of the first feature
        const names: string[] = Object.keys(features[0].getProperties());

        // Optionally, exclude geometry property if it exists
        return names.filter(n => n !== features[0].getGeometryName());
    }

    getFeatureCount() {
        return this.getSource()?.getFeatures()?.length || 0;
    }

    hasFeature(feature: Feature): boolean {
        const src = this.getSource();
        if (!src) return false;
        return src.getFeatures().includes(feature);
    }

    removeFeature(feature: Feature): void {
        const src = this.getSource();
        if (!src) return;
        src.removeFeature(feature);
    }

    addFeature(Feature: Feature) {
        this.getSource()?.addFeature(Feature);
    }

    addFeatures(features: Feature[]) {
        this.getSource()?.addFeatures(features);
    }

    findFeatureByProperty(propertyName: string, value: any): Feature[] {
        const source = this.getSource();
        if (!source) return [];

        const features = source.getFeatures();
        if (!features.length) return [];

        // Match by property value (strict equality)
        return features.filter((feature) => {
            const propValue = feature.get(propertyName);
            return propValue === value;
        });
    }

    /**
     * identifyFeature(evt)
     * --------------------
     * Returns all features from THIS OverlayVectorLayer that are under the click.
     *
     * Usage:
     * map.on("click", (evt) => {
     *   const matches = overlayLayer.identifyFeature(evt);
     *   // do something with matches
     * });
     */
    identifyFeature(evt: any): Feature[] {
        const map = this.mapVM.getMap();
        const layer = this.getOlLayer();

        if (!map || !layer) return [];

        const hitsSet = new Set<Feature>();

        map.forEachFeatureAtPixel(evt.pixel, (featureLike: any, clickedLayer: any) => {
            if (clickedLayer === layer) {
                hitsSet.add(featureLike as Feature);
            }
        }, {
            layerFilter: (candidateLayer: any) => candidateLayer === layer, hitTolerance: 5,
        });

        return Array.from(hitsSet);
    }


}

export default OverlayVectorLayer;
