//
// import { inflateCoordinatesArray } from "ol/geom/flat/inflate";
// import Feature from "ol/Feature";
// import Polygon from "ol/geom/Polygon";
// import LineString from "ol/geom/LineString";
// import XYZ from "ol/source/XYZ";
// import { transform } from "ol/proj";
// import GeoJSON from "ol/format/GeoJSON";
//
// import "../static/css/SideDrawer.css";
// import {MapAPIs} from "@damap/api/MapApi";
// import DAChart from "@dsmap/components/common/DACharts";
//
//
// type GenericObject = Record<string, any>;
//
// class MapControls {
//     mapVm: any = null;
//     dialogRef: any = null;
//
//     constructor(mVM: any) {
//         this.mapVm = mVM;
//         this.dialogRef = mVM.getDialogBoxRef();
//     }
//
//     setCurserDisplay(_: string): void {
//         // document.getElementById("da-map")!.style.cursor = curserStyle;
//     }
//
//     displayFeatureInfo(evt: any, mapVm: any, targetElem: HTMLElement): void {
//         const me = this;
//         me.addAccordionsToRightDraw(targetElem);
//
//         const map = mapVm.map;
//         const pixel = evt.pixel;
//         let coord = evt.coordinate;
//         const features: any[] = [];
//
//         const projCode = map.getView().getProjection().getCode();
//         if (projCode === "EPSG:3857") {
//             coord = transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
//         }
//
//         map.forEachFeatureAtPixel(pixel, function (feature: any, lyr: any) {
//             feature["layer_name"] = lyr.get("name");
//             feature["layer_title"] = lyr.get("title");
//             features.push(feature);
//         });
//
//         me.getRasterPixelValue(coord, mapVm, targetElem);
//
//         if (features.length > 0) {
//             me.processVectorFeatures(features, mapVm, targetElem);
//         }
//     }
//
//     processVectorFeatures(features: any[], mapVm: any, targetElem: HTMLElement): void {
//         const me = this;
//         const vectorSource = mapVm.selectionLayer.getOlLayer()?.getSource();
//
//         if (!vectorSource) return;
//         vectorSource.clear();
//
//         let feature: any = features[0];
//         if (feature["layer_name"] === "weather_data") {
//             feature = feature.getProperties().features[0];
//         }
//
//         const gType = feature.getGeometry().getType();
//
//         if (gType === "Polygon" && feature.flatCoordinates_) {
//             const inflatedCoordinates = inflateCoordinatesArray(
//                 feature.getFlatCoordinates(),
//                 0,
//                 feature.getEnds(),
//                 2
//             );
//             const polygonFeature = new Feature(new Polygon(inflatedCoordinates as any));
//             polygonFeature.setProperties(feature.getProperties());
//             vectorSource.addFeatures([polygonFeature]);
//         } else if (gType === "LineString" && feature.flatCoordinates_) {
//             const inflatedCoordinates = inflateCoordinatesArray(
//                 feature.getFlatCoordinates(),
//                 0,
//                 feature.getEnds(),
//                 2
//             );
//             const lineFeature = new Feature(new LineString((inflatedCoordinates as any)[0]));
//             lineFeature.setProperties(feature.getProperties());
//             vectorSource.addFeatures([lineFeature]);
//         }
//
//         me.showJsonDataInHTMLTable(feature.getProperties(), "v", targetElem);
//
//         if (Object.prototype.hasOwnProperty.call(feature, "layer_name")) {
//             me.getFeatureDetailFromDB(feature, mapVm, targetElem);
//         }
//     }
//
//     getFeatureDetailFromDB(feature: any, mapVm: any, targetElem: HTMLElement): void {
//         try {
//             const me = this;
//             const row = feature.getProperties();
//             const uuid = feature["layer_name"];
//             const daLayer = mapVm.getDALayer(uuid);
//
//             if (daLayer.layerInfo.format !== "WFS") {
//                 mapVm
//                     .getApi()
//                     .get(MapAPIs.DCH_FEATURE_DETAIL, {
//                         uuid: feature["layer_name"],
//                         col_name: "id",
//                         col_val: row["id"],
//                     })
//                     .then((payload: any) => {
//                         if (payload) {
//                             payload["layer"] = feature["layer_title"];
//                             me.showJsonDataInHTMLTable(payload, "v", targetElem);
//                         } else {
//                             me.showJsonDataInHTMLTable(row, "v", targetElem);
//                         }
//                     })
//                     .catch((error: unknown) => {
//                         console.error(error);
//                     });
//             }
//         } catch (e) {
//             console.error(e);
//         }
//     }
//
//     getRasterPixelValue(coord: number[], mapVM: any, targetElem: HTMLElement): void {
//         const me = this;
//
//         Object.keys(mapVM.xyzLayer).forEach((key) => {
//             const olLayer = mapVM.xyzLayer[key].olLayer;
//
//             if (olLayer.getSource() instanceof XYZ) {
//                 const layer_name = olLayer.get("name");
//                 const layer_title = olLayer.get("title");
//
//                 mapVM
//                     .getApi()
//                     .get(MapAPIs.DCH_LAYER_PIXEL_VALUE, {
//                         uuid: layer_name,
//                         long: coord[0],
//                         lat: coord[1],
//                     })
//                     .then((payload: any) => {
//                         if (payload) {
//                             const obj = { layer: layer_title, value: payload };
//                             me.showJsonDataInHTMLTable(obj, "raster", targetElem);
//                         }
//                     })
//                     .catch((error: unknown) => {
//                         console.error(error);
//                     });
//             }
//         });
//     }
//
//     getRasterAreaFromDB(
//         polygonJsonStr: string,
//         rasterLayers: any[],
//         mapVM: any,
//         targetElem: HTMLElement
//     ): void {
//         const me = this;
//         const layer_name = rasterLayers[0].get("name");
//
//         mapVM
//             .getApi()
//             .get(MapAPIs.DCH_RASTER_AREA, {
//                 uuid: layer_name,
//                 geojson_str: polygonJsonStr,
//             })
//             .then((payload: any) => {
//                 if (payload) {
//                     me.showAreaInRightDraw(payload, targetElem);
//                 }
//             })
//             .catch((error: unknown) => {
//                 console.error(error);
//             });
//     }
//
//     showJsonDataInHTMLTable(
//         myObj: GenericObject,
//         lyrType: "v" | "raster",
//         targetElem: HTMLElement
//     ): void {
//         let table = "<table> ";
//
//         for (const key in myObj) {
//             table +=
//                 "<tr><td>" +
//                 key.toUpperCase() +
//                 "</td> <td>" +
//                 myObj[key] +
//                 "</td></tr>";
//         }
//
//         table += "</table>";
//
//         const acc = document.getElementsByClassName("accordion");
//         let index = 1;
//
//         if (lyrType === "raster") {
//             index = 0;
//         }
//
//         if (acc.length > 0 && acc[index]) {
//             (acc[index] as HTMLElement).innerHTML = myObj["layer"];
//             ((acc[index] as HTMLElement).nextElementSibling as HTMLElement).innerHTML = table;
//         } else {
//             targetElem.innerHTML = table;
//         }
//     }
//
//     addAccordionsToRightDraw(htmlElem: HTMLElement): void {
//         const div = document.createElement("div");
//
//         const accordian1 =
//             '<button class="accordion">Raster Layer</button>\n' +
//             '<div class="panel">No Raster Layer Clicked</div>';
//
//         const accordian2 =
//             '<button class="accordion"> Vector Layer</button>\n' +
//             '<div class="panel">For values clcik on feature, please</div>';
//
//         div.append(accordian1);
//         div.append(accordian2);
//
//         htmlElem.innerHTML = div.innerText;
//
//         const acc = document.getElementsByClassName("accordion");
//
//         for (let i = 0; i < acc.length; i++) {
//             acc[i].addEventListener("click", function (this: HTMLElement) {
//                 this.classList.toggle("active");
//                 const panel = this.nextElementSibling as HTMLElement | null;
//
//                 if (!panel) return;
//
//                 panel.style.display =
//                     panel.style.display === "block" ? "none" : "block";
//             });
//         }
//     }
//
//     getRasterLayers(mapVM: any): any[] {
//         const rasterLayers: any[] = [];
//
//         Object.keys(mapVM.xyzLayer).forEach((key) => {
//             const olLayer = mapVM.xyzLayer[key].olLayer;
//             if (olLayer.getSource() instanceof XYZ) {
//                 rasterLayers.push(olLayer);
//             }
//         });
//
//         return rasterLayers;
//     }
//
//     getRasterAreaFromPolygon(mapVM: any, targetElem: HTMLElement, feature: any): void {
//         const me = this;
//         const rasterLayers = me.getRasterLayers(mapVM);
//         const writer = new GeoJSON();
//         const polygonJsonStr = writer.writeFeatures([feature]);
//
//         if (rasterLayers.length > 0) {
//             me.getRasterAreaFromDB(polygonJsonStr, rasterLayers, mapVM, targetElem);
//         }
//     }
//
//     showAreaInRightDraw(arrData: Array<{ pixel: string | number; area: number }>, targetElem: HTMLElement): void {
//         const me = this;
//         const div = document.createElement("div");
//
//         let table = "<table><tr><th>Class</th><th>Area (m^2)</th></tr> ";
//         for (let i = 0; i < arrData.length; i++) {
//             const obj = arrData[i];
//             table += "<tr><td>" + obj["pixel"] + "</td> <td>" + obj["area"] + "</td></tr>";
//         }
//         table += "</table>";
//
//         div.append(table);
//
//         const footr =
//             '<div class="footer_div"><button id="btnShowChart" type="button" class="myButton">Show Chart</button></div>';
//
//         div.append(footr);
//         targetElem.innerHTML = div.innerText;
//
//         const data = arrData.map((row) => ({
//             name: row.pixel,
//             y: row.area,
//         }));
//
//         const btn = document.getElementById("btnShowChart");
//         if (btn) {
//             btn.onclick = () => {
//                 me.mapVm.getDialogBoxRef().current.openDialog({
//                     title: "Area Chart",
//                     content: (
//                         <div style={{ width: 600 }}>
//                             <DAChart chartData={data} />
//                         </div>
//                     ),
//                     actions: <p />,
//                 });
//             };
//         }
//     }
// }
//
// export default MapControls;
