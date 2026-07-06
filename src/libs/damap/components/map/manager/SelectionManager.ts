import { Geometry } from "ol/geom";
import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorTileLayer from "ol/layer/VectorTile";
import TileLayer from "ol/layer/Tile";
import MapVM from "@damap/components/map/models/MapVM";
import WMSLayer from "@damap/components/map/layers/overlay_layers/WMSLayer";
import {MapAPIs, RasterTileLayer, SelectionLayerMode} from "@/libs/damap";
import { Pixel } from "ol/pixel";
import { WKT } from "ol/format";

export class SelectionManager {
    private mapVM: MapVM;
    private _selectionLayerMode: SelectionLayerMode ="default";

    constructor(mapVM: MapVM, selectionLayerMode?:SelectionLayerMode) {
        this.mapVM = mapVM;
        this._selectionLayerMode = selectionLayerMode ?? "default"
    }

    set selectionLayerMode(mode: SelectionLayerMode) {
        this._selectionLayerMode = mode;
    }
    get selectionLayerMode() { return this._selectionLayerMode; }

    /**
     * Handles Point/Click Selection using Pixel for immediate client-side feedback.
     */
    public async handleIdentifyClick(pixel: Pixel) {
        const map = this.mapVM.getMap();
        const selLayer = this.mapVM.getSelectionLayer(this.selectionLayerMode);

        selLayer.clearSelection();

        // forEachFeatureAtPixel is optimized for both MVT and Vector click selection
        const feature = map.forEachFeatureAtPixel(pixel, (f) => f) as Feature<Geometry>;

        if (feature) {
            selLayer.addFeature(feature);
            this.mapVM.showSnackbar("Feature selected.", "success");
        } else {
            this.mapVM.showSnackbar("No feature found at this location.", "info");
        }
    }

    // public setSelectionLayerMode(selectionMode: SelectionMode) {
    //
    // }

    /**
     * Orchestrates spatial selection by delegating to specialized handlers based on layer type.
     */
    public async execute(geom: Geometry, selLayerUUIDs:string[]=[]) {
        // if selLayerUUID will not provide all layer will be selected
        console.log("selection mode ", this.selectionLayerMode)
        const selLayer = this.mapVM.getSelectionLayer(this.selectionLayerMode);
        const foundFeatures: Feature<Geometry>[] = [];
        // const uniqueIds = new Set<string | number>();

        selLayer.clearSelection();
        this.mapVM.getMapLoadingRef().current?.openIsLoading();

        const layers = this.mapVM.getMap().getLayers().getArray();

        try {
            // Use for...of to correctly handle async calls inside the loop
            for (const layer of layers) {
                if (!layer.getVisible() || layer === selLayer.getOlLayer()) continue;
                if (selLayerUUIDs.length > 0) {
                    const layerUUID = layer.get("name");
                    if (!selLayerUUIDs.includes(layerUUID)) continue;
                }

                if (layer instanceof VectorTileLayer) {
                    await this.handleVectorTile(layer, geom);
                }
                else if (layer instanceof VectorLayer) {
                    // Standard vector layers use local spatial intersection
                    this.handleVectorSource(layer, geom, foundFeatures);
                }
                else if (layer instanceof WMSLayer) {
                    this.handleWMS(layer);
                }
                else if (layer instanceof RasterTileLayer || layer instanceof TileLayer) {
                    this.handleRaster(layer);
                }
            }

            // finalize only handles features found via local VectorSource queries
            if (foundFeatures.length > 0) {
                this.finalize(foundFeatures);
            }
        } catch (err) {
            console.error("Selection Error:", err);
            this.mapVM.showSnackbar("Error during spatial selection", "error");
        } finally {
            this.mapVM.getMapLoadingRef().current?.closeIsLoading();
        }
    }

    /**
     * Client-side selection for standard Vector Layers (DAVectorLayer).
     */
    private handleVectorSource(layer: VectorLayer<any>, geom: Geometry, found: Feature<Geometry>[]) {
        const source = layer.getSource();
        if (source && typeof source.getFeaturesInExtent === 'function') {
            const features = source.getFeaturesInExtent(geom.getExtent());
            features.forEach((f: Feature<Geometry>) => {
                const fGeom = f.getGeometry();
                // Precise intersection check for polygons
                if (fGeom && geom.intersectsExtent(fGeom.getExtent())) {
                    found.push(f);
                }
            });
        }
    }

    /**
     * Server-side selection for MVT Layers (DAMapQL backend).
     * Solves the tile-clipping issue by fetching the full geometry via PostGIS.
     */
    private async handleVectorTile(layer: VectorTileLayer, geom: Geometry) {
        const layerUuid = layer.get("name"); // UUID assigned during MVTLayer init
        const projection = this.mapVM.getViewProjectionCode();

        const format = new WKT();
        const wktGeometry = format.writeGeometry(geom);

        try {
            // POST request to DAMapQL FastAPI backend
            const response = await this.mapVM.getApi().post(MapAPIs.DCH_LAYER_SELECT, {
                layer_uuid: layerUuid,
                geometry: wktGeometry,
                srid: projection === "EPSG:3857" ? 3857 : 4326
            }, {uuid: layerUuid});

            if (response) {
                // Add the full PostGIS geometry (GeoJSON) back to the selection layer
                this.mapVM.getSelectionLayer(this.selectionLayerMode).addGeoJson2Selection(response, false);
                this.mapVM.showSnackbar(`Selected ${response.meta?.count || 0} features from server.`);
            }
        } catch (err) {
            console.error("MVT Selection Error:", err);
            this.mapVM.showSnackbar("Server-side selection failed", "error");
        }
    }

    private handleWMS(layer: any) {
        this.mapVM.showSnackbar(`Selection not supported for WMS: ${layer.get('title')}`, "info");
    }

    private handleRaster(layer: any) {
        this.mapVM.showSnackbar(`Selection not supported for Raster: ${layer.get('title')}`, "info");
    }

    private finalize(features: Feature<Geometry>[]) {
        const selLayer = this.mapVM.getSelectionLayer(this.selectionLayerMode);
        selLayer.addFeatures(features);
        this.mapVM.showSnackbar(`Selected ${features.length} features.`, "success");
    }
}