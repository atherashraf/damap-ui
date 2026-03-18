/**
 * OverlayVectorLayer (Vector Overlay)
 * ==================================
 * A reusable OpenLayers Vector overlay wrapper for DAMap.
 *
 * Features:
 * - Add GeoJSON / WKT features.
 * - Apply styles (single / multiple / density) using IFeatureStyle.
 * - Update style after layer creation (setStyle / updateStyle).
 * - Optional labels with TextStyle + zoom window control (minLabelZoom / maxLabelZoom).
 * - Identify features on click (identifyFeature).
 * - Extent utilities (getExtent / zoomToFeatures).
 *
 * -----------------------------------------------------------------------------
 * QUICK USAGE (React) - Same pattern as your MapOverlayer example
 * -----------------------------------------------------------------------------
 *
 * @example
 * import { useEffect, RefObject } from "react";
 * import { getMapVM, MapVM, MapView, useMapVM, ContextMenuHandle, IFeatureStyle } from "@/damap";
 * import OverlayVectorLayer from "@/components/map/layers/overlay_layers/OverlayVectorLayer";
 * import { ITextStyle } from "@/types/typeDeclarations";
 *
 * const MyOverlayExample = () => {
 *   const mapVM = useMapVM();
 *   const pakLayerUUID = MapVM.generateUUID();
 *   const provinceLayerUUID = MapVM.generateUUID();
 *
 *   // 1) Add boundary GeoJSON, then update style later (dashed green stroke)
 *   useEffect(() => {
 *     fetch("/media/pak_boundary.geojson")
 *       .then((res) => res.json())
 *       .then((json) => {
 *         const vm = getMapVM();
 *
 *         // Create overlay layer (internally creates OverlayVectorLayer)
 *         vm.createOverlayLayer(pakLayerUUID, json, "pak_boundary");
 *
 *         const overlay = vm.getOverlayLayer(pakLayerUUID) as OverlayVectorLayer;
 *
 *         const dashedGreen: IFeatureStyle = {
 *           type: "single",
 *           style: {
 *             default: {
 *               strokeColor: "#00AA00",
 *               strokeWidth: 4,
 *               lineDash: [6, 10],                 // requires lineDash support in IGeomStyle + StylingUtils
 *               fillColor: "rgba(0,0,0,0)"
 *             }
 *           }
 *         };
 *
 *         // Update style AFTER features were added
 *         setTimeout(() => overlay.setStyle(dashedGreen, true), 2000);
 *
 *         vm.zoomToAllLayersExtent();
 *       });
 *   }, []);
 *
 *   // 2) Categorized styling by a property (adm1_en) using "multiple" rules
 *   useEffect(() => {
 *     fetch("/media/pak_provinces.geojson")
 *       .then((res) => res.json())
 *       .then((json) => {
 *         const vm = getMapVM();
 *         vm.createOverlayLayer(provinceLayerUUID, json, "province");
 *
 *         const overlay = vm.getOverlayLayer(provinceLayerUUID) as OverlayVectorLayer;
 *
 *         const provinceStyle: IFeatureStyle = {
 *           type: "multiple",
 *           style: {
 *             default: { strokeColor: "#666", strokeWidth: 1, fillColor: "rgba(200,200,200,0.2)" },
 *             rules: [
 *               { title: "Punjab", filter: { field: "adm1_en", op: "==", value: "Punjab" }, style: { strokeColor: "#2ecc71", strokeWidth: 2, fillColor: "rgba(46,204,113,0.3)" } },
 *               { title: "Sindh", filter: { field: "adm1_en", op: "==", value: "Sindh" }, style: { strokeColor: "#3498db", strokeWidth: 2, fillColor: "rgba(52,152,219,0.3)" } },
 *               { title: "Balochistan", filter: { field: "adm1_en", op: "==", value: "Balochistan" }, style: { strokeColor: "#e67e22", strokeWidth: 2, fillColor: "rgba(230,126,34,0.3)" } },
 *               { title: "Khyber Pakhtunkhwa", filter: { field: "adm1_en", op: "==", value: "Khyber Pakhtunkhwa" }, style: { strokeColor: "#9b59b6", strokeWidth: 2, fillColor: "rgba(155,89,182,0.3)" } },
 *               { title: "Gilgit Baltistan", filter: { field: "adm1_en", op: "==", value: "Gilgit Baltistan" }, style: { strokeColor: "#e74c3c", strokeWidth: 2, fillColor: "rgba(231,76,60,0.3)" } },
 *               { title: "Azad Kashmir", filter: { field: "adm1_en", op: "==", value: "Azad Kashmir" }, style: { strokeColor: "#16a085", strokeWidth: 2, fillColor: "rgba(22,160,133,0.3)" } },
 *               { title: "Islamabad", filter: { field: "adm1_en", op: "==", value: "Islamabad" }, style: { strokeColor: "#f1c40f", strokeWidth: 2, fillColor: "rgba(241,196,15,0.3)" } }
 *             ]
 *           }
 *         };
 *
 *         overlay.setStyle(provinceStyle, true);
 *         vm.zoomToAllLayersExtent();
 *       });
 *   }, []);
 *
 *   // 3) Label controls (toggle labels, set label property + style, optional zoom window)
 *   // Examples:
 *   //   overlay.updateLabelOptions("name", { font: "bold 12px Arial" }, true, 17);
 *   //   overlay.updateLabelOptions("name", { font: "bold 12px Arial" }, true, 14, 18);
 *
 *   // 4) Context menu example: toggle labels from right-click menu
 *   useEffect(() => {
 *     const vm = getMapVM();
 *     const contextMenuRef: RefObject<ContextMenuHandle | null> = vm.getContextMenuRef();
 *     if (!contextMenuRef?.current) return;
 *
 *     contextMenuRef.current.addMenuItem({
 *       id: "toggle_label",
 *       name: "Toggle Label",
 *       onClick: () => {
 *         const layer = contextMenuRef.current?.getCurrentLayer?.();
 *         if (!layer) return;
 *
 *         const uuid = layer.get("name");
 *         const overlay = vm.getOverlayLayer(uuid) as OverlayVectorLayer;
 *
 *         const textStyle: ITextStyle = {
 *           font: "20px Calibri, sans-serif",
 *           fillColor: "#ff0000",
 *           strokeColor: "#000000",
 *           strokeWidth: 1,
 *           offsetX: 10,
 *           offsetY: 10,
 *           placement: "point",
 *         };
 *
 *         // Toggle label (if showLabel is undefined, updateLabelOptions toggles it)
 *         overlay.updateLabelOptions("property_type", textStyle);
 *       },
 *     });
 *   }, []);
 *
 *   return null;
 * };
 *
 * -----------------------------------------------------------------------------
 * Notes
 * -----------------------------------------------------------------------------
 * - Dashed lines require:
 *   1) adding `lineDash?: number[]` (and optional `lineDashOffset?: number`) to IGeomStyle
 *   2) passing them to `new Stroke({ lineDash, lineDashOffset })` inside StylingUtils.createOLStyle()
 */

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

    setStyle(style: IFeatureStyle, refreshLegend: boolean = true) {
        if (!this.layerInfo) return;

        this.layerInfo.style = style;

        // Re-attach style function (not strictly required if it already points to this.vectorStyleFunction,
        // but safe if you ever swapped styles elsewhere)
        // @ts-ignore
        this.olLayer.setStyle(this.vectorStyleFunction);

        // Force redraw
        this.forcedRefresh();

        // Optional: update legend graphic
        if (refreshLegend) {
            const gtype = this.getGeometryType();
            StylingUtils.addLegendGraphic(this.olLayer, this.layerInfo.style, gtype);
        }
    }

    /**
     * Merge/patch style (handy if you only want to tweak a few props)
     */
    updateStyle(partial: Partial<IFeatureStyle>, refreshLegend: boolean = true) {
        const current = this.layerInfo?.style ?? ({} as IFeatureStyle);
        this.setStyle({ ...current, ...partial } as IFeatureStyle, refreshLegend);
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
