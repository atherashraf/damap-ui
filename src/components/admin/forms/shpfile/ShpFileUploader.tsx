// ShpFileUploader.tsx
import * as React from "react";
import {
    Button,
    Grid,
    Paper,
    Table,
    TableCell,
    TableHead,
    TableBody,
    TableRow,
    Radio,
    Box,
} from "@mui/material";
import {
    CheckRounded,
    ClearRounded,
    CloudUploadRounded,
    FileCopyRounded,
} from "@mui/icons-material";
import { DASnackbarHandle } from "@/components/base/DASnackbar";
import MapApi, { MapAPIs } from "@/api/MapApi";

// NEW: bring in your existing components & types
import LayerCategoryControl, { ILayerCategory } from "@/components/admin/forms/LayerCategoryControl";
import AddLayerCategoryForm from "@/components/admin/forms/AddLayerCategoryForm";

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    onSuccess?: () => void;
}

const ShpFileUploader = (props: IProps) => {
    const [rows, setRows] = React.useState<any[]>([]);
    const [selectedValue, setSelectedValue] = React.useState<string>("");
    const [disableUpload, setDisableUpload] = React.useState(false);

    // NEW: share the same category flow as PostGISInfo
    const [formType, setFormType] = React.useState<"LayerCategory" | null>(null);
    const [layerCategory, setLayerCategory] = React.useState<ILayerCategory | undefined>(undefined);

    const mapApi = React.useMemo(() => new MapApi(props.snackbarRef), [props.snackbarRef]);

    // Handle selection change (radio button)
    const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedValue(e.currentTarget.value);
    };

    // Handle when user selects files
    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files;
        if (!files) return;

        const nextRows: any[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const dotAt = file.name.lastIndexOf(".");
            const baseName = dotAt > -1 ? file.name.slice(0, dotAt) : file.name;
            const extension = dotAt > -1 ? file.name.slice(dotAt + 1).toLowerCase() : "";

            const existingRowIndex = nextRows.findIndex((item) => item.name === baseName);
            const row = existingRowIndex === -1 ? { name: baseName, files: [] as File[] } : nextRows[existingRowIndex];

            row.files.push(file);

            if (["shp", "shx", "dbf", "prj"].includes(extension)) {
                row[extension] = 1;
            }

            if (existingRowIndex === -1) nextRows.push(row);
        }

        setRows(nextRows);
    };

    // Upload selected shapefile
    const uploadShpFile = () => {
        const api = new MapApi(props.snackbarRef);
        const formData = new FormData();

        const selectedRow = rows[parseInt(selectedValue, 10)];
        if (!selectedRow) {
            props.snackbarRef.current?.show("Please select a file group to upload.", "warning");
            return;
        }

        if (!layerCategory?.pk) {
            props.snackbarRef.current?.show("Please select a layer category.", "warning");
            return;
        }

        // include files
        for (let file of selectedRow.files) {
            // backend reads via `await request.form()` and loops values -> safe to use filename as key
            formData.append(file.name, file);
        }

        // include chosen category (same key name you used in PostGIS flow)
        formData.append("layer_category_id", String(layerCategory.pk));

        props.snackbarRef.current?.show("Uploading...", "info");
        setDisableUpload(true);

        api.postFormData(MapAPIs.DCH_UPLOAD_SHP_FILE, formData).then((response) => {
            if (response) {
                props.snackbarRef.current?.show(response.msg ?? "Uploaded successfully", "success");
                props.onSuccess?.();
            } else {
                props.snackbarRef.current?.show("Failed to upload shapefile.", "error");
                setDisableUpload(false);
            }
        });
    };

    // If user clicks “+ Add Layer Category”, temporarily render the form (same as PostGISInfo)
    if (formType === "LayerCategory") {
        return (
            <AddLayerCategoryForm
                key="LayerCategoryForm"
                snackbarRef={props.snackbarRef}
                handleBack={() => setFormType(null)}
            />
        );
    }

    return (
        <React.Fragment>
            <form onSubmit={(e) => e.preventDefault()}>
                <Grid container spacing={1} alignItems="flex-end">
                    {/* NEW: Layer Category picker (same UX as PostGISInfo) */}
                    <Grid size={{xs:12}}>
                        <Box sx={{ my: 2 }}>
                            <LayerCategoryControl
                                api={mapApi}
                                setLayerCategory={setLayerCategory}
                                handleAddLayerCategory={() => setFormType("LayerCategory")}
                            />
                        </Box>
                    </Grid>

                    {/* File Upload Button */}
                    <Grid size={{xs:12}}>
                        <Button variant="contained" fullWidth color="primary" component="label">
                            Select Files <FileCopyRounded />
                            <input
                                id="shpfile"
                                name="shpfile"
                                accept=".shp,.shx,.dbf,.prj"
                                type="file"
                                multiple
                                hidden
                                onChange={handleOnChange}
                            />
                        </Button>
                    </Grid>

                    {/* Table to show uploaded file groups */}
                    <Grid size={{xs:12}}>
                        <Paper>
                            <Table>
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
                                                    name="radio-button"
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

                    {/* Upload Button */}
                    <Grid size={{xs:12}}>
                        <Button
                            variant="contained"
                            fullWidth
                            color="primary"
                            disabled={disableUpload}
                            onClick={uploadShpFile}
                        >
                            Upload Files <CloudUploadRounded />
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </React.Fragment>
    );
};

export default ShpFileUploader;
