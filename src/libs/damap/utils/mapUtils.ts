import XYZ from "ol/source/XYZ";
import GeoJSON from "ol/format/GeoJSON";
import { Layer } from "ol/layer";
import { Source } from "ol/source";

import { MapAPIs } from "@damap/api/MapApi";
import MapVM from "@damap/components/map/models/MapVM";
import type { ILayerRecord } from "@damap/components/map/manager/LayerManager";

import "@damap/assets/css/side-drawer.css";
import "@damap/assets/css/identifier-table.css";

class MapUtils {
    mapVm: MapVM | null = null;
    dialogRef: any | null = null;

    constructor(mVM: MapVM) {
        this.mapVm = mVM;
        this.dialogRef = mVM.getDialogBoxRef();
    }

    getRasterPixelValue(coord: number[], mapVM: MapVM, targetElem: HTMLElement) {
        const xyzLayers = mapVM.getLayersByKind("xyz");

        xyzLayers.forEach((record: ILayerRecord) => {
            const olLayer = record.olLayer as Layer<Source>;

            if (olLayer.getSource() instanceof XYZ) {
                const layerName = olLayer.get("name");
                const layerTitle = olLayer.get("title");

                mapVM
                    .getApi()
                    .get(MapAPIs.DCH_LAYER_PIXEL_VALUE, {
                        uuid: layerName,
                        long: coord[0],
                        lat: coord[1],
                    })
                    .then((payload) => {
                        if (payload) {
                            const obj = { layer: layerTitle, value: payload };
                            this.showJsonDataInHTMLTable(obj, "raster", targetElem);
                        }
                    })
                    .catch((err) => {
                        console.error("Failed to get raster pixel value", err);
                    });
            }
        });
    }

    getRasterAreaFromDB(
        polygonJsonStr: string,
        rasterLayers: Layer<Source>[],
        mapVM: MapVM,
        targetElem: HTMLElement
    ) {
        if (!rasterLayers.length) return;

        const layerName = rasterLayers[0].get("name");

        mapVM
            .getApi()
            .get(MapAPIs.DCH_RASTER_AREA, {
                uuid: layerName,
                geojson_str: polygonJsonStr,
            })
            .then((payload) => {
                if (payload) {
                    this.showAreaInRightDraw(payload, targetElem);
                }
            })
            .catch((err) => {
                console.error("Failed to get raster area", err);
            });
    }

    showJsonDataInHTMLTable(
        myObj: Record<string, any>,
        lyrType: string,
        targetElem: HTMLElement
    ) {
        let table = "<table class='identifier-table'>";
        for (const key in myObj) {
            table +=
                "<tr><td>" +
                key.toUpperCase() +
                "</td><td>" +
                myObj[key] +
                "</td></tr>";
        }
        table += "</table>";

        const acc = document.getElementsByClassName("accordion");
        let index = 1;

        if (lyrType === "raster") {
            index = 0;
        }

        if (acc.length > 0 && acc[index]) {
            acc[index].innerHTML = myObj["layer"];
            const panel = acc[index].nextElementSibling as HTMLElement | null;
            if (panel) {
                panel.innerHTML = table;
            }
        } else {
            targetElem.innerHTML = table;
        }
    }

    addAccordionsToRightDraw(htmlElem: HTMLElement) {
        const html = `
            <button class="accordion">Raster Layer</button>
            <div class="panel">No Raster Layer Clicked</div>
            <button class="accordion">Vector Layer</button>
            <div class="panel">For values click on feature, please</div>
        `;

        htmlElem.innerHTML = html;

        const acc = htmlElem.getElementsByClassName("accordion");
        for (let i = 0; i < acc.length; i++) {
            acc[i].addEventListener("click", function (this: HTMLElement) {
                this.classList.toggle("active");
                const panel = this.nextElementSibling as HTMLElement | null;
                if (!panel) return;

                panel.style.display =
                    panel.style.display === "block" ? "none" : "block";
            });
        }
    }

    getRasterLayers(mapVM: MapVM): Layer<Source>[] {
        return mapVM
            .getLayersByKind("xyz")
            .map((record: ILayerRecord) => record.olLayer as Layer<Source>)
            .filter((olLayer) => olLayer.getSource() instanceof XYZ);
    }

    getRasterAreaFromPolygon(mapVM: MapVM, targetElem: HTMLElement, feature: any) {
        const rasterLayers = this.getRasterLayers(mapVM);
        const writer = new GeoJSON();
        const polygonJsonStr = writer.writeFeatures([feature]);

        if (rasterLayers.length > 0) {
            this.getRasterAreaFromDB(polygonJsonStr, rasterLayers, mapVM, targetElem);
        }
    }

    showAreaInRightDraw(
        arrData: Array<{ pixel: string; area: number }>,
        targetElem: HTMLElement
    ) {
        let table = "<table><tr><th>Class</th><th>Area (m^2)</th></tr>";
        for (let i = 0; i < arrData.length; i++) {
            const obj = arrData[i];
            table +=
                "<tr><td>" + obj.pixel + "</td><td>" + obj.area + "</td></tr>";
        }
        table += "</table>";

        const footer =
            '<div class="footer_div"><button id="btnShowChart" type="button" class="myButton">Show Chart</button></div>';

        targetElem.innerHTML = table + footer;

        const data = arrData.map((row) => ({
            name: row.pixel,
            y: row.area,
        }));

        console.log(data);
    }

    static detectGeoJsonCrs(geo: any): "EPSG:4326" | "EPSG:3857" | "unknown" {
        if (!geo) return "unknown";

        const crsName =
            geo?.crs?.properties?.name ??
            geo?.crs?.name ??
            geo?.features?.[0]?.crs?.properties?.name ??
            geo?.features?.[0]?.crs?.name;

        if (typeof crsName === "string") {
            const m = crsName.match(/EPSG:\d+/i);
            if (m) {
                const epsg = m[0].toUpperCase();
                if (epsg === "EPSG:4326") return "EPSG:4326";
                if (epsg === "EPSG:3857") return "EPSG:3857";
            }
        }

        const coords =
            geo?.type === "Feature"
                ? geo?.geometry?.coordinates
                : geo?.type === "FeatureCollection"
                    ? geo?.features?.[0]?.geometry?.coordinates
                    : geo?.coordinates;

        const n = MapUtils.firstNumberDeep(coords);
        if (n == null) return "unknown";

        const abs = Math.abs(n);

        if (abs <= 180) return "EPSG:4326";
        if (abs <= 20037508.34) return "EPSG:3857";

        return "unknown";
    }

    private static firstNumberDeep(v: any): number | null {
        if (typeof v === "number" && isFinite(v)) return v;
        if (!Array.isArray(v)) return null;

        for (const x of v) {
            const n = MapUtils.firstNumberDeep(x);
            if (n !== null) return n;
        }

        return null;
    }
}

export default MapUtils;