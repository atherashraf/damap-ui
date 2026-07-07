import * as React from "react";
import {
    AppBar,
    Box,
    Button,
    Dialog,
    IconButton,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toPng } from "html-to-image";
import { useMapVM } from "@damap/hooks/MapVMContext";
import type { PrintLayoutSettings } from "@damap/components/map/map_layout/types";
import PrintMapPreview from "@damap/components/map/map_layout/PrintMapPreview";
import PrintLegendPanel from "@damap/components/map/map_layout/PrintLegendPanel";
import northArrowImg from "@damap/assets/img/NorthArrow.png";

interface PrintLayoutDialogProps {
    open: boolean;
    onClose: () => void;
    settings: PrintLayoutSettings;
}

const PAGE_MM = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
    A2: { width: 420, height: 594 },
    Letter: { width: 216, height: 279 },
} as const;

const MARGIN_MM = {
    none: 0,
    small: 5,
    medium: 10,
    large: 15,
} as const;

const MM_TO_PX = 3.7795275591;

const HEADER_H = 72;
const HEADER_H_EMPTY = 16;
const FOOTER_H = 34;
const GAP = 12;
const PAGE_PADDING = 14;
const LEGEND_W = 260;
const NORTH_ARROW_SIZE = 82;

const coordLabelSx = (position: any) => ({
    position: "absolute",
    ...position,
    fontSize: 13,
    fontWeight: 700,
    color: "black",
    bgcolor: "rgba(255,255,255,0.75)",
    px: 0.4,
    lineHeight: 1.2,
    textShadow: "1px 1px 2px white",
    zIndex: 21000,
});

