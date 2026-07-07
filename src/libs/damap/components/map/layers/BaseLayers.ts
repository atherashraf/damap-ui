import MapVM from "../models/MapVM";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { BingMaps } from "ol/source";
import { Group } from "ol/layer";
import { ILayerSources, ILayerSourcesInfo } from "@damap/types/typeDeclarations";
import XYZ from "ol/source/XYZ";
import BaseLayer from "ol/layer/Base";

export const baseLayerSources = {
  none: { title: "Empty Map", source: "none" },
  googleTerrain: { title: "Google Physical", source: "google" },        // lyrs=p
  googleLabels: { title: "Google Labels", source: "google" },           // lyrs=m
  googleSatellite: { title: "Google Satellite", source: "google" },     // lyrs=s
  googleHybrid: { title: "Google Hybrid", source: "google" },           // lyrs=y (Satellite + Labels)

  osm: { title: "Open Street Map", source: "osm" },
  // bingRoad: { title: "Bing Roads", source: "osm", imagerySet: "RoadOnDemand" },
  // bingAerial: { title: "Bing Aerial", source: "bing", visible: false, imagerySet: "Aerial" },

};

class BaseLayers {
  private mapVM: MapVM;
  //@ts-ignore
  private readonly layersSources: ILayerSources;
  // private _bingMapsKey = import.meta.env.VITE_BING_MAPS_KEY;

  constructor(mapVM: MapVM) {
    this.mapVM = mapVM;
  }

  addBaseLayers(title: string | null = null) {
    const layers: BaseLayer[] = [];

    // Ensure title is a string; default to "Google Hybrid" if null is passed
    const activeTitle: string = !title ? "Google Hybrid" : title;

    for (const key in baseLayerSources) {
      // Cast key to access the sources object correctly
      const info = (baseLayerSources as any)[key];
      const layer = this.getLayer(key);

      if (layer) {
        layers.push(layer);

        // Compare the layer title to our activeTitle string
        if (info?.title === activeTitle) {
          layer.setVisible(true);
        }
      }
    }

    const gLayer = new Group({
      // @ts-ignore - 'title' is a custom property for the LayerSwitcher logic
      title: "Base Layers",
      openInLayerSwitcher: true,
      layers: layers,
    });

    this.mapVM.getMap().addLayer(gLayer);
  }

  getEmptyLayer(info: ILayerSourcesInfo): TileLayer<any> {
    return new TileLayer({
      //@ts-ignore
      title: info.title, // This will be "Empty Map"
      visible: false,
      baseLayer: true,
      // By providing no source, the layer is "empty"
    });
  }

  getLayer(key: string): any {
    //@ts-ignore
    const info = baseLayerSources[key];
    let layer: any;
    switch (info?.source) {
      case "osm":
        layer = this.getOSMLLayer(info);
        break;
      case "bing":
        layer = this.getBingMapLayer(info);
        break;
      case "google":
        layer = this.getGoogleLayer(info);
        break;
      case "none": // NEW: Handle Empty Map
        layer = this.getEmptyLayer(info);
        break;
    }
    return layer;
  }

  getGoogleLayer(info: ILayerSourcesInfo): TileLayer<any> {
    let lyrs = "p"; // Default to terrain
    const title = info.title.toLowerCase();
    if (title.includes("labels")) lyrs = "m";
    else if (title.includes("satellite")) lyrs = "s";
    else if (title.includes("hybrid")) lyrs = "y";

    return new TileLayer({
      //@ts-ignore
      title: info.title,
      visible: false,
      baseLayer: true,
      source: new XYZ({
        attributions: "Google Maps",
        url: `https://mt0.google.com/vt/lyrs=${lyrs}&hl=en&x={x}&y={y}&z={z}`,
        crossOrigin: "anonymous",
        wrapX: true,
      }),
    });
  }

  getOSMLLayer(info: ILayerSourcesInfo): TileLayer<OSM> {
    return new TileLayer({
      //@ts-ignore
      title: info.title,
      visible: false,
      baseLayer: true,
      source: new OSM({
        attributions: "© OpenStreetMap contributors",
        wrapX: false,
        crossOrigin: "anonymous",
      }),
    });
  }

  getBingMapLayer(info: ILayerSourcesInfo): TileLayer<BingMaps> {
    return new TileLayer({
      //@ts-ignore
      title: info.title,
      visible: false,
      preload: Infinity,
      baseLayer: true,
      source: new BingMaps({
        //@ts-ignore
        key: this._bingMapsKey,
        //@ts-ignore
        imagerySet: info.imagerySet,
        maxZoom: 19,
        crossOrigin: "anonymous"
      }),
    });
  }
}

export default BaseLayers;
