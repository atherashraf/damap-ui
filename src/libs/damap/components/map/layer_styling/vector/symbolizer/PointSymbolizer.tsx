// PointSymbolizer.tsx
import * as React from "react";
import {
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Stack,
    Tooltip,
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { Style, Icon } from "ol/style";
import { renderToStaticMarkup } from "react-dom/server";
import { JSX } from "react";

import { DASelect } from "@damap/components/styled/styledMapComponents";
import DAColorPicker from "@damap/components/map/layer_styling/DAColorPicker";
import DANumberField from "@damap/components/base/DANumberField";
import { IGeomStyle } from "@damap/types/typeDeclarations";
import _ from "@damap/utils/lodash";

const DEFAULT_POINT_SIZE = 24;
const CANVAS_BOX = 32;
const MIN_POINT_SIZE = 9;
const MAX_POINT_SIZE = 96;

export const pointShapeTypes = [
    "circle",
    "star",
    "triangle",
    "square",
    "pin",
    undefined,
] as const;

export interface IPointSymbolizerState {
    pointShape: (typeof pointShapeTypes)[number];
    pointSize: number;
    pointRotation: number;

    fillColor: string;
    fillOpacity: number;

    strokeColor: string;
    strokeWidth: number;
    strokeOpacity: number;

    pointIconSrc?: string;
    pointIconScale: number;
    pointIconOpacity: number;
    pointIconAnchorX: number;
    pointIconAnchorY: number;
}

interface IProps {
    style?: IGeomStyle;
    showIconUpload?: boolean;
    updateStyle?: (style: IGeomStyle) => void;
}

export const getPointSVG = (
    style: IGeomStyle,
    w: number = DEFAULT_POINT_SIZE + 1,
    h: number = DEFAULT_POINT_SIZE + 1
): JSX.Element => {
    const size = style.pointSize ?? DEFAULT_POINT_SIZE;

    w = size * 1.2;
    h = size * 1.2;

    const svgStyle = {
        fill: style.fillColor ?? "#ffffff",
        fillOpacity: style.fillOpacity ?? 1,
        strokeWidth: style.strokeWidth ?? 1,
        stroke: style.strokeColor ?? "#404abf",
        strokeOpacity: style.strokeOpacity ?? 1,
    };

    let svgShape: JSX.Element;

    switch (style.pointShape) {
        case "star":
            svgShape = (
                <path
                    d="M12 .288l2.833 8.718h9.167l-7.417 5.389 2.833 8.718-7.416-5.388-7.417 5.388 2.833-8.718-7.416-5.389h9.167z"
                    style={svgStyle}
                    transform={`scale(${size / 24})`}
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

        case "triangle": {
            const startPoint = [MIN_POINT_SIZE, MIN_POINT_SIZE / 2];
            const apex = [w / 2, h - MIN_POINT_SIZE / 2];
            const endPoint = [w - MIN_POINT_SIZE, MIN_POINT_SIZE / 2];

            const d = `
                M${startPoint.join(" ")}
                L${apex.join(" ")}
                L${endPoint.join(" ")}
                Z
            `;

            svgShape = <path d={d} style={svgStyle} />;
            break;
        }

        case "pin": {
            const cx = w / 2;
            const cy = h / 2 - size * 0.15;
            const r = size * 0.28;
            const bottomY = cy + r;
            const tailY = h - MIN_POINT_SIZE / 2;

            const d = `
                M ${cx} ${tailY}
                Q ${cx - r * 1.2} ${bottomY}
                  ${cx - r} ${cy}
                A ${r} ${r} 0 1 1 ${cx + r} ${cy}
                Q ${cx + r * 1.2} ${bottomY}
                  ${cx} ${tailY}
                Z
            `;

            svgShape = <path d={d} style={svgStyle} />;
            break;
        }

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
    if (style.pointIconSrc) {
        return new Style({
            image: new Icon({
                src: style.pointIconSrc,
                scale:
                    style.pointIconScale ??
                    (style.pointSize ?? CANVAS_BOX) / CANVAS_BOX,
                opacity: style.pointIconOpacity ?? 1,
                rotation: style.pointRotation ?? 0,
                anchor: style.pointIconAnchor ?? [0.5, 0.5],
                anchorXUnits: "fraction",
                anchorYUnits: "fraction",
            }),
            zIndex: style.zIndex,
        });
    }

    const svg = renderToStaticMarkup(getPointSVG(style));

    return new Style({
        image: new Icon({
            src: "data:image/svg+xml;base64," + btoa(svg),
            rotation: style.pointRotation ?? 0,
            anchor: [0.5, 0.5],
            anchorXUnits: "fraction",
            anchorYUnits: "fraction",
        }),
        zIndex: style.zIndex,
    });
};

class PointSymbolizer extends React.PureComponent<
    IProps,
    IPointSymbolizerState
> {
    fileInputRef = React.createRef<HTMLInputElement>();
    fillColorRef = React.createRef<DAColorPicker>();
    strokeColorRef = React.createRef<DAColorPicker>();

    constructor(props: IProps) {
        super(props);

        const style = props.style;

        this.state = {
            pointShape: style?.pointShape ?? "circle",
            pointSize: style?.pointSize ?? DEFAULT_POINT_SIZE,
            pointRotation: style?.pointRotation ?? 0,

            fillColor: style?.fillColor ?? "#ffffff",
            fillOpacity: style?.fillOpacity ?? 1,

            strokeColor: style?.strokeColor ?? "#404abf",
            strokeWidth: style?.strokeWidth ?? 1,
            strokeOpacity: style?.strokeOpacity ?? 1,

            pointIconSrc: style?.pointIconSrc,
            pointIconScale: style?.pointIconScale ?? 1,
            pointIconOpacity: style?.pointIconOpacity ?? 1,
            pointIconAnchorX: style?.pointIconAnchor?.[0] ?? 0.5,
            pointIconAnchorY: style?.pointIconAnchor?.[1] ?? 0.5,
        };
    }

    componentDidUpdate(
        prevProps: Readonly<IProps>,
        prevState: Readonly<IPointSymbolizerState>
    ) {
        if (!_.isEqual(prevProps.style, this.props.style)) {
            const style = this.props.style;

            this.setState({
                pointShape: style?.pointShape ?? "circle",
                pointSize: style?.pointSize ?? DEFAULT_POINT_SIZE,
                pointRotation: style?.pointRotation ?? 0,

                fillColor: style?.fillColor ?? "#ffffff",
                fillOpacity: style?.fillOpacity ?? 1,

                strokeColor: style?.strokeColor ?? "#404abf",
                strokeWidth: style?.strokeWidth ?? 1,
                strokeOpacity: style?.strokeOpacity ?? 1,

                pointIconSrc: style?.pointIconSrc,
                pointIconScale: style?.pointIconScale ?? 1,
                pointIconOpacity: style?.pointIconOpacity ?? 1,
                pointIconAnchorX: style?.pointIconAnchor?.[0] ?? 0.5,
                pointIconAnchorY: style?.pointIconAnchor?.[1] ?? 0.5,
            });
        }

        if (!_.isEqual(prevState, this.state) && this.props.updateStyle) {
            this.props.updateStyle(this.getStyleParams());
        }
    }

    getStyleParams(): IGeomStyle {
        return {
            pointShape: this.state.pointShape,
            pointSize: this.state.pointSize,
            pointRotation: this.state.pointRotation,

            fillColor:
                this.fillColorRef.current?.getColor() ?? this.state.fillColor,
            fillOpacity: this.state.fillOpacity,

            strokeColor:
                this.strokeColorRef.current?.getColor() ??
                this.state.strokeColor,
            strokeWidth: this.state.strokeWidth,
            strokeOpacity: this.state.strokeOpacity,

            pointIconSrc: this.state.pointIconSrc,
            pointIconScale: this.state.pointIconScale,
            pointIconOpacity: this.state.pointIconOpacity,
            pointIconAnchor: [
                this.state.pointIconAnchorX,
                this.state.pointIconAnchorY,
            ],
        };
    }

    handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!/image\/(png|svg\+xml)$/i.test(file.type)) {
            alert("Only PNG or SVG are allowed.");
            if (this.fileInputRef.current) this.fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = CANVAS_BOX;
                canvas.height = CANVAS_BOX;

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.clearRect(0, 0, CANVAS_BOX, CANVAS_BOX);

                const scale = Math.min(
                    CANVAS_BOX / img.width,
                    CANVAS_BOX / img.height,
                    1
                );

                const drawW = Math.round(img.width * scale);
                const drawH = Math.round(img.height * scale);
                const dx = Math.floor((CANVAS_BOX - drawW) / 2);
                const dy = Math.floor((CANVAS_BOX - drawH) / 2);

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, dx, dy, drawW, drawH);

                this.setState({
                    pointIconSrc: canvas.toDataURL("image/png"),
                });
            };

            img.src = reader.result as string;
        };

        reader.readAsDataURL(file);
    };

    clearIcon = () => {
        this.setState({ pointIconSrc: undefined });

        if (this.fileInputRef.current) {
            this.fileInputRef.current.value = "";
        }
    };

    render(): React.ReactNode {
        const hasIcon = Boolean(this.state.pointIconSrc);
        const showIconUpload = this.props.showIconUpload ?? true;

        return (
            <fieldset>
                <legend>Point Symbol</legend>

                {showIconUpload && (
                    <Box sx={{ flex: 1, pt: 1 }}>
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            flexWrap="wrap"
                        >
                            <Button
                                variant="outlined"
                                onClick={() =>
                                    this.fileInputRef.current?.click()
                                }
                            >
                                Upload Icon
                            </Button>

                            <Tooltip
                                title="PNG or SVG. Icon will be auto-resized to fit within 32×32."
                                placement="top"
                                arrow
                            >
                                <IconButton
                                    size="small"
                                    aria-label="Icon requirements"
                                >
                                    <InfoOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            <input
                                ref={this.fileInputRef}
                                type="file"
                                accept="image/png,image/svg+xml"
                                style={{ display: "none" }}
                                onChange={this.handleFileChange}
                            />

                            {hasIcon && (
                                <>
                                    <img
                                        src={this.state.pointIconSrc}
                                        alt="point icon preview"
                                        style={{
                                            width: 24,
                                            height: 24,
                                            objectFit: "contain",
                                            borderRadius: 4,
                                            border:
                                                "1px solid rgba(0,0,0,0.15)",
                                        }}
                                    />

                                    <Button
                                        variant="text"
                                        color="error"
                                        onClick={this.clearIcon}
                                    >
                                        Clear
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Box>
                )}

                <Box sx={{ flex: 1, pt: 2 }}>
                    <FormControl fullWidth size="small" disabled={hasIcon}>
                        <InputLabel id="point-shape-label">
                            Select Point Shape
                        </InputLabel>

                        <DASelect
                            labelId="point-shape-label"
                            value={this.state.pointShape ?? ""}
                            label="Select Point Shape"
                            onChange={(e) =>
                                this.setState({
                                    pointShape:
                                        e.target.value === ""
                                            ? undefined
                                            : (e.target
                                                .value as IPointSymbolizerState["pointShape"]),
                                })
                            }
                        >
                            {pointShapeTypes.map((value) => (
                                <MenuItem
                                    key={`${value ?? "none"}-key`}
                                    value={value ?? ""}
                                >
                                    {value ?? "none"}
                                </MenuItem>
                            ))}
                        </DASelect>
                    </FormControl>
                </Box>

                {!hasIcon && (
                    <>
                        <Box sx={{ flex: 1, pt: 2 }}>
                            <DAColorPicker
                                ref={this.fillColorRef}
                                label="Fill Color"
                                color={this.state.fillColor}
                                isAlpha
                            />
                        </Box>

                        <Box sx={{ flex: 1, pt: 2 }}>
                            <DANumberField
                                label="Fill Opacity"
                                size="small"
                                fullWidth
                                value={this.state.fillOpacity}
                                min={0}
                                max={1}
                                step={0.1}
                                onValueChange={(value) =>
                                    this.setState({ fillOpacity: value })
                                }
                            />
                        </Box>

                        <Box sx={{ flex: 1, pt: 2 }}>
                            <DAColorPicker
                                ref={this.strokeColorRef}
                                label="Stroke Color"
                                color={this.state.strokeColor}
                                isAlpha={false}
                            />
                        </Box>

                        <Box sx={{ flex: 1, pt: 2 }}>
                            <DANumberField
                                label="Stroke Width"
                                size="small"
                                fullWidth
                                value={this.state.strokeWidth}
                                min={0}
                                max={20}
                                step={0.5}
                                onValueChange={(value) =>
                                    this.setState({ strokeWidth: value })
                                }
                            />
                        </Box>

                        <Box sx={{ flex: 1, pt: 2 }}>
                            <DANumberField
                                label="Stroke Opacity"
                                size="small"
                                fullWidth
                                value={this.state.strokeOpacity}
                                min={0}
                                max={1}
                                step={0.1}
                                onValueChange={(value) =>
                                    this.setState({ strokeOpacity: value })
                                }
                            />
                        </Box>
                    </>
                )}

                <Box sx={{ flex: 1, pt: 2 }}>
                    <DANumberField
                        label="Point Size"
                        size="small"
                        fullWidth
                        value={this.state.pointSize}
                        min={MIN_POINT_SIZE}
                        max={MAX_POINT_SIZE}
                        step={1}
                        onValueChange={(value) =>
                            this.setState({ pointSize: value })
                        }
                    />
                </Box>

                <Box sx={{ flex: 1, pt: 2 }}>
                    <DANumberField
                        label="Rotation"
                        size="small"
                        fullWidth
                        value={this.state.pointRotation}
                        min={-6.283}
                        max={6.283}
                        step={0.1}
                        helperText="OpenLayers rotation is in radians."
                        onValueChange={(value) =>
                            this.setState({ pointRotation: value })
                        }
                    />
                </Box>

                {hasIcon && (
                    <>
                        <Box sx={{ flex: 1, pt: 2 }}>
                            <DANumberField
                                label="Icon Scale"
                                size="small"
                                fullWidth
                                value={this.state.pointIconScale}
                                min={0.1}
                                max={5}
                                step={0.1}
                                onValueChange={(value) =>
                                    this.setState({ pointIconScale: value })
                                }
                            />
                        </Box>

                        <Box sx={{ flex: 1, pt: 2 }}>
                            <DANumberField
                                label="Icon Opacity"
                                size="small"
                                fullWidth
                                value={this.state.pointIconOpacity}
                                min={0}
                                max={1}
                                step={0.1}
                                onValueChange={(value) =>
                                    this.setState({ pointIconOpacity: value })
                                }
                            />
                        </Box>

                        <Stack direction="row" spacing={1.5} sx={{ pt: 2 }}>
                            <DANumberField
                                label="Anchor X"
                                size="small"
                                fullWidth
                                value={this.state.pointIconAnchorX}
                                min={0}
                                max={1}
                                step={0.1}
                                onValueChange={(value) =>
                                    this.setState({ pointIconAnchorX: value })
                                }
                            />

                            <DANumberField
                                label="Anchor Y"
                                size="small"
                                fullWidth
                                value={this.state.pointIconAnchorY}
                                min={0}
                                max={1}
                                step={0.1}
                                onValueChange={(value) =>
                                    this.setState({ pointIconAnchorY: value })
                                }
                            />
                        </Stack>
                    </>
                )}
            </fieldset>
        );
    }
}

export default PointSymbolizer;