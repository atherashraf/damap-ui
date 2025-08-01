import {IFeatureStyle, IGeomStyle, IRule, ITextStyle} from "@/types/typeDeclarations";
import {Fill, Stroke, Style, Text} from "ol/style";
import {getPointShapes} from "@/components/map/layer_styling/vector/symbolizer/PointSymbolizer";
import {styles} from "./styles";
import {Feature} from "ol";
//@ts-ignore
import ol_legend_Legend from "ol-ext/legend/Legend";
import {toSize} from "ol/size";
import {unByKey} from "ol/Observable";
import {getVectorContext} from "ol/render";
import {easeOut} from "ol/easing";
import CircleStyle from "ol/style/Circle";
import MapVM from "@/components/map/models/MapVM";
import {ColorUtils} from "@/damap";


class StylingUtils {
    static createOLStyle(
        geomType: string,
        style: IGeomStyle | undefined = undefined
    ) {
        // const geomType = feature.getGeometry().getType();
        let featureStyle: Style | undefined = undefined;
        if (style) {
            switch (geomType) {
                case "Point":
                case "MultiPoint":
                    featureStyle = getPointShapes(style);
                    break;
                case "Polygon":
                case "MultiPolygon":
                    featureStyle = new Style({
                        stroke: new Stroke({
                            color: style.strokeColor,
                            width: style.strokeWidth,
                        }),
                        fill: new Fill({
                            color: style.fillColor, //"rgba(255, 255, 0, 0.1)"
                        }),
                    });
                    break;
                case "MultiLineString":
                case "LineString":
                    featureStyle = new Style({
                        stroke: new Stroke({
                            color: style.strokeColor,
                            width: style.strokeWidth,
                        }),
                    });
                    break;
            }
        } else {
            // @ts-ignore
            featureStyle = styles[geomType];
        }

        return featureStyle;
    }


    static vectorStyleFunction(
        feature: Feature,
        featureStyle: IFeatureStyle
    ): Style {
        // return styles[feature.getGeometry().getType()];
        let style: IGeomStyle;
        let rules: IRule[];
        let properties: any;
        const type = featureStyle?.type || "";
        switch (type) {
            case "single":
                //@ts-ignore
                style = featureStyle["style"]["default"];
                break;
            case "multiple":
                //@ts-ignore
                style = featureStyle["style"]["default"];
                //@ts-ignore
                rules = featureStyle.style.rules;
                properties = feature.getProperties();
                rules.forEach((rule: IRule) => {
                    //@ts-ignore
                    if (
                        //@ts-ignore
                        rule?.filter?.field in properties &&
                        //@ts-ignore
                        properties[rule?.filter?.field] === rule?.filter?.value
                    ) {
                        style = rule.style;
                    }
                });

                break;
            case "density":
                // style = this.style["style"]["default"];
                //@ts-ignore
                rules = featureStyle?.style?.rules;
                properties = feature.getProperties();
                rules.forEach((rule: IRule) => {
                    //@ts-ignore
                    if (rule?.filter?.field in properties) {
                        //@ts-ignore
                        const x = properties[rule?.filter?.field];
                        //@ts-ignore
                        if (rule?.filter?.value[0] <= x && rule?.filter?.value[1] >= x) {
                            style = rule.style;
                        }
                    }
                });
                break;
            case "sld":
                break;
            default:
                break;
        }
        //@ts-ignore
        return this.createOLStyle(feature?.getGeometry()?.getType(), style);
    }

