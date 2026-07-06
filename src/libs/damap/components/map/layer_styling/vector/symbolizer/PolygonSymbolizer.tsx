import * as React from "react";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import DAColorPicker from "@damap/components/map/layer_styling/DAColorPicker";
import DANumberField from "@damap/components/base/DANumberField";
import { IGeomStyle } from "@damap/types/typeDeclarations";

type FillPattern = NonNullable<IGeomStyle["fillPattern"]>;

interface IProps {
    style?: IGeomStyle;
}

interface IState {
    fillColor: string;
    fillOpacity: number;

    strokeColor: string;
    strokeWidth: number;
    strokeOpacity: number;

    fillPattern: FillPattern;

    lineDash: string;
    lineDashOffset: number;
    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
}

class PolygonSymbolizer extends React.PureComponent<IProps, IState> {
    fillColorRef = React.createRef<DAColorPicker>();
    strokeColorRef = React.createRef<DAColorPicker>();

    constructor(props: IProps) {
        super(props);

        const style = props.style;

        this.state = {
            fillColor: style?.fillColor ?? "rgba(27,32,109,0.67)",
            fillOpacity: style?.fillOpacity ?? 0.67,

            strokeColor: style?.strokeColor ?? "#404abf",
            strokeWidth: style?.strokeWidth ?? 1,
            strokeOpacity: style?.strokeOpacity ?? 1,

            fillPattern: style?.fillPattern ?? "solid",

            lineDash: style?.lineDash?.join(",") ?? "",
            lineDashOffset: style?.lineDashOffset ?? 0,
            lineCap: style?.lineCap ?? "butt",
            lineJoin: style?.lineJoin ?? "round",
        };
    }

    getStyleParams(): IGeomStyle {
        const lineDash = this.state.lineDash
            .split(",")
            .map((v) => Number(v.trim()))
            .filter((v) => !Number.isNaN(v) && v > 0);

        return {
            fillColor:
                this.fillColorRef.current?.getColor() ?? this.state.fillColor,

            fillOpacity:
                this.state.fillPattern === "none"
                    ? 0
                    : this.state.fillOpacity,

            strokeColor:
                this.strokeColorRef.current?.getColor() ??
                this.state.strokeColor,
            strokeWidth: this.state.strokeWidth,
            strokeOpacity: this.state.strokeOpacity,

            fillPattern: this.state.fillPattern,

            lineDash: lineDash.length ? lineDash : undefined,
            lineDashOffset: this.state.lineDashOffset,
            lineCap: this.state.lineCap,
            lineJoin: this.state.lineJoin,
        };
    }

    render(): React.ReactNode {
        const showFillControls = this.state.fillPattern !== "none";

        return (
            <fieldset>
                <legend>Polygon Symbol</legend>

                <Box display="flex" flexDirection="column" gap={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Fill Pattern</InputLabel>
                        <Select
                            label="Fill Pattern"
                            value={this.state.fillPattern}
                            onChange={(e) =>
                                this.setState({
                                    fillPattern: e.target.value as FillPattern,
                                })
                            }
                        >
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="solid">Solid</MenuItem>
                            <MenuItem value="diagonal">Diagonal</MenuItem>
                            <MenuItem value="cross">Cross</MenuItem>
                            <MenuItem value="dot">Dot</MenuItem>
                            <MenuItem value="horizontal">Horizontal</MenuItem>
                            <MenuItem value="vertical">Vertical</MenuItem>
                        </Select>
                    </FormControl>

                    {showFillControls && (
                        <>
                            <DAColorPicker
                                ref={this.fillColorRef}
                                label={
                                    this.state.fillPattern === "solid"
                                        ? "Fill Color"
                                        : "Pattern Color"
                                }
                                color={this.state.fillColor}
                                isAlpha
                            />

                            <DANumberField
                                label={
                                    this.state.fillPattern === "solid"
                                        ? "Fill Opacity"
                                        : "Pattern Opacity"
                                }
                                fullWidth
                                size="small"
                                value={this.state.fillOpacity}
                                min={0}
                                max={1}
                                step={0.1}
                                onValueChange={(value) =>
                                    this.setState({ fillOpacity: value })
                                }
                            />
                        </>
                    )}

                    <DAColorPicker
                        ref={this.strokeColorRef}
                        label="Stroke Color"
                        color={this.state.strokeColor}
                        isAlpha={false}
                    />

                    <DANumberField
                        label="Stroke Width"
                        fullWidth
                        size="small"
                        value={this.state.strokeWidth}
                        min={0}
                        max={50}
                        step={0.5}
                        onValueChange={(value) =>
                            this.setState({ strokeWidth: value })
                        }
                    />

                    {/*<DANumberField*/}
                    {/*    label="Stroke Opacity"*/}
                    {/*    fullWidth*/}
                    {/*    size="small"*/}
                    {/*    value={this.state.strokeOpacity}*/}
                    {/*    min={0}*/}
                    {/*    max={1}*/}
                    {/*    step={0.1}*/}
                    {/*    onValueChange={(value) =>*/}
                    {/*        this.setState({ strokeOpacity: value })*/}
                    {/*    }*/}
                    {/*/>*/}

                    <FormControl fullWidth size="small">
                        <InputLabel>Stroke Style</InputLabel>
                        <Select
                            label="Stroke Style"
                            value={this.state.lineDash}
                            onChange={(e) =>
                                this.setState({
                                    lineDash: e.target.value,
                                })
                            }
                        >
                            <MenuItem value="">Solid</MenuItem>
                            {/*<MenuItem value="4,4">Dashed</MenuItem>*/}
                            <MenuItem value="1,4">Dotted</MenuItem>
                            <MenuItem value="8,4,1,4">Dash Dot</MenuItem>
                            <MenuItem value="8,4">Long Dash</MenuItem>

                        </Select>
                    </FormControl>

                    <DANumberField
                        label="Dash Offset"
                        fullWidth
                        size="small"
                        value={this.state.lineDashOffset}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) =>
                            this.setState({ lineDashOffset: value })
                        }
                    />

                    <FormControl fullWidth size="small">
                        <InputLabel>Line Cap</InputLabel>
                        <Select
                            label="Line Cap"
                            value={this.state.lineCap}
                            onChange={(e) =>
                                this.setState({
                                    lineCap: e.target.value as CanvasLineCap,
                                })
                            }
                        >
                            <MenuItem value="butt">Butt</MenuItem>
                            <MenuItem value="round">Round</MenuItem>
                            <MenuItem value="square">Square</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>Line Join</InputLabel>
                        <Select
                            label="Line Join"
                            value={this.state.lineJoin}
                            onChange={(e) =>
                                this.setState({
                                    lineJoin: e.target.value as CanvasLineJoin,
                                })
                            }
                        >
                            <MenuItem value="round">Round</MenuItem>
                            <MenuItem value="bevel">Bevel</MenuItem>
                            <MenuItem value="miter">Miter</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </fieldset>
        );
    }
}

export default PolygonSymbolizer;