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

interface IProps {
    style?: IGeomStyle;
}

interface IState {
    strokeColor: string;
    strokeWidth: number;
    strokeOpacity: number;

    lineDash: string;
    lineDashOffset: number;
    lineOffset: number;

    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
}

class LineSymbolizer extends React.PureComponent<IProps, IState> {
    strokeColorRef = React.createRef<DAColorPicker>();

    constructor(props: IProps) {
        super(props);

        const style = props.style;

        this.state = {
            strokeColor: style?.strokeColor ?? "#404abf",
            strokeWidth: style?.strokeWidth ?? 1,
            strokeOpacity: style?.strokeOpacity ?? 1,

            lineDash: style?.lineDash?.join(",") ?? "",
            lineDashOffset: style?.lineDashOffset ?? 0,
            lineOffset: style?.lineOffset ?? 0,

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
            strokeColor:
                this.strokeColorRef.current?.getColor() ??
                this.state.strokeColor,

            strokeWidth: this.state.strokeWidth,
            strokeOpacity: this.state.strokeOpacity,

            lineDash: lineDash.length ? lineDash : undefined,
            lineDashOffset: this.state.lineDashOffset,
            lineOffset: this.state.lineOffset,

            lineCap: this.state.lineCap,
            lineJoin: this.state.lineJoin,
        };
    }

    render(): React.ReactNode {
        return (
            <fieldset>
                <legend>Line Symbol</legend>

                <Box display="flex" flexDirection="column" gap={2}>
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
                            <MenuItem value="8,4,1,4">Dash Dot</MenuItem>
                            <MenuItem value="1,4">Dotted</MenuItem>
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

                    <DANumberField
                        label="Line Offset"
                        fullWidth
                        size="small"
                        value={this.state.lineOffset}
                        min={-100}
                        max={100}
                        step={1}
                        onValueChange={(value) =>
                            this.setState({ lineOffset: value })
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

export default LineSymbolizer;