import * as React from "react";
import MapVM from "@damap/components/map/models/MapVM";
import { IFeatureStyle } from "@/libs/damap";

export interface BaseStyleFormProps {
  layerId: string;
  mapVM: MapVM;
}

abstract class BaseStyleForm<
    P = object,
    S = object
> extends React.PureComponent<BaseStyleFormProps & P, S> {

  abstract getFeatureStyle(): IFeatureStyle | undefined;

  // Change the return type here to React.ReactNode
  render(): React.ReactNode {
    return null;
  }
}

export default BaseStyleForm;