    static addLegendGraphic(
        layer: any,
        featureStyle: IFeatureStyle,
        geomType: string,
        iconSize: [number, number] = [30, 15]
    ) {
        const styleType = featureStyle?.type || "single";

        const sizeString = import.meta.env.VITE_LGEGEND_ICON_SIZE;

        if (sizeString) {
            try {
                const parsed = JSON.parse(sizeString);
                if (Array.isArray(parsed) && parsed.length === 2) {
                    iconSize = [Number(parsed[0]), Number(parsed[1])];
                }
            } catch (e) {
                console.warn("VITE_LEGEND_ICON_SIZE is not a valid JSON array");

            }
        } else {
        }

        switch (styleType) {
            case "single":
                const fStyle = this.createOLStyle(
                    geomType,
                    featureStyle?.style?.default
                );
                const img = ol_legend_Legend.getLegendImage({
                    feature: undefined,
                    margin: geomType === "Point" ? 5 : 0,
                    // properties: undefined,
                    size: toSize(iconSize),
                    //@ts-ignore
                    textStyle: undefined,
                    //@ts-ignore
                    title: "",
                    //@ts-ignore
                    style: fStyle,
                    typeGeom: geomType,
                    className: "",
                });
                layer.legend = {sType: "canvas", graphic: img};
                // this.mapVM.legendPanel.refresh()
                break;
            case "multiple":
            case "density":
                const rules = featureStyle.style.rules;
                let canvas: HTMLCanvasElement = document.createElement("canvas");
                canvas.width = 400;
                //@ts-ignore
                // canvas.height = iconSize[1] * rules?.length * 5;
                // const itemHeight = Math.max(iconSize[1], 10); // Ensure at least 25px per item
                // const verticalSpacing = itemHeight + 5; // 10px padding
                const verticalSpacing = (iconSize[0] + 10)
                canvas.height = verticalSpacing * ((rules?.length || 1) + 10) + 10;


                rules?.forEach((rule: IRule, index) => {
                    const fStyle = this.createOLStyle(geomType, rule.style);
                    fStyle?.setText(new Text({
                        text: rule.title?.toString(),
                        font: "bold 13px sans-serif",
                        textAlign: "left",
                        offsetX: iconSize[0] + 1,
                        fill: new Fill({color: "#000"}), // ensure visible text
                    }))

                    canvas = ol_legend_Legend.getLegendImage({
                            margin: 10,
                            style: fStyle,
                            typeGeom: geomType,
                            className: "",
                        },
                        canvas,
                        // index * (iconSize[0] + 10)
                        index * verticalSpacing
                    );
                });


                layer.legend = {sType: "canvas", graphic: canvas};

        }
    }

    static flash(feature: Feature, mapVM: MapVM) {
        const start = Date.now();
        //@ts-ignore
        const flashGeom = feature.getGeometry().clone();
        const baseLayer = mapVM.getBaseLayer()

        const listenerKey = baseLayer?.on('postrender', animate);
        const duration = 3000

        function animate(event: any) {
            const frameState = event.frameState;
            const elapsed = frameState.time - start;
            if (elapsed >= duration) {
                unByKey(listenerKey);
                return;
            }
            const vectorContext = getVectorContext(event);
            const elapsedRatio = elapsed / duration;
            // radius will be 5 at start and 30 at end.
            const radius = easeOut(elapsedRatio) * 25 + 5;
            const opacity = easeOut(1 - elapsedRatio);

            const style = new Style({
                image: new CircleStyle({
                    radius: radius,
                    stroke: new Stroke({
                        color: 'rgba(255, 0, 0, ' + opacity + ')',
                        width: 0.25 + opacity,
                    }),
                }),
            });

            vectorContext.setStyle(style);
            vectorContext.drawGeometry(flashGeom);
            // tell OpenLayers to continue postrender animation
            mapVM.getMap().render();
        }
    }


    static getTextStyle(label: string, fillColor: string, textStyle?: ITextStyle): Text {
        const font = textStyle?.font || '14px Calibri,sans-serif';
        const strokeColor = textStyle?.strokeColor || '#fff';
        const strokeWidth = textStyle?.strokeWidth ?? 2;
        const offsetX = textStyle?.offsetX ?? 0;
        const offsetY = textStyle?.offsetY ?? 0;
        const placement = textStyle?.placement || 'point';
        const fillTextColor = textStyle?.fillColor || ColorUtils.getContrastingTextColorHex(fillColor);

        return new Text({
            text: label,
            font,
            fill: new Fill({ color: fillTextColor }),
            stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
            offsetX,
            offsetY,
            placement,
            overflow: true,
        });
    }

}

export default StylingUtils;
