import * as React from "react";
import {
    Box,
    Button,
    Divider,
    FormControlLabel,
    MenuItem,
    Stack,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { useMapVM } from "@damap/hooks/MapVMContext";
import PrintLayoutDialog from "@damap/components/map/map_layout/PrintLayoutDialog";
import type {
    Orientation,
    PageSize,
    MarginOption,
    ScaleOption,
    PrintLayoutSettings,
    LegendPosition,
} from "@damap/components/map/map_layout/types";

const PAGE_SIZES = [
    { value: "A4", label: "A4 - 210x297 mm" },
    { value: "A3", label: "A3 - 297x420 mm" },
    { value: "A2", label: "A2 - 420x594 mm" },
    { value: "Letter", label: "Letter - 216x279 mm" },
];

const MARGINS = [
    { value: "none", label: "none - 0 mm" },
    { value: "small", label: "small - 5 mm" },
    { value: "medium", label: "medium - 10 mm" },
    { value: "large", label: "large - 15 mm" },
];

const SCALES = [
    { value: "", label: "Auto" },
    { value: "500", label: "1:500" },
    { value: "1000", label: "1:1,000" },
    { value: "2500", label: "1:2,500" },
    { value: "5000", label: "1:5,000" },
    { value: "10000", label: "1:10,000" },
    { value: "25000", label: "1:25,000" },
    { value: "50000", label: "1:50,000" },
];

const PrintLayoutPanel = (): React.ReactElement => {
    const mapVM = useMapVM();

    const [orientation, setOrientation] = React.useState<Orientation>("portrait");
    const [pageSize, setPageSize] = React.useState<PageSize>("A4");
    const [margin, setMargin] = React.useState<MarginOption>("none");
    const [scale, setScale] = React.useState<ScaleOption>("");
    const [northArrow, setNorthArrow] = React.useState<boolean>(true);
    const [graticule, setGraticule] = React.useState<boolean>(true);
    const [showTitle, setShowTitle] = React.useState<boolean>(false);
    const [title, setTitle] = React.useState<string>("");
    const [legendPosition, setLegendPosition] =
        React.useState<LegendPosition>("inside-map");
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const settings = React.useMemo<PrintLayoutSettings>(
        () => ({
            orientation,
            pageSize,
            margin,
            scale,
            northArrow,
            graticule,
            showTitle,
            title: showTitle ? title : "",
            legendPosition,
        }),
        [
            orientation,
            pageSize,
            margin,
            scale,
            northArrow,
            graticule,
            showTitle,
            title,
            legendPosition,
        ]
    );

    const handleClose = React.useCallback(() => {
        mapVM.getRightDrawerRef().current?.closeDrawer();
    }, [mapVM]);

    return (
        <>
            <Box sx={{ width: "100%", p: 1.5 }}>
                <Stack spacing={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Print
                    </Typography>

                    <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Orientation
                        </Typography>

                        <ToggleButtonGroup
                            value={orientation}
                            exclusive
                            fullWidth
                            onChange={(_, value: Orientation | null) => {
                                if (value) setOrientation(value);
                            }}
                        >
                            <ToggleButton value="portrait">Portrait</ToggleButton>
                            <ToggleButton value="landscape">Landscape</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <TextField
                        select
                        label="Page size"
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as PageSize)}
                        size="small"
                        fullWidth
                    >
                        {PAGE_SIZES.map((item) => (
                            <MenuItem key={item.value} value={item.value}>
                                {item.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Margin"
                        value={margin}
                        onChange={(e) => setMargin(e.target.value as MarginOption)}
                        size="small"
                        fullWidth
                    >
                        {MARGINS.map((item) => (
                            <MenuItem key={item.value} value={item.value}>
                                {item.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Scale"
                        value={scale}
                        onChange={(e) => setScale(e.target.value as ScaleOption)}
                        size="small"
                        fullWidth
                    >
                        {SCALES.map((item) => (
                            <MenuItem key={item.value} value={item.value}>
                                {item.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={northArrow}
                                onChange={(e) => setNorthArrow(e.target.checked)}
                            />
                        }
                        label="North arrow"
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={graticule}
                                onChange={(e) => setGraticule(e.target.checked)}
                            />
                        }
                        label="Graticule"
                    />

                    <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Legend position
                        </Typography>

                        <ToggleButtonGroup
                            value={legendPosition}
                            exclusive
                            fullWidth
                            onChange={(_, value: LegendPosition | null) => {
                                if (value) setLegendPosition(value);
                            }}
                        >
                            <ToggleButton value="inside-map">Inside</ToggleButton>
                            <ToggleButton value="right-side">Right</ToggleButton>
                            <ToggleButton value="none">None</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={showTitle}
                                onChange={(e) => setShowTitle(e.target.checked)}
                            />
                        }
                        label="Map title"
                    />

                    {showTitle && (
                        <TextField
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            size="small"
                            fullWidth
                        />
                    )}

                    <Divider />

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            onClick={() => setDialogOpen(true)}
                            fullWidth
                        >
                            View Map Layout
                        </Button>

                        <Button variant="outlined" onClick={handleClose} fullWidth>
                            Cancel
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            <PrintLayoutDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                settings={settings}
            />
        </>
    );
};

export default PrintLayoutPanel;