const PrintLayoutDialog = ({
                               open,
                               onClose,
                               settings,
                           }: PrintLayoutDialogProps): React.ReactElement => {
    const mapVM = useMapVM();
    const previewRef = React.useRef<HTMLDivElement | null>(null);

    const pageSizePx = React.useMemo(() => {
        const base = PAGE_MM[settings.pageSize];
        const marginPx = MARGIN_MM[settings.margin] * MM_TO_PX;

        const rawWidth =
            settings.orientation === "portrait" ? base.width : base.height;
        const rawHeight =
            settings.orientation === "portrait" ? base.height : base.width;

        return {
            outerWidth: rawWidth * MM_TO_PX,
            outerHeight: rawHeight * MM_TO_PX,
            marginPx,
        };
    }, [settings]);

    const hasTitle = settings.showTitle && settings.title.trim() !== "";
    const showLegend = settings.legendPosition !== "none";
    const useRightLegend = settings.legendPosition === "right-side";
    const useInsideLegend = settings.legendPosition === "inside-map";

    const layout = React.useMemo(() => {
        const innerWidth =
            pageSizePx.outerWidth - pageSizePx.marginPx * 2 - PAGE_PADDING * 2;

        const innerHeight =
            pageSizePx.outerHeight - pageSizePx.marginPx * 2 - PAGE_PADDING * 2;

        const headerHeight = hasTitle ? HEADER_H : HEADER_H_EMPTY;
        const footerHeight = FOOTER_H;

        const legendWidth = useRightLegend ? LEGEND_W : 0;

        const contentTop = headerHeight + GAP;
        const contentHeight =
            innerHeight - headerHeight - footerHeight - GAP * 2;

        const mapWidth =
            innerWidth - legendWidth - (useRightLegend ? GAP : 0);

        const mapHeight = contentHeight;

        const rightColumnInnerHeight = mapHeight - PAGE_PADDING * 2;
        const legendHeight =
            rightColumnInnerHeight -
            (settings.northArrow ? NORTH_ARROW_SIZE + GAP : 0);

        return {
            innerWidth,
            innerHeight,
            headerHeight,
            footerHeight,
            contentTop,
            contentHeight,
            legendWidth,
            mapWidth,
            mapHeight,
            rightColumnInnerHeight,
            legendHeight,
        };
    }, [pageSizePx, hasTitle, useRightLegend, settings.northArrow]);

    const handlePrint = React.useCallback(() => {
        window.print();
    }, []);

    const handleSaveAsImage = React.useCallback(async () => {
        const node = previewRef.current;

        if (!node) {
            mapVM.showSnackbar("Print preview is not ready.");
            return;
        }

        try {
            mapVM.showSnackbar("Preparing image...");

            const dataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: "#ffffff",
                width: pageSizePx.outerWidth,
                height: pageSizePx.outerHeight,
                skipFonts: true,
                style: {
                    width: `${pageSizePx.outerWidth}px`,
                    height: `${pageSizePx.outerHeight}px`,
                    overflow: "hidden",
                    boxShadow: "none",
                    fontFamily: "Arial, sans-serif",
                },
            });

            const link = document.createElement("a");
            link.download = `damap-print-layout-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

            mapVM.showSnackbar("Image saved successfully.");
        } catch (error) {
            console.error("Save as image failed:", error);
            mapVM.showSnackbar(
                "Image export blocked by one map layer CORS. Please check WMS/XYZ/raster source crossOrigin."
            );
        }
    }, [mapVM, pageSizePx.outerWidth, pageSizePx.outerHeight]);

    const renderCoordinateFrame = React.useCallback(() => {
        if (!settings.graticule) return null;

        const lonLabels = [67, 68, 69, 70, 71, 72, 73, 74, 75];
        const latLabels = [35, 34, 33, 32, 31, 30, 29, 28, 27];

        return (
            <>
                {lonLabels.map((lon, i) => {
                    const left = `${4 + i * 11.5}%`;
                    return (
                        <React.Fragment key={`lon-${lon}`}>
                            <Typography sx={coordLabelSx({ top: 4, left })}>
                                {lon}°E
                            </Typography>
                            <Typography sx={coordLabelSx({ bottom: 4, left })}>
                                {lon}°E
                            </Typography>
                        </React.Fragment>
                    );
                })}

                {latLabels.map((lat, i) => {
                    const top = `${4 + i * 11.5}%`;
                    return (
                        <React.Fragment key={`lat-${lat}`}>
                            <Typography sx={coordLabelSx({ left: 4, top })}>
                                {lat}°N
                            </Typography>
                            <Typography sx={coordLabelSx({ right: 4, top })}>
                                {lat}°N
                            </Typography>
                        </React.Fragment>
                    );
                })}
            </>
        );
    }, [settings.graticule]);

    return (
        <Dialog fullScreen open={open} onClose={onClose}>
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }

                        #damap-print-page,
                        #damap-print-page * {
                            visibility: visible !important;
                        }

                        #damap-print-page {
                            position: fixed !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: ${pageSizePx.outerWidth}px !important;
                            height: ${pageSizePx.outerHeight}px !important;
                            box-shadow: none !important;
                            margin: 0 !important;
                            overflow: hidden !important;
                        }

                        @page {
                            size: ${settings.pageSize} ${settings.orientation};
                            margin: 0;
                        }
                    }
                `}
            </style>

            <AppBar sx={{ position: "relative" }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>

                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
                        Print Layout Preview
                    </Typography>

                    <Stack direction="row" spacing={1}>
                        <Button color="inherit" onClick={handleSaveAsImage}>
                            Save as Image
                        </Button>

                        <Button color="inherit" onClick={handlePrint}>
                            Print
                        </Button>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Box
                sx={{
                    width: "100%",
                    height: "calc(100vh - 64px)",
                    bgcolor: "#eaeaea",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    p: 2,
                    overflow: "auto",
                }}
            >
                <Box
                    id="damap-print-page"
                    ref={previewRef}
                    sx={{
                        width: `${pageSizePx.outerWidth}px`,
                        height: `${pageSizePx.outerHeight}px`,
                        bgcolor: "white",
                        boxShadow: 4,
                        position: "relative",
                        overflow: "hidden",
                        flexShrink: 0,
                        fontFamily: "Arial, sans-serif",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            inset: `${pageSizePx.marginPx}px`,
                            overflow: "hidden",
                            bgcolor: "#fff",
                        }}
                    >
                        <Box
                            sx={{
                                position: "absolute",
                                inset: `${PAGE_PADDING}px`,
                                overflow: "hidden",
                            }}
                        >
                            {hasTitle && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: `${layout.headerHeight}px`,
                                        borderBottom: "1px solid #222",
                                        display: "flex",
                                        alignItems: "center",
                                        px: 1.5,
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 28,
                                            fontWeight: 700,
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {settings.title}
                                    </Typography>
                                </Box>
                            )}

                            <Box
                                sx={{
                                    position: "absolute",
                                    left: 0,
                                    top: `${layout.contentTop}px`,
                                    width: `${layout.mapWidth}px`,
                                    height: `${layout.mapHeight}px`,
                                    border: "1px solid #111",
                                    overflow: "hidden",
                                    bgcolor: "#fff",
                                    boxSizing: "border-box",
                                }}
                            >
                                <PrintMapPreview settings={settings} />

                                <Box
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 20000,
                                        pointerEvents: "none",
                                    }}
                                >
                                    {renderCoordinateFrame()}
                                </Box>

                                {showLegend && useInsideLegend && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            right: 16,
                                            bottom: 16,
                                            zIndex: 22000,
                                        }}
                                    >
                                        <PrintLegendPanel
                                            availableHeight={Math.min(
                                                320,
                                                layout.mapHeight - 60
                                            )}
                                            width={260}
                                        />
                                    </Box>
                                )}
                            </Box>

                            {useRightLegend && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        right: 0,
                                        top: `${layout.contentTop}px`,
                                        width: `${layout.legendWidth}px`,
                                        height: `${layout.mapHeight}px`,
                                        overflow: "hidden",
                                        px: `${PAGE_PADDING}px`,
                                        py: `${PAGE_PADDING}px`,
                                        boxSizing: "border-box",
                                        border: "1px solid #d0d0d0",
                                        bgcolor: "#fff",
                                    }}
                                >
                                    {settings.northArrow && (
                                        <Box
                                            sx={{
                                                width: NORTH_ARROW_SIZE,
                                                height: NORTH_ARROW_SIZE,
                                                ml: "auto",
                                                mr: "auto",
                                                mb: `${GAP}px`,
                                                bgcolor: "rgba(255,255,255,0.95)",
                                                border: "1px solid rgba(0,0,0,0.35)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={northArrowImg}
                                                alt="North Arrow"
                                                sx={{
                                                    width: 68,
                                                    height: 68,
                                                    objectFit: "contain",
                                                    display: "block",
                                                }}
                                            />
                                        </Box>
                                    )}

                                    {showLegend && (
                                        <PrintLegendPanel
                                            availableHeight={Math.max(
                                                80,
                                                layout.legendHeight
                                            )}
                                            width="100%"
                                        />
                                    )}
                                </Box>
                            )}

                            {!useRightLegend && settings.northArrow && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: `${layout.contentTop + 16}px`,
                                        right: 16,
                                        width: NORTH_ARROW_SIZE,
                                        height: NORTH_ARROW_SIZE,
                                        zIndex: 23000,
                                        bgcolor: "rgba(255,255,255,0.95)",
                                        border: "1px solid rgba(0,0,0,0.35)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={northArrowImg}
                                        alt="North Arrow"
                                        sx={{
                                            width: 68,
                                            height: 68,
                                            objectFit: "contain",
                                            display: "block",
                                        }}
                                    />
                                </Box>
                            )}

                            <Box
                                sx={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: `${layout.footerHeight}px`,
                                    bgcolor: "black",
                                    color: "yellow",
                                    px: 1.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    boxSizing: "border-box",
                                }}
                            >
                                <Typography variant="caption">
                                    Prepared By: DAMap
                                </Typography>

                                <Typography variant="caption">
                                    Scale: {settings.scale ? `1:${settings.scale}` : "Auto"}
                                </Typography>

                                <Typography variant="caption">
                                    Print Date: {new Date().toDateString()}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

export default PrintLayoutDialog;