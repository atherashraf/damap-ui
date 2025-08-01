import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import MapVM from "@/components/map/models/MapVM";
import {Fill, Stroke, Style} from "ol/style";
import CircleStyle from "ol/style/Circle";
import {IGeoJSON} from "@/types/typeDeclarations";
import GeoJSON from "ol/format/GeoJSON";
import autoBind from "auto-bind";
import {WKT} from "ol/format";
import AbstractOverlayLayer from "./AbstractOverlayLayer";
import {buffer} from "ol/extent";
import StylingUtils from "../../layer_styling/utils/StylingUtils";
import {Geometry} from "ol/geom";

// import {getPointShapes} from "../../components/styling/vector/symbolizer/PointSymbolizer";

class SelectionLayer extends AbstractOverlayLayer {
    //@ts-ignore
    olLayer: VectorLayer<VectorSource>;
    mapVM: MapVM;

    constructor(mapVM: MapVM) {
        super()
        this.mapVM = mapVM;
        autoBind(this);
    }

    createSelectionLayer(title: string = "sel_layer") {
        // const title = "sel_layer";
        this.olLayer = new VectorLayer({
            // @ts-ignore
            title: title,
            name: title,
            displayInLayerSwitcher: false,
            source: new VectorSource(),
            style: this.getSelectStyle,
            zIndex: 1000,
        });

        this.mapVM.addOverlayLayer(this);
    }

    clearSelection() {
        this.getSource()?.clear();
    }

    getOlLayer(): VectorLayer<VectorSource> {
        if (!this.olLayer) {
            this.createSelectionLayer();
        }
        return this.olLayer;
    }

    getSource(): VectorSource | undefined {
        return this?.getOlLayer()?.getSource() || undefined;
    }

    addGeoJson2Selection(
        geojson: IGeoJSON,
        clearPreviousSelection: boolean = true
    ) {
        if (clearPreviousSelection) {
            this.clearSelection();
        }
        const features = new GeoJSON({
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
        }).readFeatures(geojson);
        // @ts-ignore
        this.getSource()?.addFeatures(features);
    }

    addWKT2Selection(wkt: string, clearPreviousSelection: boolean = true) {
        if (clearPreviousSelection) {
            this.clearSelection();
        }

        let srid = "EPSG:3857"; // default
        let cleanWkt = wkt;

        // Clean SRID if present (e.g. "SRID=4326;POLYGON(...)")
        const sridMatch = wkt.match(/^SRID=(\d+);(.*)$/i);
        if (sridMatch) {
            const epsgCode = sridMatch[1];
            srid = `EPSG:${epsgCode}`;
            cleanWkt = sridMatch[2];
        }

        try {
            const features = new WKT().readFeatures(cleanWkt, {
                dataProjection: srid,
                featureProjection: "EPSG:3857",
            });

            this.getSource()?.addFeatures(features);
        } catch (err) {
            console.error("Failed to parse WKT:", err);
            this.mapVM.showSnackbar("Failed to parse WKT geometry", "error");
        }
    }


    addFeature(Feature: Feature, clearPreviousSelection: boolean = true) {
        if (clearPreviousSelection) {
            this.clearSelection();
        }
        this.getSource()?.addFeature(Feature);
    }

    addFeatures(features: Feature[], clearPreviousSelection: boolean = true) {
        if (clearPreviousSelection) {
            this.clearSelection();
        }
        this.getSource()?.addFeatures(features);
    }

    getSelectStyle(feature: any) {
        let g_type = feature.getGeometry().getType();
        let selStyle;
        if (!g_type) g_type = feature.f;
        if (g_type.indexOf("Point") !== -1) {

            selStyle = new Style({
                image: new CircleStyle({
                    radius: 7,
                    displacement: [0, 0],
                    fill: new Fill({color: "#ffff00"}),
                    stroke: new Stroke({
                        color: "#481414",
                        width: 1.5,
                    }),
                }),
            });
            StylingUtils.flash(feature, this.mapVM)
        } else if (g_type.indexOf("LineString") !== -1) {
            selStyle = new Style({
                stroke: new Stroke({
                    color: "#d17114",
                    width: 5,
                }),
            });
        } else {
            selStyle = new Style({
                fill: new Fill({
                    color: "rgba(209, 113, 20, 0)",
                }),
                stroke: new Stroke({
                    color: "#d17114",
                    width: 3,
                }),
            });
        }
        return selStyle;
    }

    getFeatures() {
        super.getFeatures();
        return this.getSource()?.getFeatures();
    }

    zoomToSelection() {
        //@ts-ignore
        if (this.getSource()?.getFeatures()?.length > 0) {
            let extent = this.getSource()?.getExtent();
            if (extent) {
                this.mapVM.zoomToExtent(extent);
            }
        } else {
            this.mapVM.showSnackbar("Please select feature before zoom to");
        }
    }

    zoomToFeature(feature: Feature<Geometry>) {
        const geom = feature.getGeometry();
        if (geom) {
            const extent = geom.getExtent();
            console.log("zooming to extent", extent)
            if (extent.every((v) => Number.isFinite(v))) {
                this.mapVM.getMap().getView().fit(extent, {
                    padding: [50, 50, 50, 50], // top, right, bottom, left
                    duration: 500, // optional animation
                    maxZoom: 18 // optional zoom limit
                });
            } else {
                this.mapVM.showSnackbar("Invalid extent from feature", "warning");
            }
        }
    }

    zoomToFeatures() {
        const features = this.getSource()?.getFeatures() || [];

        const validExtents = features
            .map(f => f.getGeometry()?.getExtent())
            .filter((ext): ext is [number, number, number, number] =>
                !!ext && ext.every((v) => Number.isFinite(v))
            );

        if (validExtents.length > 0) {
            const [minX, minY, maxX, maxY] = validExtents.reduce((acc, curr) => [
                Math.min(acc[0], curr[0]),
                Math.min(acc[1], curr[1]),
                Math.max(acc[2], curr[2]),
                Math.max(acc[3], curr[3]),
            ]);
            const bufferedExtent = buffer([minX, minY, maxX, maxY], 20000);
            this.mapVM.zoomToExtent(bufferedExtent);
        } else {
            this.mapVM.showSnackbar("No valid features to zoom to", "warning");
        }
    }

}

export default SelectionLayer;
