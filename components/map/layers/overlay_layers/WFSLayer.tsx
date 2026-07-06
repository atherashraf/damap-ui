/**
 * WFSLayer (GeoServer WFS Vector Overlay)
 * ======================================
 * A GeoServer-focused **WFS (GetFeature) vector overlay** for DAMap.
 *
 * This class **extends OverlayVectorLayer**, so you automatically inherit:
 * - ✅ OverlayVectorLayer styling system (setStyle / updateStyle using IFeatureStyle)
 * - ✅ labels (updateLabelOptions, showLabel/labelProperty/textStyle, min/max label zoom)
 * - ✅ legend graphics (same StylingUtils legend pipeline)
 * - ✅ client-side identify (OpenLayers vector hit-detection)
 * - ✅ attribute table support (features are loaded into VectorSource)
 * - ✅ extents / zoom helpers
 *
 * What WFSLayer adds:
 * - `reload(clearPreviousFeatures?: boolean)` → fetches GeoJSON from GeoServer WFS and loads it into the overlay.
 * - `setCqlFilter(cql?: string)` → server-side filtering (CQL_FILTER).
 *
 * -----------------------------------------------------------------------------
 * GeoServer WFS parameters used
 * -----------------------------------------------------------------------------
 * - service=WFS
 * - request=GetFeature
 * - version=1.1.0
 * - typeName=<workspace:layer>
 * - outputFormat=application/json
 * - srsName=EPSG:xxxx   (GeoServer will output in this CRS if enabled)
 * - maxFeatures=<n>     (WFS 1.0/1.1)  // for WFS 2.0 it is usually `count`
 * - CQL_FILTER=<expr>   (optional)
 *
 * Notes:
 * - Large layers may require paging (startIndex/count) or server-side filtering via CQL.
 * - If you request `srsName = mapVM.getViewProjectionCode()` you typically avoid reprojection issues
 *   because features arrive in the same CRS as the map view.
 *
 * -----------------------------------------------------------------------------
 * QUICK USAGE (React) — useMapVM + createWFSLayer pattern
 * -----------------------------------------------------------------------------
 *
 * @example
 * import { useCallback, useEffect } from "react";
 * import { useMapVM } from "@damap/hooks/MapVMContext";
 * import WFSLayer from "@damap/components/map/layers/overlay_layers/WFSLayer";
 * import { transformExtent } from "ol/proj";
 *
 * const GeoServerWFSTest = () => {
 *   const mapVM = useMapVM();
 *
 *   const addWfs = useCallback(async () => {
 *     if (!mapVM?.getMap?.()) return;
 *
 *     const uuid = "wfs_district_boundary";
 *
 *     // Create once (avoid duplicates)
 *     if (!mapVM.isOverlayLayerExist(uuid)) {
 *       mapVM.createWFSLayer({
 *         uuid,
 *         title: "District Boundary (WFS)",
 *         url: "https://gis.wasalhr.pk:82/geoserver/cite/ows",
 *         typeName: "cite:district_boundary",
 *
 *         // Best practice: ask server for data in the current map projection (if GeoServer supports it)
 *         srsName: mapVM.getViewProjectionCode(), // e.g. EPSG:3857
 *         outputFormat: "application/json",
 *         maxFeatures: 5000,
 *
 *         // Initial style (same style structure as OverlayVectorLayer)
 *         style: {
 *           type: "single",
 *           style: {
 *             default: {
 *               strokeColor: "#00AA00",
 *               strokeWidth: 2,
 *               fillColor: "rgba(0,170,0,0.15)",
 *             },
 *           },
 *         },
 *
 *         // Optional labeling
 *         showLabel: true,
 *         labelProperty: "district_n",
 *         textStyle: { font: "12px Calibri", fillColor: "#000", strokeColor: "#fff", strokeWidth: 2 },
 *       });
 *     }
 *
 *     // Update filter + reload
 *     const wfs = mapVM.getOverlayLayer(uuid) as WFSLayer;
 *     wfs.setCqlFilter("division_n='Sargodha'");
 *     await wfs.reload(true); // true = clear previous features
 *
 *     // Optional zoom: Pakistan bbox (EPSG:4326 → map view projection)
 *     const pak4326: [number, number, number, number] = [
 *       60.8742484882, 23.6919650335, 77.8374507995, 37.1330309108,
 *     ];
 *     const pakExtent = transformExtent(pak4326, "EPSG:4326", mapVM.getViewProjectionCode());
 *     mapVM.zoomToExtent(pakExtent, 10);
 *   }, [mapVM]);
 *
 *   useEffect(() => { addWfs(); }, [addWfs]);
 *   return null;
 * };
 *
 * -----------------------------------------------------------------------------
 * Common patterns
 * -----------------------------------------------------------------------------
 * - Change style after load:
 *     wfs.setStyle(newStyle, true);
 *
 * - Toggle / update labels:
 *     wfs.updateLabelOptions("district_n", { font: "bold 14px Arial" }, true, 10, 18);
 *
 * - Re-run query:
 *     wfs.setCqlFilter("district_n='Bhakkar'");
 *     await wfs.reload(true);
 */

