import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Draw} from 'ol/interaction';
import {Style, Stroke, Fill, Circle as CircleStyle} from 'ol/style';
import {Map} from 'ol';
import {buffer} from 'ol/extent';
import {WKT} from 'ol/format';

type InteractionMode = 'highlight' | 'selected';

export default class InteractionLayer {
    olLayer: VectorLayer<any>;
    private source: VectorSource;
    private map: Map;
    private currentDrawInteraction: Draw | null = null;

    constructor(map: Map) {
        this.map = map;
        this.source = new VectorSource();

        this.olLayer = new VectorLayer({
            source: this.source,
            style: (feature) => this.getStyleForFeature(feature as Feature<Geometry>),
            properties: {title: 'Interaction Layer'},
        });

        this.map.addLayer(this.olLayer);
    }

    // ========== Highlight Logic ==========

    highlight(feature: Feature<Geometry>) {
        this.clearHighlight(); // only one highlight allowed
        feature.set('interaction_mode', 'highlight');
        this.source.addFeature(feature);
    }

    clearHighlight() {
        const features = this.source.getFeatures();
        features
            .filter((f) => f.get('interaction_mode') === 'highlight')
            .forEach((f) => this.source.removeFeature(f));
    }


    // ========== Selection Logic ==========

    selectFeatureById(id: any) {
        const feature = this.source.getFeatures().find((f) => f.getId() === id);
        if (feature) {
            feature.set('interaction_mode', 'selected');
        }
    }

    addSelectedFeature(feature: Feature<Geometry>) {
        feature.set('interaction_mode', 'selected');
        this.source.addFeature(feature);
    }

    selectFeatures(features: Feature<Geometry>[]) {
        features.forEach((f) => {
            f.set('interaction_mode', 'selected');
            this.source.addFeature(f);
        });
    }

    clearSelections() {
        this.source.getFeatures()
            .filter((f) => f.get('interaction_mode') === 'selected')
            .forEach((f) => this.source.removeFeature(f));
    }


    getSelectedFeatures(): Feature<Geometry>[] {
        return this.source.getFeatures().filter(f => f.get('interaction_mode') === 'selected');
    }

    // ========== Drawing Logic ==========

    startDrawInteraction(drawType: 'Polygon' | 'LineString' | 'Point', onDrawEnd: (feature: Feature<Geometry>) => void) {
        if (this.currentDrawInteraction) {
            this.map.removeInteraction(this.currentDrawInteraction);
        }

        this.currentDrawInteraction = new Draw({
            source: this.source,
            type: drawType,
        });

        this.currentDrawInteraction.on('drawstart', () => {
            this.clearSelections(); // reset previous selection
        });

        this.currentDrawInteraction.on('drawend', (e) => {
            const feature = e.feature;
            feature.set('interaction_mode', 'selected');
            onDrawEnd(feature);
        });

        this.map.addInteraction(this.currentDrawInteraction);
    }

    clearDrawInteraction() {
        if (this.currentDrawInteraction) {
            this.map.removeInteraction(this.currentDrawInteraction);
            this.currentDrawInteraction = null;
        }
    }

    // ========== Styling ==========

    private getStyleForFeature(feature: Feature<Geometry> | null): Style {
        if (!feature) {
            return new Style(); // return default style for null features
        }
        const mode = feature.get('interaction_mode') as InteractionMode;

        if (mode === 'highlight') {
            return new Style({
                stroke: new Stroke({color: 'yellow', width: 3}),
                fill: new Fill({color: 'rgba(255,255,0,0.2)'}),
                image: new CircleStyle({
                    radius: 6,
                    fill: new Fill({color: 'yellow'}),
                    stroke: new Stroke({color: 'white', width: 2}),
                }),
            });
        }

        if (mode === 'selected') {
            return new Style({
                stroke: new Stroke({color: '#00bcd4', width: 2}),
                fill: new Fill({color: 'rgba(0,188,212,0.2)'}),
                image: new CircleStyle({
                    radius: 5,
                    fill: new Fill({color: '#00bcd4'}),
                }),
            });
        }

        return new Style(); // fallback
    }


    addWKTFeature(wkt: string, mode: 'highlight' | 'selected' = 'selected') {
        const format = new WKT();
        let feature: Feature<Geometry> | undefined;

        try {
            feature = format.readFeature(wkt, {
                dataProjection: 'EPSG:3857', // <-- FIXED!
                featureProjection: this.map.getView().getProjection(),
            });
        } catch (e) {
            console.warn("Invalid WKT syntax:", wkt);
            return;
        }

        const geom = feature?.getGeometry();
        const extent = geom?.getExtent();

        const isValidExtent = extent &&
            extent.length === 4 &&
            extent.every((v) => Number.isFinite(v)) &&
            extent[0] !== extent[2] &&
            extent[1] !== extent[3]; // width and height > 0

        if (feature && geom && isValidExtent) {
            feature.set('interaction_mode', mode);
            this.source.clear()
            this.source.addFeature(feature);
        } else {
            console.warn("Feature has invalid geometry or extent:", wkt, extent);
        }
    }


// zoomToSelections() {
    //     const selected = this.source
    //         .getFeatures()
    //         .filter((f) => f.get('interaction_mode') === 'selected');
    //     if (selected.length > 0) {
    //         const combinedExtent = selected
    //             .map((f) => f.getGeometry()?.getExtent())
    //             .reduce((acc, curr) => acc && curr ? buffer([...acc, ...curr], 20000) : acc);
    //         if (combinedExtent) {
    //             this.map.getView().fit(combinedExtent, {size: this.map.getSize()});
    //         }
    //     }
    // }
    // zoomToHighlighted() {
    //     const features = this.source
    //         .getFeatures()
    //         .filter((f) => f.get('interaction_mode') === 'highlight');
    //     if (features.length > 0) {
    //         const extent = buffer(features[0].getGeometry()?.getExtent()!, 2000);
    //         this.map.getView().fit(extent, {size: this.map.getSize()});
    //     }
    // }
    zoomToFeatures() {
        const selected = this.source
            .getFeatures()
        if (selected.length > 0) {
            const combinedExtent = selected
                .map((f) => f.getGeometry()?.getExtent())
                .reduce((acc, curr) => acc && curr ? buffer([...acc, ...curr], 20000) : acc);
            if (combinedExtent) {
                this.map.getView().fit(combinedExtent, {size: this.map.getSize()});
            }
        }
    }

}