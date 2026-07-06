import {
    IFeatureStyle,
    IGeomStyle,
    ILabelLayerInfo,
    IRule,
    ITextStyle,
} from "@damap/types/typeDeclarations";
import { Fill, Stroke, Style, Text } from "ol/style";
import { getPointShapes } from "@damap/components/map/layer_styling/vector/symbolizer/PointSymbolizer";

import { Feature } from "ol";
// @ts-ignore
import ol_legend_Legend from "ol-ext/legend/Legend";
import { toSize } from "ol/size";
import { unByKey } from "ol/Observable";
import { getVectorContext } from "ol/render";
import { easeOut } from "ol/easing";
import CircleStyle from "ol/style/Circle";
import MapVM from "@damap/components/map/models/MapVM";
import { ColorUtils } from "@damap/damap";


export const DEFAULT_STYLES: Record<string, Style> = {
    Point: new Style({
        image: new CircleStyle({
            radius: 6,
            fill: new Fill({
                color: "rgba(0,153,255,0.7)",
            }),
            stroke: new Stroke({
                color: "#ffffff",
                width: 1.5,
            }),
        }),
    }),

    MultiPoint: new Style({
        image: new CircleStyle({
            radius: 6,
            fill: new Fill({
                color: "rgba(0,153,255,0.7)",
            }),
            stroke: new Stroke({
                color: "#ffffff",
                width: 1.5,
            }),
        }),
    }),

    LineString: new Style({
        stroke: new Stroke({
            color: "#3399CC",
            width: 3,
        }),
    }),

    MultiLineString: new Style({
        stroke: new Stroke({
            color: "#3399CC",
            width: 3,
        }),
    }),

    Polygon: new Style({
        stroke: new Stroke({
            color: "#3399CC",
            width: 2,
        }),
        fill: new Fill({
            color: "rgba(51,153,204,0.25)",
        }),
    }),

    MultiPolygon: new Style({
        stroke: new Stroke({
            color: "#3399CC",
            width: 2,
        }),
        fill: new Fill({
            color: "rgba(51,153,204,0.25)",
        }),
    }),
};

class StylingUtils {
    static normalizeGeomType(
        geomType: string | string[] | undefined
    ): string {
        const raw = Array.isArray(geomType)
            ? geomType[0]
            : geomType;

        if (!raw) return "";

        const g = raw.toString().trim().toLowerCase();

        switch (g) {
            case "polyline":
                return "LineString";

            case "multipolyline":
                return "MultiLineString";

            case "point":
                return "Point";

            case "multipoint":
                return "MultiPoint";

            case "polygon":
                return "Polygon";

            case "multipolygon":
                return "MultiPolygon";

            case "linestring":
                return "LineString";

            case "multilinestring":
                return "MultiLineString";

            default:
                // Unknown geometry → preserve original text
                return raw.toString().trim();
        }
    }
    static createPatternFill(style: IGeomStyle): Fill {
        const fillPattern = style.fillPattern ?? "solid";
        const fillColor = style.fillColor ?? "rgba(27,32,109,0.67)";

        if (fillPattern === "solid") {
            return new Fill({
                color: fillColor,
            });
        }

        const canvas = document.createElement("canvas");
        canvas.width = 12;
        canvas.height = 12;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
            return new Fill({
                color: fillColor,
            });
        }

        ctx.strokeStyle = fillColor;
        ctx.fillStyle = fillColor;
        ctx.lineWidth = 2;

        switch (fillPattern) {
            case "diagonal":
                ctx.beginPath();
                ctx.moveTo(0, 12);
                ctx.lineTo(12, 0);
                ctx.stroke();
                break;

            case "cross":
                ctx.beginPath();
                ctx.moveTo(0, 6);
                ctx.lineTo(12, 6);
                ctx.moveTo(6, 0);
                ctx.lineTo(6, 12);
                ctx.stroke();
                break;

            case "dot":
                ctx.beginPath();
                ctx.arc(6, 6, 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case "horizontal":
                ctx.beginPath();
                ctx.moveTo(0, 6);
                ctx.lineTo(12, 6);
                ctx.stroke();
                break;

            case "vertical":
                ctx.beginPath();
                ctx.moveTo(6, 0);
                ctx.lineTo(6, 12);
                ctx.stroke();
                break;
        }

        const pattern = ctx.createPattern(canvas, "repeat");

        return new Fill({
            color: pattern ?? fillColor,
        });
    }

    static getDefaultStyle(geomType: string): Style {
        const normalizedGeomType = this.normalizeGeomType(geomType);

        return (
            // styles[normalizedGeomType] ||
            DEFAULT_STYLES[normalizedGeomType] ||
            new Style({
                stroke: new Stroke({
                    color: "#3399CC",
                    width: 2,
                }),
                fill: new Fill({
                    color: "rgba(51,153,204,0.2)",
                }),
                image: new CircleStyle({
                    radius: 5,
                    fill: new Fill({
                        color: "#3399CC",
                    }),
                    stroke: new Stroke({
                        color: "#ffffff",
                        width: 1,
                    }),
                }),
            })
        );
    }

