import autoBind from "auto-bind";
import * as React from "react";

import BaseStyleForm, { BaseStyleFormProps } from "./BaseStyleForm";
import VectorSymbolizer from "./symbolizer/VectorSymbolizer";
import { IFeatureStyle, IGeomStyle } from "@damap/types/typeDeclarations";

class SingleStyleForm extends BaseStyleForm {
  vectorStyleRef = React.createRef<VectorSymbolizer>();

  constructor(props: BaseStyleFormProps) {
    super(props);
    autoBind(this);
  }

  getFeatureStyle(): IFeatureStyle | undefined {
    const style: IGeomStyle | undefined =
        this.vectorStyleRef.current?.getStyleParams();

    if (!style) return undefined;

    return {
      type: "single",
      style: {
        default: style,
      },
    };
  }

  render(): React.ReactNode {
    const layerId =
        this.props.layerId || this.props.mapVM.getLayerOfInterest();

    if (!layerId) return null;

    const layer = this.props.mapVM.getDALayer(layerId);
    if (!layer) return null;

    const currentStyle = layer.style;
    const geomType = layer.getGeomType();

    return (
        <VectorSymbolizer
            ref={this.vectorStyleRef}
            geomType={geomType}
            style={currentStyle?.style?.default}
        />
    );
  }
}

export default SingleStyleForm;