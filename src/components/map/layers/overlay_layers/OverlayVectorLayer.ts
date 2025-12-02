/***
 * Label zoom control examples:
 *
 * // 1) Labels from zoom 17 upwards (no upper limit)
 * overlay.updateLabelOptions("name", { font: "bold 12px Arial" }, true, 17);
 *
 * // 2) Labels only between zoom 14 and 18
 * overlay.updateLabelOptions("name", { font: "bold 12px Arial" }, true, 14, 18);
 *
 ***/

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import MapVM from "@/components/map/models/MapVM";
import autoBind from "auto-bind";
import { Style } from "ol/style";

import { Feature } from "ol";

import GeoJSON from "ol/format/GeoJSON";
import { WKT } from "ol/format";
import AbstractOverlayLayer from "./AbstractOverlayLayer";
import { IFeatureStyle, IGeoJSON, ITextStyle } from "@/types/typeDeclarations";
import StylingUtils from "../../layer_styling/utils/StylingUtils";
import { Extent, createEmpty, extend } from "ol/extent";
import { Geometry } from "ol/geom";

// import _ from "../../utils/lodash";

export interface IOverLayVectorInfo {
    uuid: string;
    title: string;
    style: IFeatureStyle;
    dataModel?: "V" | "R";
    geomType?: "Polygon" | "LineString" | "Point";

    showLabel?: boolean;
    labelProperty?: string;
    textStyle?: ITextStyle;

    // Label zoom window
    minLabelZoom?: number;   // labels start appearing from this zoom (inclusive)
    maxLabelZoom?: number;   // labels stop appearing after this zoom (inclusive)
}

class OverlayVectorLayer extends AbstractOverlayLayer {
    olLayer: VectorLayer<VectorSource>;
    mapVM: MapVM;
    layerInfo: IOverLayVectorInfo;

    //@ts-ignore
    constructor(info: IOverLayVectorInfo, mapVM: MapVM) {
        super();
        this.mapVM = mapVM;
        this.layerInfo = info;
        this.layerInfo["dataModel"] = "V";
        this.layerInfo.showLabel = info.showLabel !== undefined ? info.showLabel : false;

        autoBind(this);

        this.olLayer = this.createLayer();
        this.mapVM.addOverlayLayer(this);

        const gtype = this.getGeometryType();
        StylingUtils.addLegendGraphic(this.olLayer, this.layerInfo.style, gtype);
    }

    getLayerUUID(): string {
        return this.layerInfo.uuid;
    }

    getLayerTitle(): string {
        return this.olLayer?.get("title");
    }

    getExtent(): Extent {
        const features = this.getSource().getFeatures();

        const featureExtent = createEmpty();
        features.forEach((feature: any) => {
            extend(featureExtent, feature?.getGeometry?.().getExtent?.());
        });
        return featureExtent;
    }

    createLayer() {
        return new VectorLayer({
            // @ts-ignore
            name: this.layerInfo.uuid,
            title: this.layerInfo.title,
            displayInLayerSwitcher: true,
            source: new VectorSource(),
            // @ts-ignore
            style: this.vectorStyleFunction,
            zIndex: 1000,
            declutter: true, // reduce overlapping labels
        });
    }

    getFeatures() {
        super.getFeatures();
        return this.getSource()?.getFeatures() || [];
    }

    addGeojsonFeature(
        geojson: IGeoJSON,
        dataCRS: string = "EPSG:4326",
        clearPreviousFeatures: boolean = false
    ): number {
        if (clearPreviousFeatures) this.clearFeatures();

        // Optional: detect EPSG from payload if present
        const detected =
            (geojson as any)?.crs?.properties?.name ?? (geojson as any)?.crs?.name;
        const srid =
            typeof detected === "string" && /^EPSG:\d+$/.test(detected)
                ? detected
                : dataCRS;

        try {
            const viewProj = this.mapVM.getViewProjectionCode?.() ?? "EPSG:3857";
            const features = new GeoJSON({
                dataProjection: srid,
                featureProjection: viewProj,
            }).readFeatures(geojson);

            if (!features?.length) {
                this.mapVM.showSnackbar("No features found in GeoJSON.");
                return 0;
            }

            this.getSource().addFeatures(features);
            return features.length;
        } catch (e) {
            this.mapVM.showSnackbar(
                `Failed to read GeoJSON (${srid} → 3857): ${
                    (e as Error)?.message ?? e
                }`
            );
            return 0;
        }
    }

    getGeometryType(): string {
        if (this.layerInfo.geomType) {
            return this.layerInfo.geomType;
        } else {
            const features = this.getFeatures();
            // @ts-ignore
            return features.length > 0
                ? features[0]?.getGeometry()?.getType().toString()
                : "Polygon";
        }
    }

    addWKTFeature(
        wkt: string,
        dataProjectionOverride?: string,
        clearPreviousFeatures: boolean = false
    ) {
        const source = this.getSource();
        if (clearPreviousFeatures) {
            source.clear(true);
        }

        // Get the current view projection (e.g. "EPSG:3857")
        const featureProjection =
            this.mapVM?.getMap()?.getView()?.getProjection()?.getCode() ??
            "EPSG:3857";

        // Try to extract SRID from WKT like: "SRID=4326;POINT(...)"
        const sridMatch = wkt.match(/SRID\s*=\s*(\d+)\s*;/i);
        const sridFromWkt = sridMatch ? `EPSG:${sridMatch[1]}` : undefined;

        // If SRID prefix exists, remove it before parsing
        const wktBody = sridFromWkt
            ? wkt.replace(/^\s*SRID\s*=\s*\d+\s*;\s*/i, "")
            : wkt;

        const dataProjection = dataProjectionOverride ?? sridFromWkt ?? "EPSG:4326";

        const wktFormat = new WKT();
        const features = wktFormat.readFeatures(wktBody, {
            dataProjection,
            featureProjection,
        });

        source.addFeatures(features);
        return features;
    }