    static createOLStyle(
        geomType: string | string[] | undefined,
        style: IGeomStyle | undefined = undefined
    ): Style {
        const normalizedGeomType = this.normalizeGeomType(geomType);

        // console.log("createOLStyle geomType", geomType, "normalized", normalizedGeomType, "style", style);

        if (!style) {
            return this.getDefaultStyle(normalizedGeomType);
        }

        switch (normalizedGeomType) {
            case "Point":
            case "MultiPoint":
                return getPointShapes(style);

            case "Polygon":
            case "MultiPolygon":
                return new Style({
                    stroke: new Stroke({
                        color: style.strokeColor,
                        width: style.strokeWidth,
                        lineDash: style.lineDash,
                        lineDashOffset: style.lineDashOffset,
                        lineCap: style.lineCap,
                        lineJoin: style.lineJoin,
                    }),
                    fill: this.createPatternFill(style),
                    zIndex: style.zIndex,
                });

            case "LineString":
            case "MultiLineString":
                return new Style({
                    stroke: new Stroke({
                        color: style.strokeColor,
                        width: style.strokeWidth,
                        lineDash: style.lineDash,
                        lineDashOffset: style.lineDashOffset,
                        lineCap: style.lineCap,
                        lineJoin: style.lineJoin,
                    }),
                    zIndex: style.zIndex,
                });

            default:
                return this.getDefaultStyle(normalizedGeomType);
        }
    }

    static vectorStyleFunction(
        feature: Feature,
        featureStyle: IFeatureStyle
    ): Style | undefined {
        let style: IGeomStyle | undefined;
        let rules: IRule[] = [];
        let properties: any;

        const type = featureStyle?.type || "";

        switch (type) {
            case "single":
                style = featureStyle?.style?.default;
                break;

            case "multiple":
                style = featureStyle?.style?.default;
                rules = featureStyle?.style?.rules || [];
                properties = feature.getProperties();

                rules.forEach((rule: IRule) => {
                    if (
                        rule?.filter?.field &&
                        rule.filter.field in properties &&
                        properties[rule.filter.field] === rule.filter.value
                    ) {
                        style = rule.style;
                    }
                });
                break;

            case "density":
                rules = featureStyle?.style?.rules || [];
                properties = feature.getProperties();

                rules.forEach((rule: IRule) => {
                    if (rule?.filter?.field && rule.filter.field in properties) {
                        const value = properties[rule.filter.field];

                        if (
                            Array.isArray(rule.filter.value) &&
                            rule.filter.value[0] <= value &&
                            rule.filter.value[1] >= value
                        ) {
                            style = rule.style;
                        }
                    }
                });
                break;

            case "sld":
            default:
                break;
        }

        return this.createOLStyle(
            feature.getGeometry()?.getType() || "",
            style
        );
    }

    static addLegendGraphic(
        layer: any,
        featureStyle: IFeatureStyle,
        geomType: string,
        iconSize: [number, number] = [25, 10]
    ) {
        const styleType = featureStyle?.type || "single";
        geomType = this.normalizeGeomType(geomType);

        const sizeString = import.meta.env.VITE_LEGEND_ICON_SIZE;

        if (sizeString) {
            try {
                const parsed = JSON.parse(sizeString);
                if (Array.isArray(parsed) && parsed.length === 2) {
                    iconSize = [Number(parsed[0]), Number(parsed[1])];
                }
            } catch {
                console.warn("VITE_LEGEND_ICON_SIZE is not a valid JSON array");
            }
        }

        switch (styleType) {
            case "single": {
                const fStyle = this.createOLStyle(
                    geomType,
                    featureStyle?.style?.default
                );

                const img = ol_legend_Legend.getLegendImage({
                    feature: undefined,
                    margin: 4,
                    size: toSize(iconSize),
                    textStyle: undefined,
                    style: fStyle,
                    typeGeom: geomType,
                });

                layer.legend = { sType: "canvas", graphic: img };
                break;
            }

            case "multiple":
            case "density": {
                const rules: IRule[] = featureStyle?.style?.rules || [];

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    layer.legend = { sType: "canvas", graphic: canvas };
                    break;
                }

                const paddingX = 18;
                const paddingY = 16;
                const rowGap = 26;
                const lineWidth = 60;
                const textGap = 16;
                const startY = paddingY + 6;

                canvas.width = 260;
                canvas.height = Math.max(
                    100,
                    paddingY * 2 + rules.length * rowGap
                );

                const radius = 12;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#f2f3f7";
                ctx.strokeStyle = "#d8dbe3";
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.moveTo(radius, 0);
                ctx.lineTo(canvas.width - radius, 0);
                ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
                ctx.lineTo(canvas.width, canvas.height - radius);
                ctx.quadraticCurveTo(
                    canvas.width,
                    canvas.height,
                    canvas.width - radius,
                    canvas.height
                );
                ctx.lineTo(radius, canvas.height);
                ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
                ctx.lineTo(0, radius);
                ctx.quadraticCurveTo(0, 0, radius, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                rules.forEach((rule, index) => {
                    const y = startY + index * rowGap;

                    const strokeColor = rule?.style?.strokeColor || "#999";
                    const strokeWidth = rule?.style?.strokeWidth || 4;
                    const lineY = y + 1;

                    ctx.beginPath();
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = strokeWidth;
                    ctx.lineCap = rule?.style?.lineCap || "butt";

                    if (rule?.style?.lineDash?.length) {
                        ctx.setLineDash(rule.style.lineDash);
                    } else {
                        ctx.setLineDash([]);
                    }

                    ctx.moveTo(paddingX + 8, lineY);
                    ctx.lineTo(paddingX + 8 + lineWidth, lineY);
                    ctx.stroke();

                    ctx.font = "bold 13px sans-serif";
                    ctx.fillStyle = "#222";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";

                    ctx.fillText(
                        rule.title?.toString() || "",
                        paddingX + 8 + lineWidth + textGap,
                        lineY
                    );
                });

                layer.legend = { sType: "canvas", graphic: canvas };
                break;
            }
        }
    }

