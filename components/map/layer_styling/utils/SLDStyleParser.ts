import OlParser from "geostyler-openlayers-parser";
import SldParser from "geostyler-sld-parser";
import LegendRenderer from "geostyler-legend/dist/LegendRenderer/LegendRenderer";
import olLegendImage from "ol-ext/legend/Image";
import AbstractDALayer from "@damap/components/map/layers/da_layers/AbstractDALayer";
import VectorLayer from "ol/layer/Vector";
import type { Style } from "geostyler-style";

interface LayerWithLegend extends VectorLayer {
  legend?: {
    sType: string;
    graphic: LegendRenderer;
  };
}

class SLDStyleParser {
  objMvtLayer: AbstractDALayer | null = null;
  legendRenderer: LegendRenderer | null = null;

  constructor(objMvtLayer: AbstractDALayer) {
    this.objMvtLayer = objMvtLayer;
  }
  // private scaleLineDash(style: any, scale = 4): void {
  //   const stroke = style?.getStroke?.();
  //   const dash = stroke?.getLineDash?.();
  //
  //   if (!stroke) return;
  //
  //   if (!dash || dash.length === 0) {
  //     return;
  //   }
  //
  //   stroke.setLineDash(dash.map((value: number) => value * scale));
  // }
  /**
   * Converts SLD text to an OpenLayers style and applies it to the given layer.
   * @param sldText - SLD text to be parsed and applied.
   * @param layer - The OpenLayers layer to apply the parsed style.
   */
  convertSLDTextToOL(sldText: string, layer: LayerWithLegend): void {
    // sldText = sldText.replaceAll("SvgParameter", "CssParameter");
    // console.log("SLD text", sldText);
    const olParser = new OlParser();
    const sldParser = new SldParser();

    (async () => {
      const geostylerStyle = await sldParser.readStyle(sldText);
      const style = geostylerStyle.output as unknown as Style;

      // console.log("GeoStyler style", geostylerStyle);
      const renderer = new LegendRenderer({
        overflow: "group",
        styles: style ? [style] : [],
        hideRect: true,
        iconSize: [100, 50],
        size: [300, 150],
      });

      layer.legend = { sType: "sld", graphic: renderer };
      this.legendRenderer = renderer;

      if (!geostylerStyle.output) {
        return;
      }
      const olStyle = await olParser.writeStyle(style);
      // console.log("ol Style", olStyle);

      const styleFunction = olStyle.output;
      const dashScale = 5;
      if (typeof styleFunction === "function") {
        const safeStyleFunction = (feature: any, resolution: number) => {
          const styles = styleFunction(feature, resolution);
          const styleArray = Array.isArray(styles) ? styles : [styles];


          styleArray.forEach((style: any) => {
            const stroke = style.getStroke?.();
            const dash = stroke?.getLineDash?.();

            // ONLY scale existing dash
            if (dash && dash.length > 0) {
              stroke.setLineDash(
                  dash.map((value: number) => value * dashScale)
              );
            }

            const text = style.getText?.();

            if (text) {
              if (typeof text.getKeepUpright !== "function") {
                text.getKeepUpright = () => false;
              }

              if (typeof text.getDeclutterMode !== "function") {
                text.getDeclutterMode = () => "none";
              }
            }
          });

          return styles;
        };

        layer.setStyle(safeStyleFunction);
      } else {

        const styleObject: any = styleFunction;



        if (styleObject?.getStroke?.()) {
          const stroke = styleObject.getStroke();
          const dash = stroke?.getLineDash?.();

          if (dash) {
            stroke.setLineDash(dash.map((value: number) => value * dashScale));
          }

          console.log("stroke dash", stroke.getLineDash());
        }

        layer.setStyle(styleObject as any);

      }

      layer.changed();
      layer.getSource()?.refresh();

      const legendPanel = this.objMvtLayer?.mapVM.getLegendPanel();
      if (legendPanel) {
        this.getLegendAsImage(this.legendRenderer, legendPanel, layer);
      }
    })();
  }

  /**
   * Converts the rendered legend to an image and adds it to the legend panel.
   * @param legendRenderer - The legend renderer object.
   * @param legendPanel - The legend panel to add the image.
   * @param layer - The layer related to the legend.
   */
  getLegendAsImage(
      legendRenderer: LegendRenderer,
      legendPanel: any,
      layer: LayerWithLegend
  ): void {
    legendRenderer.renderAsImage("svg").then((svgGeoStylerRenderer) => {
      const svg = this.convertSVGStringToSVG(svgGeoStylerRenderer);
      legendPanel.addItem(
          new olLegendImage({
            title: layer.get("title"),
            img: svg,
          })
      );
      legendPanel.refresh();
    });
  }

  /**
   * Converts an SVG string output to a usable Image element.
   * @param svgGeoStylerRenderer - The SVG element output from GeoStyler legend renderer.
   * @returns The created HTMLImageElement.
   */
  convertSVGStringToSVG(svgGeoStylerRenderer: Element): HTMLImageElement {
    const canvas = document.createElement("canvas");
    const svgElement = svgGeoStylerRenderer as SVGSVGElement;
    canvas.width = svgElement.width.baseVal.value;
    canvas.height = svgElement.height.baseVal.value;

    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = function () {
      ctx?.drawImage(img, 0, 0);
    };

    img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgElement.outerHTML)));

    return img;
  }
}

export default SLDStyleParser;
