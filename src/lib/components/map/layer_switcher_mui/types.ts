import BaseLayer from "ol/layer/Base";
import * as React from "react";

export interface LayerItem {
  id: string;
  layer: BaseLayer;
  title: string;
  isBaseLayer: boolean;
  icon: React.ReactNode;
}

export interface LayerMenuState {
  item: LayerItem;
  top: number;
  left: number;
}
