/**
 * AddRasterLayerInfo
 * ------------------
 *
 * Form for adding a new Raster Layer.
 *
 * Features:
 * - Upload Raster and World files (or specify existing raster path)
 * - Select Layer Category
 * - Upload SLD file
 * - Set Temporal Resolution
 * - Submit form to backend
 * - Navigate to Layer Designer after creation
 * - Close Dialog after creating
 *
 * Usage:
 * Render inside DAFullScreenDialog like:
 *
 * <AddRasterLayerInfo snackbarRef={snackbarRef.current} dialogRef={dialogRef.current} />
 *
 * Dependencies:
 * - MapApi (for API calls)
 * - DASnackbar (notifications)
 * - DAFullScreenDialog (closing dialog)
 */

import * as React from "react";
import { useState, ChangeEvent } from "react";
import { Box, Button, TextField, InputLabel, MenuItem, FormControl, Select, SelectChangeEvent } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MapApi, { MapAPIs } from "@/api/MapApi.ts";
import LayerCategoryControl from "./LayerCategoryControl";
import AddLayerCategoryForm from "./AddLayerCategoryForm";
import { DASnackbarHandle } from "@/components/base/DASnackbar"; // ✅ Correct import
import { DAFullScreenDialogHandle } from "@/components/base/DAFullScreenDialog"; // ✅ Correct import

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    dialogRef: React.RefObject<DAFullScreenDialogHandle | null>;
}

interface ILayerCategory {
    pk: string;
    name: string;
}

