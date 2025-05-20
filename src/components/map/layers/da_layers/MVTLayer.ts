import MVT from "ol/format/MVT";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import AbstractDALayer from "./AbstractDALayer";
import MapApi, {MapAPIs} from "@/api/MapApi";
import TileGrid from "ol/tilegrid/TileGrid";
import {get as getProjection} from "ol/proj";
import {formatYmdDate} from "@/components/map/time_slider/TimeSliderControl";

/*****
 *  url format for MVT
 */

class MVTLayer extends AbstractDALayer {
    setLayer() {
        const me = this;
        const {title, uuid} = this.layerInfo || {};
        const declutter =
            this.layerInfo.layerSetting && "declutter" in this.layerInfo.layerSetting
                ? this.layerInfo.layerSetting["declutter"] === "true"
                : true;
        this.layer = new VectorTileLayer({
            //@ts-ignore
            name: uuid,
            title: title,
            show_progress: true,
            visible: true,
            source: this.getDataSource(),
            //@ts-ignore
            style: this?.vectorStyleFunction?.bind(me),
            declutter: declutter,
        });
        this.setSlDStyleAndLegendToLayer();
    }

    getDataSource(): VectorTileSource {
        // @ts-ignore
        return super.getDataSource();
    }

    tileUrlFunction(tileCoord: any) {
        let url = `${this.getDataURL()}{tileSize}/{z}/{x}/{y}/?${this.urlParams}`;
        let cols: string[] = [];
        if (
            this.style &&
            this.style.type !== "single" &&
            this.style.type !== "sld"
        ) {
            this.style?.style?.rules?.forEach((rule) => {
                const s = rule?.filter?.field;
                s && cols.push(s);
            });
            cols = cols.filter((v, i, a) => a.indexOf(v) === i);
            if (cols.length > 0) url = url + "cols=" + String(cols);
        }
        // Calculation of tile urls for zoom levels 1, 3, 5, 7, 9, 11, 13, 15.
        let finalUrl = url
            .replace("{tileSize}", String(this.tileSize))
            .replace("{z}", String(tileCoord[0] * 2 - 1))
            // .replace("{z}", String(tileCoord[0]))
            .replace("{x}", String(tileCoord[1]))
            .replace("{y}", String(tileCoord[2]));

        if (url.includes("{uuid}") && this.layerInfo.uuid) {
            finalUrl = finalUrl.replace("{uuid}", this.layerInfo.uuid);
        }
        console.log("final url", finalUrl)

        return finalUrl;

    }

    getDataURL() {
        let apiURL;
        if (this.layerInfo.dataURL) {
            apiURL = this.layerInfo.dataURL;
            return MapApi.getURL(apiURL);
        } else {
            apiURL = MapAPIs.DCH_LAYER_MVT;
            return MapApi.getURL(apiURL, {uuid: this.layerInfo.uuid});
        }
    }

    setAdditionalUrlParams(params: string) {
        this.mapVM.getMapLoadingRef()?.current?.openIsLoading();
        // let url = this.getDataURL();
        super.setAdditionalUrlParams(params);
        // const source: VectorTileSource = this.layer.getSource();
        // url = `${url}{z}/{x}/{y}/?${this.urlParams}&`;
        // source.setUrl(url);
        // console.log(url)
        setTimeout(
            () => this.mapVM.getMapLoadingRef()?.current?.closeIsLoading(),
            100
        );
    }

    refreshLayer() {
        super.refreshLayer();
    }

    setResolutions() {
        // Calculation of resolutions that match zoom levels 1, 3, 5, 7, 9, 11, 13, 15.
        for (let i = 0; i <= 8; ++i) {
            this.resolutions.push(156543.03392804097 / Math.pow(2, i * 2));
        }
    }

    setDataSource() {
        if (this.resolutions.length === 0) {
            this.setResolutions();
        }

        this.dataSource = new VectorTileSource({
            format: new MVT(),
            // url: `${this.getDataURL()}{z}/{x}/{y}/?${this.urlParams}`,
            attributions: "Digital Arz MVT Layer",
            tileGrid: new TileGrid({
                extent: getProjection("EPSG:3857")?.getExtent() || [
                    -Math.PI * 6378137,
                    -Math.PI * 6378137,
                    Math.PI * 6378137,
                    Math.PI * 6378137,
                ],
                resolutions: this.resolutions,
                tileSize: this.tileSize
                // tileSize:this._tileSize
            }),
            tileUrlFunction: this.tileUrlFunction,
        });
    }


    updateTemporalData(date: Date) {
        const params = "date=" + formatYmdDate(date);
        this.setAdditionalUrlParams(params);
        this.refreshLayer();
    }
}

export default MVTLayer;