import OverlayVectorLayer, { IOverLayVectorInfo } from "./OverlayVectorLayer";
import MapVM from "@damap/components/map/models/MapVM";
import { IFeatureStyle, IGeoJSON, ITextStyle } from "@damap/types/typeDeclarations";

export interface IGeoServerWFSInfo extends Omit<IOverLayVectorInfo, "style"> {
    /** same uuid/title as overlay layer */
    name: string;
    uuid: string;
    title: string;

    /** WFS endpoint, usually .../geoserver/<ws>/ows OR .../geoserver/ows */
    url: string;

    /** typeName, e.g. "cite:district_boundary" */
    typeName: string;

    /** outputFormat for WFS (GeoServer supports JSON / application/json / etc.) */
    outputFormat?: string; // default: "application/json"

    /** srsName requested from server (GeoServer will reproject if enabled) */
    srsName?: string; // default: "EPSG:4326"

    /** maxFeatures / count */
    maxFeatures?: number; // optional

    /** GeoServer CQL filter */
    cqlFilter?: string; // optional

    /** initial style (Overlay style system) */
    style?: IFeatureStyle;

    /** labeling same as overlay */
    showLabel?: boolean;
    labelProperty?: string;
    textStyle?: ITextStyle;

    /** label zoom window */
    minLabelZoom?: number;
    maxLabelZoom?: number;
}

/**
 * WFSLayer (GeoServer WFS Vector Overlay)
 * ======================================
 * A GeoServer WFS-backed vector overlay for DAMap.
 *
 * It EXTENDS OverlayVectorLayer, so you automatically get:
 * - setStyle / updateStyle (IFeatureStyle)
 * - legend graphic (same StylingUtils legend pipeline)
 * - labeling (updateLabelOptions)
 * - vector identify + selection compatibility
 * - attribute table support (because features are client-side)
 *
 * The only extra part is: `reload()` which fetches GeoJSON via WFS
 * and loads it into the VectorSource.
 */
class WFSLayer extends OverlayVectorLayer {
    private wfsInfo: IGeoServerWFSInfo;

    constructor(info: IGeoServerWFSInfo, mapVM: MapVM) {
        // OverlayVectorLayer requires `style` (so provide a default)
        super(
            {
                uuid: info.uuid,
                title: info.title,
                style: info.style ?? MapVM.getDefaultStyle(),
                showLabel: info.showLabel ?? false,
                labelProperty: info.labelProperty,
                textStyle: info.textStyle,
                minLabelZoom: info.minLabelZoom,
                maxLabelZoom: info.maxLabelZoom,
                geomType: info.geomType,
            },
            mapVM
        );

        this.wfsInfo = {
            outputFormat: "application/json",
            srsName: "EPSG:4326",
            ...info,
        };
    }

    /** Change CQL filter (server-side) */
    setCqlFilter(cql?: string) {
        this.wfsInfo.cqlFilter = cql;
    }

    /** Build GeoServer WFS GetFeature URL */
    private buildUrl() {
        const u = new URL(this.wfsInfo.url);

        // GeoServer WFS GetFeature
        u.searchParams.set("service", "WFS");
        u.searchParams.set("version", "1.1.0");
        u.searchParams.set("request", "GetFeature");
        u.searchParams.set("typeName", this.wfsInfo.typeName);

        u.searchParams.set("outputFormat", this.wfsInfo.outputFormat ?? "application/json");

        // GeoServer projection request (server will output in this CRS if supported)
        if (this.wfsInfo.srsName) u.searchParams.set("srsName", this.wfsInfo.srsName);

        if (this.wfsInfo.maxFeatures) {
            // GeoServer supports maxFeatures (1.0/1.1). For WFS 2.0 it’s `count`.
            u.searchParams.set("maxFeatures", String(this.wfsInfo.maxFeatures));
        }

        if (this.wfsInfo.cqlFilter) {
            u.searchParams.set("CQL_FILTER", this.wfsInfo.cqlFilter);
        }

        return u.toString();
    }

    /**
     * Reload WFS features into this overlay source
     * @param clearPreviousFeatures default true (clears before adding)
     * @returns number of loaded features
     */
    async reload(clearPreviousFeatures: boolean = true): Promise<number> {
        const url = this.buildUrl();
        const res = await fetch(url);
        if (!res.ok) return 0;

        const geojson = (await res.json()) as IGeoJSON;

        // IMPORTANT: the GeoJSON is in `srsName` (default EPSG:4326 unless you requested otherwise)
        const dataCrs = this.wfsInfo.srsName ?? "EPSG:4326";

        return this.addGeojsonFeature(geojson, dataCrs, clearPreviousFeatures);
    }
}

export default WFSLayer;
