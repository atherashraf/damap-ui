import * as React from "react";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    TextField,
} from "@mui/material";
import {DASelect} from "@/components/styled/styledMapComponents";
import {Style, Icon} from "ol/style";
import {IGeomStyle} from "@/types/typeDeclarations";
import _ from "@/utils/lodash";
import {renderToStaticMarkup} from "react-dom/server";
import {JSX} from "react";

const minPointSize = 9, maxPointSize = 25;
export const pointShapeTypes = [
    "circle",
    "star",
    "triangle",
    "square",
    undefined,
    // 'stacked',
] as const;

export const getPointSVG = (
    style: IGeomStyle,
    w: number = maxPointSize + 1,
    h: number = maxPointSize + 1
): JSX.Element => {
    const svgStyle = {
        fill: style.fillColor,
        strokeWidth: style.strokeWidth,
        stroke: style.strokeColor,
    };

    const size = style?.pointSize || maxPointSize;
    w = size * 1.2
    h = size * 1.2
    let svgShape;
    switch (style.pointShape) {
        case "star":
            svgShape = (
                <path
                    d="M12 .288l2.833 8.718h9.167l-7.417 5.389 2.833 8.718-7.416-5.388-7.417 5.388 2.833-8.718-7.416-5.389h9.167z"
                    style={svgStyle}
                />
            );
            break;
        case "square":
            svgShape = (
                <rect
                    x={(w - size) / 2}
                    y={(h - size) / 2}
                    width={size}
                    height={size}
                    style={svgStyle}
                />
            );
            break;
        case "triangle":
            const startPoint = [minPointSize, h];
            const apex = [w / 2, 0];
            const endPoint = [w - minPointSize, h];
            const d = `M${startPoint.join(" ")} L${apex.join(" ")} L${endPoint.join(" ")} Z`;
            svgShape = <path d={d} style={svgStyle}/>;
            break;
        default:
            svgShape = (
                <circle
                    cx={w / 2}
                    cy={h / 2}
                    r={size / 2}
                    style={svgStyle}
                />
            );
            break;
    }

    return (
        <svg
            role="img"
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {svgShape}
        </svg>
    );
};


export const getPointShapes = (style: IGeomStyle): Style => {
    const svgElem = getPointSVG(style);
    const svg = renderToStaticMarkup(svgElem);
    return new Style({
        image: new Icon({
            src: "data:image/svg+xml;base64," + btoa(svg),
            anchor: [0.5, 0.5]
        }),

    });
};

interface IProps {
    updateStyle?: Function;
    pointShape: (typeof pointShapeTypes)[number];
    pointSize: number | undefined;
}

export interface IPointSymbolizerState {
    pointShape: (typeof pointShapeTypes)[number];
    pointSize: number | undefined;
}

class PointSymbolizer extends React.PureComponent<
    IProps,
    IPointSymbolizerState
> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            pointShape: this.props.pointShape || "circle",
            pointSize: this.props.pointSize || 18,
        };
    }

    componentDidUpdate(
        prevProps: Readonly<IProps>,
        prevState: Readonly<IPointSymbolizerState>
    ) {
        if (this.props.pointShape !== prevProps.pointShape) {
            this.setState({pointShape: this.props.pointShape});
        }
        if (this.props.pointSize !== prevProps.pointSize) {
            this.setState({pointSize: this.props.pointSize});
        }
        if (!_.isEqual(prevState, this.state) && this.props.updateStyle) {
            this.props.updateStyle({...this.state});
        }
    }

    getPointSymbolizer() {
        return {...this.state};
    }

    render() {
        return (
            <React.Fragment>
                <fieldset>
                    <legend>Point Symbol</legend>
                    <Box sx={{flex: 1, pt: 1}}>
                        <FormControl fullWidth size={"small"}>
                            <InputLabel id="select-value-label">
                                Select Point Shape
                            </InputLabel>
                            <DASelect
                                value={this.state.pointShape}
                                label="Select Point Shape"
                                onChange={(e) => {
                                    // @ts-ignore
                                    this.setState({pointShape: e.target.value as string});
                                }}
                            >
                                {pointShapeTypes.map((value: any) => (
                                    <MenuItem key={`${value}-key`} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </DASelect>
                        </FormControl>
                    </Box>
                    <Box sx={{flex: 1, pt: 1}}>
                        <FormControl fullWidth size={"small"}>
                            {/*<InputLabel id="select-value-label">Select Point Size</InputLabel>*/}
                            <TextField
                                type={"number"}
                                value={this.state.pointSize}
                                label="Select Point Size"
                                size={"small"}
                                onChange={(e) =>
                                    this.setState({
                                        pointSize: parseInt(e.target.value as string),
                                    })
                                }
                                InputProps={{
                                    inputProps: {min: minPointSize + 1, max: maxPointSize},
                                }}
                            />
                        </FormControl>
                    </Box>
                </fieldset>
            </React.Fragment>
        );
    }
}

export default PointSymbolizer;
