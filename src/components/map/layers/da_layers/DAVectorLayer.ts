import AbstractDALayer from "./AbstractDALayer";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import {IGeoJSON} from "@/types/typeDeclarations";
import  {MapAPIs} from "@/api/MapApi";
import pako from "pako";

import {WKT} from "ol/format";
import {formatYmdDate} from "@/components/map/time_slider/TimeSliderControl";
import {Feature} from "ol";

class DAVectorLayer extends AbstractDALayer {
    setLayer() {
        const {title, uuid} = this.layerInfo || {};
        const declutter =
            this.layerInfo?.layerSetting?.declutter
                ? this.layerInfo.layerSetting["declutter"] === "true"
                : true;
        this.layer = new VectorLayer({
            //@ts-ignore
            name: uuid,
            title: title,
            show_progress: true,
            visible: true,
            source: this.getDataSource(),
            //@ts-ignore
            style: this?.vectorStyleFunction?.bind(this),
            declutter: declutter,
        });
        this.setSlDStyleAndLegendToLayer();
        this.fetchFeatures();
    }

    fetchFeatures() {
        this.mapVM?.getMapLoadingRef()?.current?.openIsLoading()
        this.mapVM
            .getApi()
            .get(MapAPIs.DCH_LAYER_WFS, {
                uuid: this.layerInfo.uuid,
                format: "geojson",
            })
            .then((payload: any) => {
                if (payload) {

                    const binaryData = atob(payload);
                    const uint8ArrayData = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        uint8ArrayData[i] = binaryData.charCodeAt(i);
                    }
                    // Unzip the data using pako
                    const unzippedData = pako.inflate(uint8ArrayData, {to: "string"});
                    const data = JSON.parse(unzippedData);
                    this.addGeojsonFeature(data);
                }
            }).catch((e) => {
            console.error(e)
        }).finally(()=>{
            this.mapVM?.getMapLoadingRef()?.current?.closeIsLoading()
        })
    }

    getSource() {
        return this.dataSource;
    }

    clearSelection() {
        this.getSource().clear();
    }

    addGeojsonFeature(geojson: IGeoJSON, clearPreviousSelection: boolean = true) {
        if (clearPreviousSelection) {
            this.clearSelection();
        }
        const features = new GeoJSON({
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
        }).readFeatures(geojson);
        this.getSource().addFeatures(features);
    }

    addWKTFeature(wkt: string, clearPreviousSelection: boolean = true) {
        if (clearPreviousSelection) {
            this.clearSelection();
        }
        const features = new WKT().readFeatures(wkt);
        this.getSource().addFeatures(features);
    }

    setDataSource() {
        super.setDataSource();
        this.dataSource = new VectorSource();
    }

    getDataSource(): VectorSource {
        // @ts-ignore
        return super.getDataSource();
    }

    // setAdditionalUrlParams(params: string) {
    //     this.mapVM.getMapLoadingRef()?.current?.openIsLoading();
    //     let url = this.getDataURL();
    //     super.setAdditionalUrlParams(params);
    //     const source: VectorTileSource = this.layer.getSource();
    //     url = `${url}/?${this.urlParams}&`
    //     console.log(url)
    //     source.setUrl(url);
    //
    //     setTimeout(() => this.mapVM.getMapLoadingRef()?.current?.closeIsLoading(), 500);
    // }
    // getFeatures(){
    //     return this.getSource().get
    // }
    findFeature(col_name: string, col_value: any): Feature | null {
        return this.getSource()
            ?.getFeatures()
            ?.find((feat: Feature) => feat.get(col_name) === col_value);
    }

    zoomToFeatures() {
        if (this.getSource().getFeatures().length > 0) {
            const extent = this.getSource().getExtent();
            this.mapVM.zoomToExtent(extent);
        } else {
            this.mapVM.showSnackbar("Please select feature before zoom to");
        }
    }

    updateTemporalData(date: Date) {
        if (date.toString() !== "Invalid Date") {
            const params = "date=" + formatYmdDate(date);
            const apiURL = this.layerInfo.dataURL;
            const url = apiURL + "?" + params;
            if (url) {
                this.mapVM
                    .getApi()
                    .get(url)
                    .then((payload: any) => {
                        payload.forEach((item: any) => {
                            const feature = this.findFeature("id", item["id"]);
                            feature?.setProperties(item, true);
                        });
                        this.layer.changed();
                    });
            }
        }
    }
}

export default DAVectorLayer;
