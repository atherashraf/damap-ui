/**
 * WMSLayer (GeoServer WMS Overlay)
 * ================================
 * A GeoServer-focused WMS overlay layer for DAMap using OpenLayers ImageWMS.
 *
 * Supported GeoServer params
 * --------------------------
 * - LAYERS, STYLES
 * - CQL_FILTER (server-side filtering)
 * - viewparams (parameterized SQL views)
 * - env (SLD environment parameters)
 * - TIME (temporal dimension)
 * - TILED=true + serverType="geoserver"
 *
 * Typical use cases
 * -----------------
 * - Display PostGIS layers published through GeoServer
 * - Apply GeoServer styles
 * - Server-side filtering using CQL
 * - Dynamic SQL views via viewparams
 * - Time-enabled WMS layers
 *
 * -----------------------------------------------------------------------------
 * React Usage Example (Recommended)
 * -----------------------------------------------------------------------------
 *
 * This example demonstrates how to add a WMS layer using the DAMap hook
 * `useMapVM()` and automatically zoom to Pakistan.
 *
 * @example
 * import { useEffect, useCallback } from "react";
 * import { useMapVM, MapVM } from "@damap/damap";
 * import { transformExtent } from "ol/proj";
 *
 * const ProvinceWMSExample = () => {
 *   const mapVM = useMapVM();
 *
 *   const addWMS = useCallback(() => {
 *     if (!mapVM?.getMap()) return;
 *
 *     const wmsUUID = "pak_province_wms";
 *
 *     // Create WMS layer
 *     mapVM.createWMSLayer({
 *       uuid: wmsUUID,
 *       title: "Pakistan Provinces (WMS)",
 *       url: "https://YOUR_SERVER/geoserver/workspace/wms",
 *       layers: "workspace:pak_provinces",
 *       styles: "",
 *       format: "image/png",
 *       transparent: true,
 *       version: "1.1.1",
 *       tiled: true,
 *       zIndex: 600,
 *       opacity: 1,
 *       visible: true,
 *     });
 *
 *     const wms = mapVM.getOverlayLayer(wmsUUID);
 *
 *     // Apply GeoServer CQL filter
 *     wms?.setCqlFilter("adm1_en='Punjab'");
 *
 *     // Change GeoServer style
 *     wms?.setStyleName("province_style");
 *
 *     // Optional: set SQL view params
 *     wms?.setViewParams({ year: 2022, province: "Punjab" });
 *
 *     // Optional: set SLD environment params
 *     wms?.setEnv({ color: "#00AA00", width: 3 });
 *
 *     // Optional: time dimension
 *     wms?.setTime("2022-09-02/2022-09-09");
 *
 *     // Zoom to Pakistan extent
 *     const pak4326 = [
 *       60.8742484882,
 *       23.6919650335,
 *       77.8374507995,
 *       37.1330309108,
 *     ];
 *
 *     const pakExtent = transformExtent(
 *       pak4326,
 *       "EPSG:4326",
 *       mapVM.getViewProjectionCode()
 *     );
 *
 *     mapVM.zoomToExtent(pakExtent);
 *
 *   }, [mapVM]);
 *
 *   useEffect(() => {
 *     addWMS();
 *   }, [addWMS]);
 *
 *   return null;
 * };
 *
 * -----------------------------------------------------------------------------
 * Legend Support
 * -----------------------------------------------------------------------------
 * WMSLayer automatically generates a legend using GeoServer:
 *
 *   GetLegendGraphic
 *
 * The legend is attached to the OpenLayers layer and automatically displayed
 * in the DAMap Layer Switcher.
 *
 * -----------------------------------------------------------------------------
 * Identify Support (Optional)
 * -----------------------------------------------------------------------------
 * WMS layers are rendered as images. To query features you must use:
 *
 *   GetFeatureInfo
 *
 * Example:
 *
 * const geojson = await wms.identify(evt);
 *
 * The request internally calls:
 *
 *   WMS GetFeatureInfo
 *   INFO_FORMAT=application/json
 *
 */
