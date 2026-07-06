import * as React from "react";
import {
    Alert,
    Box,
    Button,
    Divider,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SaveIcon from "@mui/icons-material/Save";
import ClearIcon from "@mui/icons-material/Clear";

import { MapAPIs } from "@damap/api/MapApi";
import AttributeTableManager from "@damap/components/map/manager/AttributeTableManager";
import { getMapApi } from "@/libs/damap";

const CRS_OPTIONS = [
    { value: 3857, label: "Web Mercator / Online Maps (EPSG:3857)" },
    { value: 4326, label: "WGS84 / Lat-Lon (EPSG:4326)" },
    { value: 32642, label: "UTM Zone 42N (EPSG:32642)" },
    { value: 32643, label: "UTM Zone 43N (EPSG:32643)" },
];

type GeometryUploadFormProps = {
    pkObject: Record<string, any>;
    layerUuid: string;
    tableManager: AttributeTableManager;
};

export default function GeometryUploadForm({
                                               pkObject,
                                               layerUuid,
                                               tableManager,
                                           }: GeometryUploadFormProps) {
    const [file, setFile] = React.useState<File | null>(null);
    const [sourceSrid, setSourceSrid] = React.useState<number>(3857);
    const [error, setError] = React.useState("");
    const [isUploading, setIsUploading] = React.useState(false);

    const mapVM = tableManager.getMapVM();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] ?? null;

        if (!selectedFile) {
            setFile(null);
            return;
        }

        const fileName = selectedFile.name.toLowerCase();

        if (!fileName.endsWith(".geojson") && !fileName.endsWith(".json")) {
            setError("Please upload GeoJSON only (.geojson or .json).");
            setFile(null);
            event.target.value = "";
            return;
        }

        setError("");
        setFile(selectedFile);
    };

    const handleClear = () => {
        setFile(null);
        setError("");
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select GeoJSON file first.");
            return;
        }

        try {
            setIsUploading(true);
            mapVM.getMapLoadingRef().current?.openIsLoading();

            const api = getMapApi();

            const formData = new FormData();
            formData.append("file", file);
            formData.append("pk_object", JSON.stringify(pkObject));
            formData.append("source_srid", String(sourceSrid));

            const result = await api.postFormData(
                MapAPIs.DCH_UPLOAD_ROW_GEOMETRY,
                formData,
                { uuid: layerUuid }
            );

            if (result !== null) {
                mapVM.showSnackbar("Geometry uploaded successfully", "success");
                await tableManager.refresh();
                mapVM.getRightDrawerRef().current?.closeDrawer();
            }
        } catch (err: any) {
            console.error("Upload geometry error:", err);
            mapVM.showSnackbar(
                err?.message || "Failed to upload geometry",
                "error"
            );
        } finally {
            setIsUploading(false);
            mapVM.getMapLoadingRef().current?.closeIsLoading();
        }
    };

    return (
        <Box sx={{ width: "100%", p: 2 }}>
            <Stack spacing={2}>
                <Alert severity="info">
                    Upload one GeoJSON feature only. Properties are ignored;
                    only geometry is used.
                </Alert>

                <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2">
                        Selected Feature PK
                    </Typography>

                    {Object.entries(pkObject).map(([key, value]) => (
                        <Typography key={key} variant="body2" sx={{ mt: 0.5 }}>
                            <strong>{key}:</strong> {String(value)}
                        </Typography>
                    ))}
                </Paper>

                <Divider />

                <TextField
                    select
                    size="small"
                    label="Uploaded GeoJSON CRS"
                    value={sourceSrid}
                    onChange={(e) => setSourceSrid(Number(e.target.value))}
                    helperText="Default is WGS84. Change only if GeoJSON coordinates are in another CRS."
                    disabled={isUploading}
                    fullWidth
                >
                    {CRS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>

                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    disabled={isUploading}
                >
                    Select GeoJSON File
                    <input
                        hidden
                        type="file"
                        accept=".geojson,.json"
                        onChange={handleFileChange}
                    />
                </Button>

                {file && (
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="body2">
                            <strong>File:</strong> {file.name}
                        </Typography>

                        <Typography variant="body2">
                            <strong>Size:</strong>{" "}
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                    </Paper>
                )}

                {error && <Alert severity="error">{error}</Alert>}

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={!file || isUploading}
                        onClick={handleUpload}
                    >
                        {isUploading ? "Uploading..." : "Upload Geometry"}
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        disabled={isUploading}
                        onClick={handleClear}
                    >
                        Clear
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}