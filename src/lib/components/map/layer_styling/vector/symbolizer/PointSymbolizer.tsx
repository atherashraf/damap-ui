// PointSymbolizer.tsx
import * as React from "react";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    TextField,
    Stack,
    Button,
    Tooltip,
    IconButton,
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { DASelect } from "@/components/styled/styledMapComponents";
import { Style, Icon } from "ol/style";
import { IGeomStyle } from "@/types/typeDeclarations";
import _ from "@/utils/lodash";
import { renderToStaticMarkup } from "react-dom/server";
import { JSX } from "react";

const DEFAULT_POINT_SIZE = 24; // legend-friendly
const CANVAS_BOX = 32;         // auto-resize target box
const MIN_POINT_SIZE = 9;
const MAX_POINT_SIZE = 96;

export const pointShapeTypes = [
    "circle",
    "star",
    "triangle",
    "square",
    undefined,
] as const;

// ---- SVG Fallback Rendering ----
export const getPointSVG = (
    style: IGeomStyle,
    w: number = DEFAULT_POINT_SIZE + 1,
    h: number = DEFAULT_POINT_SIZE + 1
): JSX.Element => {
    const svgStyle = {
        fill: style.fillColor,
        strokeWidth: style.strokeWidth,
        stroke: style.strokeColor,
    };

    const size = style?.pointSize ?? DEFAULT_POINT_SIZE;
    w = size * 1.2;
    h = size * 1.2;

    let svgShape: JSX.Element;

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
            const startPoint = [MIN_POINT_SIZE, h];
            const apex = [w / 2, 0];
            const endPoint = [w - MIN_POINT_SIZE, h];
            const d = `M${startPoint.join(" ")} L${apex.join(" ")} L${endPoint.join(
                " "
            )} Z`;
            svgShape = <path d={d} style={svgStyle} />;
            break;
        default:
            svgShape = (
                <circle cx={w / 2} cy={h / 2} r={size / 2} style={svgStyle} />
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

// ---- OpenLayers Style Builder ----
// Prefers uploaded icon if present; otherwise uses generated SVG.
export const getPointShapes = (style: IGeomStyle): Style => {
    const pointIconSrc = (style as any)?.pointIconSrc as string | undefined;
    if (pointIconSrc) {
        // Scale relative to 32px base so pointSize≈32 => scale≈1
        const base = CANVAS_BOX;
        const scale = (style?.pointSize ?? base) / base;
        return new Style({
            image: new Icon({
                src: pointIconSrc,
                scale,
                anchor: [0.5, 0.5],
                anchorXUnits: "fraction",
                anchorYUnits: "fraction",
            }),
        });
    }

    const svg = renderToStaticMarkup(getPointSVG(style));
    return new Style({
        image: new Icon({
            src: "data:image/svg+xml;base64," + btoa(svg),
            anchor: [0.5, 0.5],
        }),
    });
};

interface IProps {
    updateStyle?: (style: IPointSymbolizerState) => void;
    pointShape: (typeof pointShapeTypes)[number];
    pointSize: number | undefined;
    showIconUpload: boolean;
}


export interface IPointSymbolizerState {
    pointShape: (typeof pointShapeTypes)[number];
    pointSize: number | undefined;
    pointIconSrc?: string; // data URL of the (auto-resized) uploaded icon
}

class PointSymbolizer extends React.PureComponent<
    IProps,
    IPointSymbolizerState
> {
    fileInputRef = React.createRef<HTMLInputElement>();

    constructor(props: IProps) {
        super(props);
        this.state = {
            pointShape: this.props.pointShape || "circle",
            pointSize: this.props.pointSize || DEFAULT_POINT_SIZE,
            pointIconSrc: undefined,
        };
    }

    componentDidUpdate(
        prevProps: Readonly<IProps>,
        prevState: Readonly<IPointSymbolizerState>
    ) {
        if (this.props.pointShape !== prevProps.pointShape) {
            this.setState({ pointShape: this.props.pointShape });
        }
        if (this.props.pointSize !== prevProps.pointSize) {
            this.setState({ pointSize: this.props.pointSize });
        }
        if (!_.isEqual(prevState, this.state) && this.props.updateStyle) {
            this.props.updateStyle({ ...this.state });
        }
    }

    getPointSymbolizer() {
        return { ...this.state };
    }

    // ---- Upload + Auto-resize to 32×32 (keeps aspect, no upscaling) ----
    handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Only PNG or SVG
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
                const ctx = canvas.getContext("2d")!;
                ctx.clearRect(0, 0, CANVAS_BOX, CANVAS_BOX);

                // Preserve aspect; center within 32×32; don't upscale smaller icons
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
                // @ts-ignore: not in older TS lib dom types, harmless at runtime
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, dx, dy, drawW, drawH);

                // Store as PNG data URL for OL Icon
                const dataUrl = canvas.toDataURL("image/png");
                this.setState({ pointIconSrc: dataUrl });
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    clearIcon = () => {
        this.setState({ pointIconSrc: undefined });
        if (this.fileInputRef.current) this.fileInputRef.current.value = "";
    };

    render() {
        const hasIcon = Boolean(this.state.pointIconSrc);
        const { showIconUpload = true } = this.props;   // NEW

        return (
            <React.Fragment>
                <fieldset>
                    <legend>Point Symbol</legend>

                    {/* Upload row: ONLY when allowed */}
                    {showIconUpload && (
                        <Box sx={{ flex: 1, pt: 1 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                <Button
                                    variant="outlined"
                                    onClick={() => this.fileInputRef.current?.click()}
                                >
                                    Upload Icon
                                </Button>

                                <Tooltip
                                    title="PNG or SVG. Icon will be auto-resized to fit within 32×32."
                                    placement="top"
                                    arrow
                                >
                                    <IconButton size="small" aria-label="Icon requirements">
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
                                                border: "1px solid rgba(0,0,0,0.15)",
                                            }}
                                        />
                                        <Button variant="text" color="error" onClick={this.clearIcon}>
                                            Clear
                                        </Button>
                                    </>
                                ) }
                            </Stack>
                        </Box>
                    )}

                    {/* Shape selector (you can disable when an icon is active if you prefer) */}
                    <Box sx={{ flex: 1, pt: 2 }}>
                        <FormControl fullWidth size="small" /* disabled={hasIcon} */>
                            <InputLabel id="select-value-label">Select Point Shape</InputLabel>
                            <DASelect
                                value={this.state.pointShape}
                                label="Select Point Shape"
                                onChange={(e) =>
                                    this.setState({ pointShape: (e.target as any).value as any })
                                }
                            >
                                {pointShapeTypes.map((value: any) => (
                                    <MenuItem key={`${value}-key`} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </DASelect>
                        </FormControl>
                    </Box>

                    {/* Size (applies to both vector shape & uploaded icon via scale) */}
                    <Box sx={{ flex: 1, pt: 2 }}>
                        <FormControl fullWidth size="small">
                            <TextField
                                type="number"
                                value={this.state.pointSize}
                                label="Select Point Size"
                                size="small"
                                onChange={(e) =>
                                    this.setState({
                                        pointSize: parseInt((e.target as any).value, 10),
                                    })
                                }
                                InputProps={{
                                    inputProps: { min: MIN_POINT_SIZE + 1, max: MAX_POINT_SIZE },
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
