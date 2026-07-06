import MVT from "ol/format/MVT";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import AbstractDALayer from "./AbstractDALayer";
import MapApi, { MapAPIs } from "@damap/api/MapApi";
import TileGrid from "ol/tilegrid/TileGrid";
import { get as getProjection } from "ol/proj";
import { formatYmdDate } from "@damap/components/map/time_slider/TimeSliderControl";
import { ILayerInfo, ITextStyle } from "@/libs/damap";
import { ILabelableLayer, ILabelLayerInfo } from "@damap/types/typeDeclarations";
import StylingUtils from "@damap/components/map/layer_styling/utils/StylingUtils";
import {Style} from "ol/style";
import {Feature} from "ol";

export type IMVTLayerInfo = ILayerInfo & ILabelLayerInfo;
interface FieldInfo {
    name: string;
    d_type: string;
}
/*****
 *  url format for MVT
 */
class MVTLayer extends AbstractDALayer implements ILabelableLayer {
    declare layerInfo: IMVTLayerInfo;

    private cacheVersion = Date.now();

    setLayer() {
        const { title, uuid } = this.layerInfo || {};
        const declutter =
            this.layerInfo.layerSetting && "declutter" in this.layerInfo.layerSetting
                ? this.layerInfo.layerSetting["declutter"] === "true"
                : true;

        this.layer = new VectorTileLayer({
            name: uuid,
            uuid: uuid,
            title: title,
            show_progress: true,
            visible: true,
            source: this.getDataSource(),
            //@ts-ignore
            style: this?.vectorStyleFunction?.bind(this),
            declutter: declutter,
            extent: this.layerInfo.extent3857 ?? this.mapVM?.mapExtent ?? undefined,
        });

        this.setSlDStyleAndLegendToLayer();
        this.layer.set("da_ready", true);
    }


    vectorStyleFunction(feature: Feature, resolution?: number): Style {
        const geomType = StylingUtils.normalizeGeomType(
            feature.getGeometry()?.getType() || ""
        );

        const baseStyle =
            StylingUtils.vectorStyleFunction(feature, this.style) ||
            StylingUtils.getDefaultStyle(geomType);
        const styled = baseStyle.clone() ;

        return StylingUtils.applyLabelStyle(
            styled,
            baseStyle,
            feature,
            this.mapVM,
            this.layerInfo,
            resolution
        );
    }

    getDataSource(): VectorTileSource {
        // @ts-ignore
        return super.getDataSource();
    }

    setShowLabel(showLabel: boolean) {
        this.layerInfo.showLabel = showLabel;
        this.refreshLayer();
    }

    getShowLabel(): boolean | undefined {
        return this.layerInfo.showLabel;
    }

    setLabelProperty(labelProperty: string) {
        this.layerInfo.labelProperty = labelProperty || "";
    }

    getLabelProperty(): string | undefined {
        return this.layerInfo.labelProperty;
    }

    setTextStyle(textStyle: ITextStyle) {
        this.layerInfo.textStyle = textStyle;
    }

    getTextStyle(): ITextStyle | undefined {
        return this.layerInfo.textStyle;
    }

    updateLabelOptions(
        labelProperty: string,
        textStyle?: ITextStyle,
        showLabel?: boolean,
        minLabelZoom?: number,
        maxLabelZoom?: number
    ) {
        this.layerInfo.labelProperty = labelProperty || "";

        if (textStyle) {
            this.layerInfo.textStyle = textStyle;
        }

        if (showLabel !== undefined) {
            this.layerInfo.showLabel = showLabel;
        } else {
            this.layerInfo.showLabel = !this.layerInfo.showLabel;
        }

        if (minLabelZoom !== undefined) {
            this.layerInfo.minLabelZoom = minLabelZoom;
        }

        if (maxLabelZoom !== undefined) {
            this.layerInfo.maxLabelZoom = maxLabelZoom;
        }

        this.refreshLayer();
    }

    async getAttributeList(): Promise<string[]> {
        try {
            const payload = await this.mapVM
                .getApi()
                .get(MapAPIs.DCH_LAYER_FIELDS, { uuid: this.layerInfo.uuid });

            return (payload || [])
                .map((field:FieldInfo) => field.name)
                .filter(Boolean);
        } catch (error) {
            console.error("Failed to get MVT layer fields", error);
            this.mapVM.showSnackbar("Failed to load layer fields");
            return [];
        }
    }

    tileUrlFunction(tileCoord: any) {
        let url = `${this.getDataURL()}{tileSize}/{z}/{x}/{y}?${this.urlParams}`;

        let cols: string[] = [];

        if (
            this.style &&
            this.style.type !== "single" &&
            this.style.type !== "sld"
        ) {
            this.style?.style?.rules?.forEach((rule) => {
                const s = rule?.filter?.field;
                if (s) cols.push(s);
            });
        }

        if (this.layerInfo.showLabel && this.layerInfo.labelProperty) {
            cols.push(this.layerInfo.labelProperty);
        }

        cols = [...new Set(cols.filter(Boolean))];

        if (cols.length > 0) {
            url += cols.map((c) => `&cols=${encodeURIComponent(c)}`).join("");
        }

        let finalUrl = url
            .replace("{tileSize}", String(this.tileSize))
            .replace("{z}", String(tileCoord[0] * 2 - 1))
            .replace("{x}", String(tileCoord[1]))
            .replace("{y}", String(tileCoord[2]));

        if (url.includes("{uuid}") && this.layerInfo.uuid) {
            finalUrl = finalUrl.replace("{uuid}", this.layerInfo.uuid);
        }

        const cacheBuster = `&_v=${this.cacheVersion}`;
        return finalUrl + cacheBuster;
    }

    getDataURL() {
        let apiURL;
        if (this.layerInfo.dataURL) {
            apiURL = this.layerInfo.dataURL;
            return MapApi.getURL(apiURL);
        } else {
            apiURL = MapAPIs.DCH_LAYER_MVT;
            return MapApi.getURL(apiURL, { uuid: this.layerInfo.uuid });
        }
    }

    setAdditionalUrlParams(params: string) {
        this.mapVM.getMapLoadingRef()?.current?.openIsLoading();
        super.setAdditionalUrlParams(params);

        setTimeout(
            () => this.mapVM.getMapLoadingRef()?.current?.closeIsLoading(),
            100
        );
    }

    refreshLayer() {
        this.cacheVersion = Date.now();
        this.layer?.getSource()?.refresh();
    }

    setResolutions() {
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
            attributions: "Digital Arz MVT Layer",
            tileGrid: new TileGrid({
                extent: getProjection("EPSG:3857")?.getExtent() || [
                    -Math.PI * 6378137,
                    -Math.PI * 6378137,
                    Math.PI * 6378137,
                    Math.PI * 6378137,
                ],
                resolutions: this.resolutions,
                tileSize: this.tileSize,
            }),
            tileUrlFunction: this.tileUrlFunction.bind(this),
        });
    }

    updateTemporalData(date: Date) {
        const params = "date=" + formatYmdDate(date);
        this.setAdditionalUrlParams(params);
        this.refreshLayer();
    }
}



export default MVTLayer;