import ImageLayer from "ol/layer/Image";
import ImageWMS from "ol/source/ImageWMS";
import MapVM from "@damap/components/map/models/MapVM";
import autoBind from "auto-bind";
import AbstractOverlayLayer from "./AbstractOverlayLayer";
import WMSCapabilities from "ol/format/WMSCapabilities";
import { transformExtent } from "ol/proj";


export interface IGeoServerWMSInfo {
    uuid: string;
    name: string;
    title: string;

    // Example: "https://your-domain/geoserver/workspace/wms"
    url: string;

    // Example: "workspace:pak_provinces"
    layers: string;

    // Optional GeoServer WMS params
    styles?: string;                 // "styleName" or ""
    format?: string;                 // "image/png"
    transparent?: boolean;           // true
    version?: "1.1.1" | "1.3.0";     // "1.1.1" or "1.3.0"

    // GeoServer filters/params
    cqlFilter?: string;              // "adm1_en='Punjab'"
    viewParams?: Record<string, string | number>; // {year: 2022, id: 5}
    env?: Record<string, string | number>;        // {color: "#ff0000"}
    time?: string;                   // ISO or GeoServer time range "2022-01-01/2022-12-31"

    // OL layer options
    zIndex?: number;
    visible?: boolean;
    opacity?: number;

    // If you want tiled hints for GeoServer
    tiled?: boolean;                 // true/false (adds TILED=true)
    infoFormat?: string;     // default: "application/json"
    featureCount?: number;   // default: 10
}

class WMSLayer extends AbstractOverlayLayer {
    mapVM: MapVM;
    layerInfo: IGeoServerWMSInfo;
    olLayer: ImageLayer<ImageWMS>;

    constructor(info: IGeoServerWMSInfo, mapVM: MapVM) {
        super();
        this.mapVM = mapVM;
        this.layerInfo = {
            format: "image/png",
            transparent: true,
            version: "1.1.1",
            visible: true,
            opacity: 1,
            tiled: true,
            infoFormat: "application/json",
            featureCount: 10,
            ...info,
        };

        autoBind(this);

        this.olLayer = this.createLayer();
        this.mapVM.addOverlayLayer(this);

        void this.loadExtentFromCapabilities();
    }

    getLayerUUID(): string {
        return this.layerInfo.uuid;
    }

    getLayerTitle(): string {
        return this.olLayer?.get("title");
    }

    getOlLayer(): ImageLayer<ImageWMS> {
        return this.olLayer;
    }

    getSource(): ImageWMS {
        // @ts-ignore
        return this.olLayer.getSource();
    }

    createLayer() {
        const params: any = {
            LAYERS: this.layerInfo.layers,
            STYLES: this.layerInfo.styles ?? "",
            FORMAT: this.layerInfo.format ?? "image/png",
            TRANSPARENT: this.layerInfo.transparent ?? true,
            VERSION: this.layerInfo.version ?? "1.1.1",
        };

        // GeoServer tiling hint
        if (this.layerInfo.tiled) params.TILED = true;

        // GeoServer CQL filter
        if (this.layerInfo.cqlFilter) params.CQL_FILTER = this.layerInfo.cqlFilter;

        // GeoServer TIME dimension
        if (this.layerInfo.time) params.TIME = this.layerInfo.time;

        // GeoServer viewparams: key1:val1;key2:val2
        if (this.layerInfo.viewParams) {
            params.viewparams = this.encodeViewParams(this.layerInfo.viewParams);
        }

        // GeoServer env: key:val;key2:val2
        if (this.layerInfo.env) {
            params.env = this.encodeKeyVals(this.layerInfo.env);
        }

        const layer =  new ImageLayer({
            // @ts-ignore
            uuid: MapVM.generateUUID(),
            name: this.layerInfo.uuid,
            title: this.layerInfo.title,
            layerType: "wms",
            displayInLayerSwitcher: true,
            visible: this.layerInfo.visible ?? true,
            opacity: this.layerInfo.opacity ?? 1,
            zIndex: this.layerInfo.zIndex ?? 500,
            source: new ImageWMS({
                url: this.layerInfo.url,
                params,
                serverType: "geoserver",
                ratio: 1, // 1 = no extra margin around requests, can set 1.5 if needed
                crossOrigin: "anonymous",
            }),
        });

        (layer as any).legend = {
            sType: "src",
            graphic: this.buildLegendUrl(),
        };

        return layer;
    }