    toggleShowLabel() {
        if (!this.layerInfo) return;
        this.layerInfo.showLabel = !this.layerInfo.showLabel;
        this.forcedRefresh();
    }

    setShowLabel(showLabel: boolean) {
        if (!this.layerInfo) return;
        this.layerInfo.showLabel = showLabel;
        this.forcedRefresh();
    }

    setLabelProperty(labelProperty: string) {
        this.layerInfo.labelProperty = labelProperty || "";
    }

    setTextStyle(textStyle: ITextStyle) {
        this.layerInfo.textStyle = textStyle;
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

    updateLabelOptions(
        labelProperty: string,
        textStyle?: ITextStyle,
        showLabel?: boolean,
        minLabelZoom?: number,
        maxLabelZoom?: number
    ) {
        if (!this.layerInfo) return;

        // Always set the label property
        this.layerInfo.labelProperty = labelProperty || "";

        // Conditionally update text style
        if (textStyle) {
            this.layerInfo.textStyle = textStyle;
        }

        // Show / hide flag
        if (showLabel !== undefined) {
            this.layerInfo.showLabel = showLabel;
        } else {
            this.layerInfo.showLabel = !this.layerInfo.showLabel;
        }

        // Zoom window for labels
        if (minLabelZoom !== undefined) {
            this.layerInfo.minLabelZoom = minLabelZoom;
        }
        if (maxLabelZoom !== undefined) {
            this.layerInfo.maxLabelZoom = maxLabelZoom;
        }

        // Force style re-evaluation
        this.forcedRefresh();
    }

    forcedRefresh() {
        const source = this.getSource();
        source.getFeatures().forEach((f) => f.changed());
    }

    vectorStyleFunction(feature: Feature, resolution: number): Style {
        const baseStyle = StylingUtils.vectorStyleFunction(
            feature,
            this.layerInfo.style
        );
        const styled = baseStyle.clone();

        const {
            showLabel,
            labelProperty,
            textStyle,
            minLabelZoom,
            maxLabelZoom,
        } = this.layerInfo;

        // Labels globally off or no field → no text
        if (!showLabel || !labelProperty) {
            // @ts-ignore
            styled.setText(null);
            return styled;
        }

        // Get current zoom from map/view
        const map = this.mapVM.getMap();
        const view = map?.getView();

        let zoom: number | undefined;
        if (view) {
            if ((view as any).getZoomForResolution) {
                const z = (view as any).getZoomForResolution(resolution);
                zoom = z ?? view.getZoom();
            } else {
                zoom = view.getZoom();
            }
        }

        // If zoom is known, enforce min/max window
        if (zoom !== undefined) {
            const minZ = minLabelZoom ?? -Infinity; // no lower limit if not set
            const maxZ = maxLabelZoom ?? +Infinity; // no upper limit if not set

            // Hide labels if outside [minZ, maxZ]
            if (zoom < minZ || zoom > maxZ) {
                // @ts-ignore
                styled.setText(null);
                return styled;
            }
        }

        // OK to draw label here
        const label = feature.get(labelProperty);
        if (label !== undefined && label !== null) {
            const fillColor =
                baseStyle.getFill()?.getColor()?.toString() ?? "#000";
            styled.setText(
                StylingUtils.getTextStyle(String(label), fillColor, textStyle || {})
            );
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
        // @ts-ignore
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
        const features = this.getFeatures();
        return geojsonFormat.writeFeaturesObject(features, {
            featureProjection: "EPSG:3857",
        });
    }

    getAttributeList(): string[] {
        const features: Feature<Geometry>[] = this.getFeatures();
        if (!features.length) return [];

        const names: string[] = Object.keys(features[0].getProperties());
        return names.filter((n) => n !== features[0].getGeometryName());
    }

    getFeatureCount() {
        return this.getSource()?.getFeatures()?.length || 0;
    }

    hasFeature(feature: Feature): boolean {
        const src = this.getSource();
        if (!src) return false;
        return src.getFeatures().includes(feature);
    }

    removeFeature(feature: Feature): boolean {
        const src = this.getSource();
        if (!src) return false;

        const alreadyInside = src.hasFeature(feature);

        if (alreadyInside) {
            src.removeFeature(feature);
            return true;
        }

        return false;
    }

    addFeature(feature: Feature) {
        this.getSource()?.addFeature(feature);
    }

    addFeatures(features: Feature[]) {
        this.getSource()?.addFeatures(features);
    }

    findFeatureByProperty(propertyName: string, value: any): Feature[] {
        const source = this.getSource();
        if (!source) return [];

        const features = source.getFeatures();
        if (!features.length) return [];

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

        map.forEachFeatureAtPixel(
            evt.pixel,
            (featureLike: any, clickedLayer: any) => {
                if (clickedLayer === layer) {
                    hitsSet.add(featureLike as Feature);
                }
            },
            {
                layerFilter: (candidateLayer: any) => candidateLayer === layer,
                hitTolerance: 5,
            }
        );

        return Array.from(hitsSet);
    }
}

export default OverlayVectorLayer;
