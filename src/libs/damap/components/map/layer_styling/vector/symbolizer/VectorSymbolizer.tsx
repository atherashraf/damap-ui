import * as React from "react";
import { Box } from "@mui/material";
import { IGeomStyle } from "@damap/types/typeDeclarations";
import PointSymbolizer from "./PointSymbolizer";
import LineSymbolizer from "./LineSymbolizer";
import PolygonSymbolizer from "./PolygonSymbolizer";

interface IProp {
    geomType: string[] | undefined;
    style?: IGeomStyle;
}

class VectorSymbolizer extends React.PureComponent<IProp> {
    pointSymbolRef = React.createRef<PointSymbolizer>();
    lineSymbolRef = React.createRef<LineSymbolizer>();
    polygonSymbolRef = React.createRef<PolygonSymbolizer>();

    private hasGeom(type: string): boolean {
        return this.props.geomType?.some((g) =>
            g.toLowerCase().includes(type.toLowerCase())
        ) ?? false;
    }

    getStyleParams(): IGeomStyle | undefined {
        const pointStyle = this.pointSymbolRef.current?.getStyleParams?.();
        const lineStyle = this.lineSymbolRef.current?.getStyleParams?.();
        const polygonStyle = this.polygonSymbolRef.current?.getStyleParams?.();

        return {
            ...pointStyle,
            ...lineStyle,
            ...polygonStyle,
        };
    }

    render(): React.ReactNode {
        const { style } = this.props;

        const showPoint = this.hasGeom("point");
        const showLine = this.hasGeom("line");
        const showPolygon = this.hasGeom("polygon");

        return (
            <Box display="flex" flexDirection="column" gap={2}>
                {showPoint && (
                    <PointSymbolizer
                        ref={this.pointSymbolRef}
                        style={style}
                        showIconUpload
                    />
                )}

                {showLine && (
                    <LineSymbolizer
                        ref={this.lineSymbolRef}
                        style={style}
                    />
                )}

                {showPolygon && (
                    <PolygonSymbolizer
                        ref={this.polygonSymbolRef}
                        style={style}
                    />
                )}
            </Box>
        );
    }
}

export default VectorSymbolizer;