const AddRasterLayerInfo: React.FC<IProps> = ({ snackbarRef, dialogRef }) => {
    const navigate = useNavigate();
    const snackbarRefObject = React.useRef(snackbarRef.current);

    const [formType, setFormType] = useState<"LayerCategory" | null>(null);
    const [rasterFile, setRasterFile] = useState<File>();
    const [worldFile, setWorldFile] = useState<File>();
    const [sldFile, setSldFile] = useState<File>();
    const [rasterFilePath, setRasterFilePath] = useState<string>("");
    const [worldFilePath, setWorldFilePath] = useState<string>("");
    const [rasterType, setRasterType] = useState("new");
    const [layerTitle, setLayerTitle] = useState<string>("");
    const [selectLayerCat, setSelectLayerCat] = useState<ILayerCategory>();
    const [temporalRes, setTemporalRes] = useState<string>("");
    const [uuid, setUUID] = useState<string>();

    const api = new MapApi(snackbarRefObject);

    const handleRasterFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setRasterFile(e.target.files[0]);
            setRasterFilePath(e.target.files[0].name);
        }
    };

    const handleWorldFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setWorldFile(e.target.files[0]);
            setWorldFilePath(e.target.files[0].name);
        }
    };

    const handleSldFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSldFile(e.target.files[0]);
        }
    };

    const handleUpdatedToChange = (event: SelectChangeEvent) => {
        setRasterType(event.target.value);
        if (event.target.value === "existing") {
            setRasterFilePath("");
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append("title", layerTitle);
        formData.append("isExisting", (rasterType === "existing").toString());

        if (rasterType === "existing") {
            formData.append("rasterFilePath", rasterFilePath);
        } else {
            if (rasterFile) formData.append("rasterFile", rasterFile);
            if (worldFile) formData.append("worldFile", worldFile);
        }

        if (selectLayerCat) formData.append("categoryId", selectLayerCat.pk);
        formData.append("temporal", temporalRes);
        if (sldFile) formData.append("sldFile", sldFile);

        const payload = await api.postFormData(MapAPIs.DCH_ADD_RASTER_INFO, formData);

        if (payload) {
            snackbarRef?.current?.show(payload.msg);
            setUUID(payload.uuid);
        }
    };

    return (
        <React.Fragment>
            {formType === "LayerCategory" ? (
                <AddLayerCategoryForm
                    snackbarRef={snackbarRef}
                    handleBack={() => setFormType(null)}
                />
            ) : (
                <Box sx={{ margin: "20px" }}>
                    <form onSubmit={handleSubmit}>
                        {/* Layer Title */}
                        <Box sx={{ marginBottom: "30px" }}>
                            <TextField
                                label="Layer Title"
                                variant="standard"
                                fullWidth
                                value={layerTitle}
                                onChange={(e) => setLayerTitle(e.target.value)}
                                required
                                error={!layerTitle}
                            />
                        </Box>

                        {/* Layer Category */}
                        <Box sx={{ marginBottom: "30px" }}>
                            <LayerCategoryControl
                                api={api}
                                setLayerCategory={(cat: ILayerCategory) => setSelectLayerCat(cat)}
                                handleAddLayerCategory={() => setFormType("LayerCategory")}
                            />
                        </Box>

                        {/* Raster Type */}
                        <Box sx={{ marginBottom: "30px" }}>
                            <FormControl variant="standard" fullWidth>
                                <InputLabel>Raster Type</InputLabel>
                                <Select
                                    value={rasterType}
                                    onChange={handleUpdatedToChange}
                                    label="Raster Type"
                                >
                                    <MenuItem value="new">New / Upload</MenuItem>
                                    <MenuItem value="existing">Existing</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Raster / World Files */}
                        {rasterType === "new" && (
                            <Box sx={{ marginBottom: "30px" }}>
                                <InputLabel>Select Raster File</InputLabel>
                                <Button variant="contained" component="label">
                                    Upload
                                    <input type="file" hidden onChange={handleRasterFileChange} />
                                </Button>
                                <TextField
                                    label="Raster File Path"
                                    variant="standard"
                                    fullWidth
                                    value={rasterFilePath}
                                    onChange={(e) => setRasterFilePath(e.target.value)}
                                    required
                                    error={!rasterFilePath}
                                    sx={{ mt: 2 }}
                                />
                            </Box>
                        )}

                        {/* World File */}
                        {rasterType === "new" && (
                            <Box sx={{ marginBottom: "30px" }}>
                                <InputLabel>Select World File</InputLabel>
                                <Button variant="contained" component="label">
                                    Upload
                                    <input type="file" hidden onChange={handleWorldFileChange} />
                                </Button>
                                <TextField
                                    label="World File Path"
                                    variant="standard"
                                    fullWidth
                                    value={worldFilePath}
                                    sx={{ mt: 2 }}
                                />
                            </Box>
                        )}

                        {/* Temporal Resolution */}
                        <Box sx={{ marginBottom: "30px" }}>
                            <InputLabel>Temporal Resolution (YYYY-MM-DD)</InputLabel>
                            <TextField
                                variant="standard"
                                fullWidth
                                value={temporalRes}
                                onChange={(e) => setTemporalRes(e.target.value)}
                                required
                                error={!temporalRes}
                            />
                        </Box>

                        {/* SLD */}
                        <Box sx={{ marginBottom: "30px" }}>
                            <InputLabel>Select SLD File</InputLabel>
                            <Button variant="contained" component="label">
                                Upload
                                <input type="file" hidden onChange={handleSldFileChange} />
                            </Button>
                            {sldFile && <p style={{ color: "black" }}>{sldFile.name}</p>}
                        </Box>

                        {/* Buttons */}
                        <Box sx={{ marginTop: "30px", display: "flex", gap: 2 }}>
                            <Button type="submit" variant="contained" color="primary">
                                Create Layer
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                disabled={!uuid}
                                onClick={() => navigate("/designer/" + uuid)}
                            >
                                Layer Designer
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => {
                                    dialogRef?.current?.handleClose();
                                    window.location.reload();
                                }}
                            >
                                Close
                            </Button>
                        </Box>
                    </form>
                </Box>
            )}
        </React.Fragment>
    );
};

export default AddRasterLayerInfo;