    static flash(feature: Feature, mapVM: MapVM) {
        const geometry = feature.getGeometry();

        if (!geometry) return;

        const flashGeom = geometry.clone();

        const start = Date.now();
        const baseLayer = mapVM.getBaseLayer();

        const listenerKey = baseLayer?.on("postrender", animate);
        const duration = 3000;

        function animate(event: any) {
            const frameState = event.frameState;
            const elapsed = frameState.time - start;

            if (elapsed >= duration) {
                if (listenerKey) {
                    unByKey(listenerKey);
                }
                return;
            }

            const vectorContext = getVectorContext(event);
            const elapsedRatio = elapsed / duration;
            const radius = easeOut(elapsedRatio) * 25 + 5;
            const opacity = easeOut(1 - elapsedRatio);

            const style = new Style({
                image: new CircleStyle({
                    radius,
                    stroke: new Stroke({
                        color: `rgba(255, 0, 0, ${opacity})`,
                        width: 0.25 + opacity,
                    }),
                }),
            });

            vectorContext.setStyle(style);
            vectorContext.drawGeometry(flashGeom);
            mapVM.getMap().render();
        }
    }

    static getTextStyle(
        label: string,
        fillColor: string,
        textStyle?: ITextStyle
    ): Text {
        const font = textStyle?.font || "14px Calibri,sans-serif";
        const strokeColor = textStyle?.strokeColor || "#fff";
        const strokeWidth = textStyle?.strokeWidth ?? 2;
        const offsetX = textStyle?.offsetX ?? 0;
        const offsetY = textStyle?.offsetY ?? 0;
        const placement = textStyle?.placement || "point";
        const fillTextColor =
            textStyle?.fillColor ||
            ColorUtils.getContrastingTextColorHex(fillColor);

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

    static applyLabelStyle(
        styled: Style,
        baseStyle: Style,
        feature: Feature,
        mapVM: MapVM,
        labelInfo: ILabelLayerInfo,
        resolution?: number
    ): Style {
        const {
            showLabel,
            labelProperty,
            textStyle,
            minLabelZoom,
            maxLabelZoom,
        } = labelInfo;

        if (!showLabel || !labelProperty) {
            styled.setText(null as unknown as Text);
            return styled;
        }

        const map = mapVM.getMap();
        const view = map?.getView();

        let zoom: number | undefined;

        if (view && resolution !== undefined) {
            if ((view as any).getZoomForResolution) {
                const z = (view as any).getZoomForResolution(resolution);
                zoom = z ?? view.getZoom();
            } else {
                zoom = view.getZoom();
            }
        } else {
            zoom = view?.getZoom();
        }

        if (zoom !== undefined) {
            const minZ = minLabelZoom ?? -Infinity;
            const maxZ = maxLabelZoom ?? Infinity;

            if (zoom < minZ || zoom > maxZ) {
                styled.setText(undefined as unknown as Text);
                return styled;
            }
        }

        const label = feature.get(labelProperty);

        if (
            label !== undefined &&
            label !== null &&
            String(label).trim() !== ""
        ) {
            const fillColor =
                baseStyle.getFill()?.getColor()?.toString() ?? "#000";

            styled.setText(
                StylingUtils.getTextStyle(
                    String(label),
                    fillColor,
                    textStyle || {}
                )
            );
        } else {
            styled.setText(undefined as unknown as Text);
        }

        return styled;
    }
}

export default StylingUtils;