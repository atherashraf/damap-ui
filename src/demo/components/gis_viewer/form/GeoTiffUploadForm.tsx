import React, { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    LinearProgress,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {getMapVM, MapApi, MapAPIs} from "@damap/damap";
// import RasterTileLayer from "@/components/map/layers/da_layers/RasterTileLayer";

// import { DASnackbarHandle } from "@/components/base/DASnackbar";

// type Props = {
//     api: MapApi;
// };

export default function GeoTiffUploadForm() {

    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string>("");
    const [result, setResult] = useState<any>(null);

    const mapVM = getMapVM()
    const snackbarREf =  mapVM.getSnackbarRef();
    const api = new MapApi(snackbarREf);

    const fileHint = useMemo(() => {
        if (!file) return "Only .tif / .tiff";
        return `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    }, [file]);

    const isGeoTiff = (f: File) => {
        const n = f.name.toLowerCase();
        return n.endsWith(".tif") || n.endsWith(".tiff");
    };

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setResult(null);
        const f = e.target.files?.[0] ?? null;

        if (!f) {
            setFile(null);
            return;
        }
        if (!isGeoTiff(f)) {
            setFile(null);
            setError("Please select a GeoTIFF (.tif or .tiff).");
            return;
        }

        setFile(f);
        if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
    };

    const onUpload = async () => {
        setError("");
        setResult(null);

        if (!file) {
            setError("Please choose a GeoTIFF first.");
            return;
        }

        const fd = new FormData();
        fd.append("data_file", file);     // backend expects data_file
        fd.append("title", title || "");  // optional

        setUploading(true);
        try {
            // IMPORTANT: useJsonHeader MUST be false inside postFormData (your MapApi already does that)
            const res = await api.postFormData(MapAPIs.PDMA_DCH_UPLOAD_RASTER, fd, {}, { isJSON: true });
            if (!res) {
                setError("Upload failed (no response). Check snackbar for details.");
                return;
            }
            setResult(res);


        } catch (err: any) {
            setError(err?.message || "Upload failed.");
        } finally {
            setUploading(false);
        }
    };
    const handleAddRasterLayer = () => {
        const uuid = "b4db702a8f014c9ea06ec2a05828fa65"
        const layerInfo = {
            uuid: uuid,
            name: uuid,
            title: "flood rp",
            dataModel: "R",
            dataURL: MapApi.getURL(MapAPIs.PDMA_DCH_RASTER_TMS, {uuid: uuid})
        }
        // const rasterLayer = new RasterTileLayer(layerInfo, mapVM);
        mapVM.addRasterLayer(layerInfo);

    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={2}>
                    <Typography variant="h6">Upload GeoTIFF</Typography>

                    {error ? <Alert severity="error">{error}</Alert> : null}
                    {result ? (
                        <Alert severity="success">
                            Uploaded ✅ UUID: <b>{result.uuid}</b>
                        </Alert>
                    ) : null}

                    <TextField
                        size="small"
                        label="Title (optional)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                    />

                    <Box>
                        <Button variant="contained" component="label" disabled={uploading}>
                            Choose GeoTIFF
                            <input hidden type="file" accept=".tif,.tiff,image/tiff" onChange={onPick} />
                        </Button>

                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                            {fileHint}
                        </Typography>
                    </Box>

                    {uploading ? <LinearProgress /> : null}

                    <Button variant="contained" disabled={!file || uploading} onClick={onUpload}>
                        Upload
                    </Button>
                    <Button variant="contained"  onClick={handleAddRasterLayer}>
                        Add Layer
                    </Button>

                    {result?.saved_path ? (
                        <Typography variant="body2">
                            Saved path: <code>{result.saved_path}</code>
                        </Typography>
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
    );
}