    private buildLegendUrl(): string {
        const { url, layers, styles, version } = this.layerInfo;

        // GeoServer legend endpoint is usually /wms as well
        const base = url.includes("?") ? url.split("?")[0] : url;

        const params = new URLSearchParams({
            SERVICE: "WMS",
            REQUEST: "GetLegendGraphic",
            FORMAT: "image/png",
            LAYER: layers,
            // GeoServer accepts STYLE (or omit if default)
            ...(styles ? { STYLE: styles } : {}),
            VERSION: version ?? "1.1.1",
            // Optional vendor params:
            TRANSPARENT: "true",
        });

        // If you use CQL, often you want legend for the same styling (optional)
        // Note: Legend typically doesn't need CQL, but can be included
        if (this.layerInfo.cqlFilter) params.set("CQL_FILTER", this.layerInfo.cqlFilter);

        // Cache-bust so updated styles show
        params.set("_ts", String(Date.now()));

        return `${base}?${params.toString()}`;
    }

    // --------- Public API (GeoServer focused) ---------

    setVisible(visible: boolean) {
        this.olLayer.setVisible(visible);
    }

    setOpacity(opacity: number) {
        this.olLayer.setOpacity(opacity);
    }

    setCqlFilter(cql: string | undefined) {
        this.layerInfo.cqlFilter = cql;
        const src = this.getSource();
        const p = src.getParams();
        if (cql && cql.trim().length) p.CQL_FILTER = cql;
        else delete p.CQL_FILTER;
        src.updateParams(p);

        this.refreshLegend(); // ✅
    }

    setLayers(layers: string, styles?: string) {
        this.layerInfo.layers = layers;
        if (styles !== undefined) this.layerInfo.styles = styles;

        const src = this.getSource();
        const p = src.getParams();
        p.LAYERS = layers;
        p.STYLES = this.layerInfo.styles ?? "";
        src.updateParams(p);
    }

    setStyleName(geoServerStyleName: string) {
        this.layerInfo.styles = geoServerStyleName;
        const src = this.getSource();
        const p = src.getParams();
        p.STYLES = geoServerStyleName ?? "";
        src.updateParams(p);

        this.refreshLegend();
    }

    setTime(time: string | undefined) {
        this.layerInfo.time = time;
        const src = this.getSource();
        const p = src.getParams();
        if (time && time.trim().length) p.TIME = time;
        else delete p.TIME;
        src.updateParams(p);
    }

    setViewParams(viewParams: Record<string, string | number> | undefined) {
        this.layerInfo.viewParams = viewParams;
        const src = this.getSource();
        const p = src.getParams();
        if (viewParams) p.viewparams = this.encodeViewParams(viewParams);
        else delete p.viewparams;
        src.updateParams(p);
    }

    setEnv(env: Record<string, string | number> | undefined) {
        this.layerInfo.env = env;
        const src = this.getSource();
        const p = src.getParams();
        if (env) p.env = this.encodeKeyVals(env);
        else delete p.env;
        src.updateParams(p);
    }

    refresh() {
        // Bust cache by changing a dummy param
        const src = this.getSource();
        src.updateParams({ ...src.getParams(), _ts: Date.now() });
    }

    private refreshLegend() {
        (this.olLayer as any).legend = {
            sType: "src",
            graphic: this.buildLegendUrl(),
        };
    }

    // --------- Helpers ---------

    private encodeViewParams(obj: Record<string, string | number>) {
        // GeoServer expects: key1:val1;key2:val2
        return Object.entries(obj)
            .map(([k, v]) => `${encodeURIComponent(k)}:${encodeURIComponent(String(v))}`)
            .join(";");
    }

