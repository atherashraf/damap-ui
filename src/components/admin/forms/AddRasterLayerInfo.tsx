import * as React from "react";
import {useState, ChangeEvent, useEffect} from "react";
import {
    Box,
    Button,
    TextField,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    SelectChangeEvent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import LayerCategoryControl from "./LayerCategoryControl";
import AddLayerCategoryForm from "./AddLayerCategoryForm";
import { DASnackbarHandle } from "@/components/base/DASnackbar";
import { DAFullScreenDialogHandle } from "@/components/base/DAFullScreenDialog";
import MapApi, {MapAPIs} from "@/api/MapApi.ts";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';



interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    dialogRef: React.RefObject<DAFullScreenDialogHandle | null>;
    onSuccess?: () => void;
}

interface ILayerCategory {
    pk: string;
    name: string;
}

const AddRasterLayerInfo: React.FC<IProps> = ({ snackbarRef, dialogRef, onSuccess }) => {
    const navigate = useNavigate();
    const api = new MapApi(snackbarRef);

    const [formType, setFormType] = useState<"LayerCategory" | null>(null);
    const [rasterType, setRasterType] = useState<"new" | "existing">("new");
    const [rasterFile, setRasterFile] = useState<File>();
    const [rasterFilePath, setRasterFilePath] = useState<string>("");
    const [layerTitle, setLayerTitle] = useState<string>("");
    const [selectLayerCat, setSelectLayerCat] = useState<ILayerCategory>();
    const [temporalRes, setTemporalRes] = useState<Date | null>(null);
    const [dataModelTypes, setDataModelTypes] = useState<{ key: string; value: string }[]>([]);
    const [data_model_type, setData_model_type] = useState<string>("");
    const [uuid, setUUID] = useState<string>();

    useEffect(() => {
        api.get(MapAPIs.DCH_DATA_MODEL_TYPES).then((res) => {
            setDataModelTypes(res);
        });
    }, []);

    const handleRasterFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setRasterFile(e.target.files[0]);
            setRasterFilePath(e.target.files[0].name);
        }
    };

    const handleRasterTypeChange = (event: SelectChangeEvent) => {
        const val = event.target.value as "new" | "existing";
        setRasterType(val);
        if (val === "existing") {
            setRasterFile(undefined);
            setRasterFilePath("");
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append("title", layerTitle);
        formData.append("isExisting", (rasterType === "existing").toString());
        formData.append("temporal", temporalRes ? temporalRes.toISOString().split("T")[0] : "");
        formData.append("data_model_type", data_model_type);

        if (selectLayerCat) formData.append("categoryId", selectLayerCat.pk);

        if (rasterType === "new") {
            if (!rasterFile) {
                snackbarRef.current?.show("Please select a raster file.");
                return;
            }
            formData.append("rasterFile", rasterFile);
        } else {
            if (!rasterFilePath) {
                snackbarRef.current?.show("Please enter the server file path.");
                return;
            }
            formData.append("rasterFilePath", rasterFilePath);
        }

        const payload = await api.postFormData(MapAPIs.DCH_ADD_RASTER_INFO, formData);

        if (payload) {
            snackbarRef.current?.show(payload.msg);
            setUUID(payload.uuid);
            onSuccess?.();
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
                        <Box sx={{ marginBottom: "30px" }}>
                            <TextField
                                label="Layer Title"
                                variant="standard"
                                fullWidth
                                value={layerTitle}
                                onChange={(e) => setLayerTitle(e.target.value)}
                                required
                            />
                        </Box>

                        <Box sx={{ marginBottom: "30px" }}>
                            <LayerCategoryControl
                                api={api}
                                setLayerCategory={(cat: ILayerCategory) => setSelectLayerCat(cat)}
                                handleAddLayerCategory={() => setFormType("LayerCategory")}
                            />
                        </Box>
                        <FormControl variant="standard" fullWidth sx={{ marginBottom: "30px" }}>
                            <InputLabel>Layer Data Model</InputLabel>
                            <Select
                                value={data_model_type}
                                onChange={(e) => setData_model_type(e.target.value)}
                                label="Model Type"
                                required
                            >
                                {dataModelTypes.map((type) => (
                                    <MenuItem key={type.key} value={type.key}>
                                        {type.value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>


                        {/* Raster Type Dropdown */}
                        <Box sx={{ marginBottom: "30px" }}>
                            <FormControl variant="standard" fullWidth>
                                <InputLabel>Raster Type</InputLabel>
                                <Select
                                    value={rasterType}
                                    onChange={handleRasterTypeChange}
                                    label="Raster Type"
                                >
                                    <MenuItem value="new">New / Upload</MenuItem>
                                    <MenuItem value="existing">Existing</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Conditional Raster Upload or Path Field */}
                        {rasterType === "new" ? (
                            <Box sx={{ marginBottom: "30px" }}>
                                <InputLabel>Select Raster File</InputLabel>
                                <Button variant="contained" component="label">
                                    Upload
                                    <input type="file" hidden onChange={handleRasterFileChange} />
                                </Button>
                                {rasterFilePath && <TextField value={rasterFilePath} fullWidth sx={{ mt: 2 }} />}
                            </Box>
                        ) : (
                            <Box sx={{ marginBottom: "30px" }}>
                                <TextField
                                    label="Raster File Path (on server)"
                                    variant="standard"
                                    fullWidth
                                    value={rasterFilePath}
                                    onChange={(e) => setRasterFilePath(e.target.value)}
                                    required
                                />
                            </Box>
                        )}

                        {/* Temporal Field */}
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Temporal Resolution"
                                value={temporalRes}
                                onChange={(newValue) => {
                                    setTemporalRes(newValue);
                                }}
                                slotProps={{
                                    textField: {
                                        variant: "standard",
                                        fullWidth: true
                                    }
                                }}
                            />
                        </LocalizationProvider>


                        {/* Action Buttons */}
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
