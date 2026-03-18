import * as React from "react";
import {
    Alert,
    Button,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Radio,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import {
    CheckRounded,
    ClearRounded,
    CloudUploadRounded,
    FileCopyRounded,
} from "@mui/icons-material";

import { MapAPIs } from "@damap/api/MapApi";
import type { IPreviewAppendPayload } from "@damap/components/admin/forms/shpfile/appendTypes";
import { useMapVM } from "@damap/damap";
import OverlayVectorLayer from "@damap/components/map/layers/overlay_layers/OverlayVectorLayer";
import type { IFeatureStyle } from "@damap/types/typeDeclarations";
import {previewLayerUUID} from "@damap/components/admin/forms/shpfile/AppendShpWizard";

interface IGroupedShapeRow {
    name: string;
    files: File[];
    shp?: number;
    shx?: number;
    dbf?: number;
    prj?: number;
}

interface ILayerOption {
    title: string;
    layer_name: string;
    uuid: string;
    extent_3857?: string;
    category?: string;
}

interface IProps {
    onPreviewSuccess: (payload: IPreviewAppendPayload) => void;
    layerUUID?: string;
}

const AppendShpUploadStep = (props: IProps) => {
    const mapVM = useMapVM();

    const [rows, setRows] = React.useState<IGroupedShapeRow[]>([]);
    const [selectedValue, setSelectedValue] = React.useState<string>("");
    const [disablePreview, setDisablePreview] = React.useState(false);
    const [targetLayerUUID, setTargetLayerUUID] = React.useState<string>(props.layerUUID ?? "");
    const [layerOptions, setLayerOptions] = React.useState<ILayerOption[]>([]);


    React.useEffect(() => {
        if (props.layerUUID) {
            setTargetLayerUUID(props.layerUUID);
            return;
        }

        mapVM.api
            .get(MapAPIs.DCH_GET_ALL_LAYERS)
            .then((payload) => {
                if (Array.isArray(payload)) {
                    setLayerOptions(payload);
                } else {
                    setLayerOptions([]);
                }
            })
            .catch(() => {
                mapVM.getSnackbarRef().current?.show("Failed to load target layers", "error");
                setLayerOptions([]);
            });
    }, [mapVM, props.layerUUID]);

    // const clearPreviewLayer = React.useCallback(() => {
    //     const existing = mapVM.getOverlayLayer?.(previewLayerUUID.current) as OverlayVectorLayer;
    //     if (!existing) return;
    //
    //     const olLayer = existing.getOlLayer?.();
    //     if (olLayer) {
    //         mapVM.getMap()?.removeLayer(olLayer);
    //     }
    //
    //     if ((mapVM as any).overlayLayers?.[previewLayerUUID.current]) {
    //         delete (mapVM as any).overlayLayers[previewLayerUUID.current];
    //     }
    // }, [mapVM]);

    const showPreviewGeoJSON = React.useCallback((geojson: any) => {
        if (!geojson) return;

        // clearPreviewLayer();

        const previewStyle: IFeatureStyle = {
            type: "single",
            style: {
                default: {
                    strokeColor: "#ff9800",
                    strokeWidth: 2,
                    fillColor: "rgba(255,152,0,0.20)",
                    pointShape: "circle",
                    pointSize: 6,
                },
            },
        };
        let overlay = mapVM.getOverlayLayer(previewLayerUUID) as OverlayVectorLayer;
        // console.log("overlay", overlay);
        if(!overlay) {
             overlay = new OverlayVectorLayer(
                {
                    uuid: previewLayerUUID,
                    title: "Append Preview",
                    style: previewStyle,
                    showLabel: false,
                },
                mapVM
            );
        }
        // mapVM.addOverlayLayer(overlay)
        overlay.addGeojsonFeature(geojson, "EPSG:4326", true);
        // const overlay = mapVM.createOverlayLayer(uuid, geojson,"Append Preview", previewStyle)
        // console.log("overlay", overlay);


        overlay?.zoomToFeatures();
    }, [mapVM]);

    const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedValue(e.currentTarget.value);
    };

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files;
        if (!files) return;

        const grouped: IGroupedShapeRow[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const dotAt = file.name.lastIndexOf(".");
            const baseName = dotAt > -1 ? file.name.slice(0, dotAt) : file.name;
            const extension = dotAt > -1 ? file.name.slice(dotAt + 1).toLowerCase() : "";

            const existingRowIndex = grouped.findIndex((item) => item.name === baseName);
            const row =
                existingRowIndex === -1
                    ? { name: baseName, files: [] as File[] }
                    : grouped[existingRowIndex];

            row.files.push(file);

            if (["shp", "shx", "dbf", "prj"].includes(extension)) {
                row[extension as "shp" | "shx" | "dbf" | "prj"] = 1;
            }

            if (existingRowIndex === -1) grouped.push(row);
        }

        setRows(grouped);
        setSelectedValue("");
    };

    const handlePreview = async () => {
        const selectedRow = rows[parseInt(selectedValue, 10)];
        const finalLayerUUID = props.layerUUID || targetLayerUUID;

        if (!finalLayerUUID.trim()) {
            mapVM.getSnackbarRef().current?.show("Please select target layer", "warning");
            return;
        }

        if (!selectedRow) {
            mapVM.getSnackbarRef().current?.show("Please select a shapefile group", "warning");
            return;
        }

        if (!selectedRow.shp || !selectedRow.shx || !selectedRow.dbf) {
            mapVM.getSnackbarRef().current?.show("Selected shapefile is incomplete", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("layerUUID", finalLayerUUID);

        for (const file of selectedRow.files) {
            formData.append(file.name, file);
        }

        setDisablePreview(true);
        mapVM.getSnackbarRef().current?.show("Analyzing shapefile...", "info");

        try {
            const res = await mapVM.api.postFormData(MapAPIs.DCH_PREVIEW_APPEND_SHP, formData);
            const payload = res?.payload ?? res;

            if (payload) {
                if (payload.preview_geojson) {
                    showPreviewGeoJSON(payload.preview_geojson);
                }

                mapVM.getSnackbarRef().current?.show("Preview loaded successfully", "success");
                props.onPreviewSuccess(payload);
            } else {
                mapVM.getSnackbarRef().current?.show("Failed to generate preview", "error");
            }
        } catch {
            mapVM.getSnackbarRef().current?.show("Preview failed", "error");
        } finally {
            setDisablePreview(false);
        }
    };

    // React.useEffect(() => {
    //     return () => {
    //         clearPreviewLayer();
    //     };
    // }, [clearPreviewLayer]);

    return (
        <React.Fragment>
            <Grid container spacing={1} alignItems="flex-end">
                <Grid size={{ xs: 12 }}>
                    <Alert severity="info">
                        Select an existing target layer, then upload shapefile parts for preview.
                    </Alert>
                </Grid>

                {!props.layerUUID && (
                    <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="target-layer-label">Target Layer</InputLabel>
                            <Select
                                labelId="target-layer-label"
                                label="Target Layer"
                                value={targetLayerUUID}
                                onChange={(e) => setTargetLayerUUID(e.target.value)}
                            >
                                {layerOptions.map((layer) => (
                                    <MenuItem key={layer.uuid} value={layer.uuid}>
                                        {layer.title} ({layer.layer_name})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                    <Button variant="contained" fullWidth color="primary" component="label">
                        Select Files <FileCopyRounded />
                        <input
                            accept=".shp,.shx,.dbf,.prj"
                            type="file"
                            multiple
                            hidden
                            onChange={handleOnChange}
                        />
                    </Button>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Paper>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Select</TableCell>
                                    <TableCell>File Name</TableCell>
                                    <TableCell align="right">.shp</TableCell>
                                    <TableCell align="right">.shx</TableCell>
                                    <TableCell align="right">.dbf</TableCell>
                                    <TableCell align="right">.prj</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row, index) => (
                                    <TableRow key={row.name}>
                                        <TableCell>
                                            <Radio
                                                value={index}
                                                checked={selectedValue === index.toString()}
                                                onChange={handleSelectionChange}
                                            />
                                        </TableCell>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell align="right">
                                            {row.shp ? <CheckRounded color="success" /> : <ClearRounded color="error" />}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.shx ? <CheckRounded color="success" /> : <ClearRounded color="error" />}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.dbf ? <CheckRounded color="success" /> : <ClearRounded color="error" />}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.prj ? <CheckRounded color="success" /> : <ClearRounded color="error" />}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Button
                        variant="contained"
                        fullWidth
                        color="primary"
                        disabled={disablePreview}
                        onClick={handlePreview}
                    >
                        Preview Append <CloudUploadRounded />
                    </Button>
                </Grid>
            </Grid>
        </React.Fragment>
    );
};

export default AppendShpUploadStep;