    private encodeKeyVals(obj: Record<string, string | number>) {
        // Used by env as well: key:val;key2:val2
        return Object.entries(obj)
            .map(([k, v]) => `${encodeURIComponent(k)}:${encodeURIComponent(String(v))}`)
            .join(";");
    }
    /**
     * Build GeoServer GetFeatureInfo URL for a map click event.
     * Works best when the layer is visible and the map has a view projection set.
     */
    getFeatureInfoUrl(evt: any) {
        const map = this.mapVM.getMap();
        const view = map?.getView();
        const src = this.getSource();
        if (!map || !view || !src) return undefined;

        const resolution = view.getResolution();
        const projection = view.getProjection();
        if (resolution === undefined || !projection) return undefined;

        return src.getFeatureInfoUrl(
            evt.coordinate,
            resolution,
            projection,
            {
                INFO_FORMAT: this.layerInfo.infoFormat ?? "application/json",
                FEATURE_COUNT: this.layerInfo.featureCount ?? 10,
                // You can pass vendor params here too if needed:
                // QUERY_LAYERS: this.layerInfo.layers,
            }
        );
    }

    /**
     * Identify features from GeoServer WMS using GetFeatureInfo.
     * Returns the GeoServer response (GeoJSON if INFO_FORMAT=application/json).
     *
     * @example
     * map.on("singleclick", async (evt) => {
     *   const result = await wms.identify(evt);
     *   console.log(result);
     * });
     */
    async identify(evt: any) {
        const url = this.getFeatureInfoUrl(evt);
        if (!url) return null;

        const res = await fetch(url);
        if (!res.ok) return null;

        const infoFormat = this.layerInfo.infoFormat ?? "application/json";

        // GeoServer may return JSON or HTML depending on config
        if (infoFormat.includes("json")) {
            return await res.json();
        }
        return await res.text();
    }

    /**
     *  getting layer capabilities and extent
     */
    private findCapabilityLayer(layerNode: any, targetName: string): any | null {
        if (!layerNode) return null;

        const nodeName = layerNode.Name;
        const targetLocal = targetName.split(":").pop(); // remove namespace

        if (
            nodeName === targetName ||           // workspace:layer
            nodeName === targetLocal ||          // layer
            nodeName?.split(":").pop() === targetLocal // defensive
        ) {
            return layerNode;
        }

        const children = layerNode.Layer;

        if (Array.isArray(children)) {
            for (const child of children) {
                const found = this.findCapabilityLayer(child, targetName);
                if (found) return found;
            }
        }

        return null;
    }

    async loadExtentFromCapabilities(): Promise<number[] | null> {
        try {
            const baseUrl = this.layerInfo.url.includes("?")
                ? this.layerInfo.url.split("?")[0]
                : this.layerInfo.url;

            const url = `${baseUrl}?service=WMS&request=GetCapabilities`;

            const res = await fetch(url);
            if (!res.ok) return null;

            const xml = await res.text();

            const parser = new WMSCapabilities();
            const caps: any = parser.read(xml);
            const rootLayer = caps?.Capability?.Layer;
            const target = this.findCapabilityLayer(rootLayer, this.layerInfo.layers);
            if (!target) return null;

            const mapProjection = this.mapVM.getViewProjectionCode();
            // console.log("mapProjection", mapProjection);
            // Prefer explicit BoundingBox first
            if (Array.isArray(target.BoundingBox) && target.BoundingBox.length > 0) {
                const bbox = target.BoundingBox.find((b: any) =>
                    b.crs === mapProjection || b.srs === mapProjection
                ) || target.BoundingBox[0];

                if (bbox?.extent?.length === 4) {
                    const sourceCrs = bbox.crs || bbox.srs || mapProjection;
                    const extent =
                        sourceCrs === mapProjection
                            ? bbox.extent
                            : transformExtent(bbox.extent, sourceCrs, mapProjection);

                    this.olLayer.set("dataExtent", extent);
                    return extent;
                }
            }

            // Fallback: geographic bbox in EPSG:4326
            const geo = target.EX_GeographicBoundingBox;
            console.log("geo extent", geo);
            if (Array.isArray(geo) && geo.length === 4) {
                const extent = transformExtent(geo, "EPSG:4326", mapProjection);
                this.olLayer.set("dataExtent", extent);
                return extent;
            }

            return null;
        } catch (err) {
            console.error("Failed to load WMS extent from GetCapabilities", err);
            return null;
        }
    }

    getDataExtent(): number[] | null {
        return this.olLayer.get("dataExtent") ?? null;
    }
}

export default WMSLayer;
