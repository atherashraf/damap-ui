import OlParser from "geostyler-openlayers-parser";
import SldParser from "geostyler-sld-parser";
import LegendRenderer from "geostyler-legend/dist/LegendRenderer/LegendRenderer";
import olLegendImage from "ol-ext/legend/Image";
import AbstractDALayer from "@/components/map/layers/da_layers/AbstractDALayer";
import VectorLayer from "ol/layer/Vector";

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

      // console.log("GeoStyler style", geostylerStyle);
      const renderer = new LegendRenderer({
        overflow: "group",
        styles: geostylerStyle.output ? [geostylerStyle.output] : [],
        hideRect: true,
        // @ts-ignore
        iconSize: [20, 30],
        size: [300, 150],
      });

      layer.legend = { sType: "sld", graphic: renderer };
      this.legendRenderer = renderer;

      if (!geostylerStyle.output) {
        return;
      }
      const olStyle = await olParser.writeStyle(geostylerStyle.output);

      const styleFunction = olStyle.output;
      if (typeof styleFunction === "function") {
        const safeStyleFunction = (feature: any, resolution: number) => {
          const styles = styleFunction(feature, resolution);
          if (!Array.isArray(styles)) return styles;

          styles.forEach((style) => {
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
        layer.setStyle(styleFunction as any);
      }


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