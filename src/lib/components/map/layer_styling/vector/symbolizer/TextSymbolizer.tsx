import React, {useEffect, useState} from "react";
import {
    Box,
    TextField,
    MenuItem,
    Grid,
    Typography,
    Button,
    Paper,
} from "@mui/material";
import DAColorPicker from "@/components/map/layer_styling/DAColorPicker";
import {ITextStyle} from "@/types/typeDeclarations";
import ColorUtils from "@/utils/colorUtils";

interface TextStyleFormProps {
    initialStyle?: ITextStyle;
    labelField?: string
    onApply: (textStyle: ITextStyle, label: string) => void;
    labels: string[]
}

const DEFAULT_FONT_FAMILY = "Arial, Sans-serif";
const FONT_FAMILY_OPTIONS = ["Arial", "Sans-serif", "Times New Roman", "Georgia", "Courier New"];

const TextSymbolizer: React.FC<TextStyleFormProps> = ({
                                                          initialStyle = {
                                                              offsetX: 0,
                                                              offsetY: 0,
                                                              fillColor: ColorUtils.getRandomHexColor(),
                                                              strokeColor: ColorUtils.getRandomHexColor(),
                                                              strokeWidth: 1
                                                          }, labelField, onApply, labels
                                                      }) => {
    const [style, setStyle] = useState<ITextStyle>(initialStyle);
    const [selectedLabel, setSelectedLabel] = useState<string>(labelField || labels[0]);

    function getFontSize(font?: string): number {
        if (!font) return 12;
        const match = font.match(/(\d+(?:\.\d+)?)px/);
        return match ? parseFloat(match[1]) : 12;
    }

    function getFirstFontFamily(font?: string): string | undefined {
        if (!font) return undefined;

        // Remove font size part (e.g., "20px")
        const fontWithoutSize = font.replace(/^\s*\d+(?:\.\d+)?px\s*/, '');

        // Split by comma and return the first trimmed font family
        const families = fontWithoutSize.split(',').map(f => f.trim().replace(/^["']|["']$/g, ''));
        return families[0] || undefined;
    }

    // Extract fontSize and fontFamily from initial font string (if provided)
    const fs = getFontSize(initialStyle.font);
    const family = getFirstFontFamily(initialStyle.font)
    const [fontSize, setFontSize] = useState<number>(fs);
    const [fontFamily, setFontFamily] = useState<string>(family || "Arial");

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedLabel(e.target.value);
    };

    useEffect(() => {
        if (initialStyle.font) {
            const parts = initialStyle.font.split(" ");
            const sizePart = parts.find((p) => p.endsWith("px"));
            if (sizePart) {
                setFontSize(parseInt(sizePart));
            }
            const familyPart = parts.slice(parts.indexOf(sizePart!) + 1).join(" ");
            setFontFamily(familyPart || DEFAULT_FONT_FAMILY);
        }
    }, [initialStyle.font]);

    const updateFont = (newSize: number, newFamily: string) => {
        const fallback = "Arial, Sans-serif";
        const fullFont = `${newSize}px ${newFamily}, ${fallback}`;
        setStyle((prev) => ({
            ...prev,
            font: fullFont,
        }));
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const size = parseInt(e.target.value);
        setFontSize(size);
        updateFont(size, fontFamily);
    };

    const handleFontFamilyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const family = e.target.value;
        setFontFamily(family);
        updateFont(fontSize, family);
    };

    const handleChange = (field: keyof ITextStyle, value: any) => {
        setStyle((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleApply = () => {
        style
        onApply(style, selectedLabel);
    };

    return (
        <Box p={1}>
            <Typography variant="h6" gutterBottom>
                Text Style
            </Typography>
            <Paper elevation={3} sx={{p: 2, mb: 2}}>
                <Grid container spacing={1.5}>
                    <Grid size={{xs: 12}}>
                        <TextField
                            select
                            fullWidth
                            label="Label Field"
                            value={selectedLabel}
                            onChange={handleLabelChange}
                        >
                            {labels.map((label) => (
                                <MenuItem key={label} value={label}>
                                    {label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{xs: 12}}>
                        <TextField
                            type="number"
                            label="Font Size (px)"
                            fullWidth
                            value={fontSize}
                            onChange={handleFontSizeChange}
                        />
                    </Grid>

                    <Grid size={{xs: 12}}>
                        <TextField
                            select
                            fullWidth
                            label="Font Family"
                            value={fontFamily}
                            onChange={handleFontFamilyChange}
                        >
                            {FONT_FAMILY_OPTIONS.map((font) => (
                                <MenuItem key={font} value={font}>
                                    {font}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{xs: 6}}>
                        <DAColorPicker
                            label="Fill Color"
                            color={style.fillColor}
                            isAlpha={true}
                            onChange={(color) => handleChange("fillColor", color)}
                        />
                    </Grid>

                    <Grid size={{xs: 6}}>
                        <DAColorPicker
                            label="Stroke Color"
                            color={style.strokeColor}
                            isAlpha={true}
                            onChange={(color) => handleChange("strokeColor", color)}
                        />
                    </Grid>

                    <Grid size={{xs: 12}}>
                        <TextField
                            type="number"
                            label="Stroke Width"
                            fullWidth
                            value={style.strokeWidth ?? 1}
                            onChange={(e) => handleChange("strokeWidth", parseFloat(e.target.value))}
                        />
                    </Grid>

                    <Grid size={{xs: 12}}>
                        <TextField
                            select
                            fullWidth
                            label="Placement"
                            value={style.placement || "point"}
                            onChange={(e) => handleChange("placement", e.target.value)}
                        >
                            <MenuItem value="point">Point</MenuItem>
                            <MenuItem value="line">Line</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{xs: 6}}>
                        <TextField
                            type="number"
                            label="Offset X"
                            fullWidth
                            value={style.offsetX ?? ""}
                            onChange={(e) => handleChange("offsetX", parseFloat(e.target.value))}
                        />
                    </Grid>

                    <Grid size={{xs: 6}}>
                        <TextField
                            type="number"
                            label="Offset Y"
                            fullWidth
                            value={style.offsetY ?? 0}
                            onChange={(e) => handleChange("offsetY", parseFloat(e.target.value))}
                        />
                    </Grid>

                    <Grid size={{xs: 12}}>
                        <Button fullWidth variant="contained" onClick={handleApply}>
                            Apply Style
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default TextSymbolizer;
