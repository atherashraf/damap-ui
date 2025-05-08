/**
 * ShpFileUploader
 * -------------------
 *
 * A reusable component for uploading Shapefiles (.shp, .shx, .dbf, .prj).
 *
 * Features:
 * - Select multiple shapefile-related files
 * - Automatically group files by shapefile name
 * - Radio button to select which grouped set to upload
 * - Upload selected set via API (FormData)
 * - Show upload progress and Snackbar notifications
 *
 * Usage Example:
 * ---------------
 *
 * import ShpFileUploader from './ShpFileUploader';
 *
 * const snackbarRef = useRef<DASnackbarHandle>(null);
 *
 * <ShpFileUploader snackbarRef={snackbarRef} />
 *
 * Dependencies:
 * - DASnackbar (for toast notifications)
 * - MUI components (Button, Table, Radio, etc.)
 * - MapApi (for backend API calls)
 */

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
} from "@mui/material";
import {
    CheckRounded,
    ClearRounded,
    CloudUploadRounded,
    FileCopyRounded,
} from "@mui/icons-material";
import {DASnackbarHandle} from "@/components/base/DASnackbar";
import MapApi, {MapAPIs} from "@/api/MapApi";

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    onSuccess?: () => void;
}

const ShpFileUploader = (props: IProps) => {
    const [rows, setRows] = React.useState<any[]>([]);
    const [selectedValue, setSelectedValue] = React.useState<string>("");
    const [disableUpload, setDisableUpload] = React.useState(false);

    // Handle selection change (radio button)
    const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedValue(e.currentTarget.value);
    };

    // Handle when user selects files
    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files;
        if (!files) return;

        const rows: any[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileParts = file.name.split(".");
            const baseName = fileParts[0];
            const extension = fileParts[1];

            const existingRowIndex = rows.findIndex((item) => item.name === baseName);
            const row = existingRowIndex === -1 ? {name: baseName, files: []} : rows[existingRowIndex];

            row.files.push(file);

            if (["shp", "shx", "dbf", "prj"].includes(extension)) {
                row[extension] = 1;
            }

            if (existingRowIndex === -1) rows.push(row);
        }

        setRows(rows);
    };

    // Upload selected shapefile
    const uploadShpFile = () => {
        const api = new MapApi(props.snackbarRef);
        const formData = new FormData();

        const selectedRow = rows[parseInt(selectedValue)];
        if (!selectedRow) {
            props.snackbarRef.current?.show("Please select a file group to upload.", "warning");
            return;
        }

        for (let file of selectedRow.files) {
            formData.append(file.name, file);
        }

        props.snackbarRef.current?.show("Uploading...", "info");
        setDisableUpload(true);

        api.postFormData(MapAPIs.DCH_UPLOAD_SHP_FILE, formData).then((response) => {
            if (response) {
                props.snackbarRef.current?.show(response.msg, "success");
                props.onSuccess?.();
            } else {
                props.snackbarRef.current?.show("Failed to upload shapefile.", "error");
                setDisableUpload(false);
            }
        });
    };

    return (
        <React.Fragment>
            <form onSubmit={(e) => e.preventDefault()}>
                <Grid container spacing={1} alignItems="flex-end">
                    {/* File Upload Button */}
                    <Grid size={{xs: 12}}>
                        <Button
                            variant="contained"
                            fullWidth
                            color="primary"
                            component="label"
                        >
                            Select Files <FileCopyRounded/>
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
                    <Grid size={{xs: 12}}>
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
                                                {row.shp ? <CheckRounded color="success"/> :
                                                    <ClearRounded color="error"/>}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.shx ? <CheckRounded color="success"/> :
                                                    <ClearRounded color="error"/>}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.dbf ? <CheckRounded color="success"/> :
                                                    <ClearRounded color="error"/>}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.prj ? <CheckRounded color="success"/> :
                                                    <ClearRounded color="error"/>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>

                    {/* Upload Button */}
                    <Grid size={{xs: 12}}>
                        <Button
                            variant="contained"
                            fullWidth
                            color="primary"
                            disabled={disableUpload}
                            onClick={uploadShpFile}
                        >
                            Upload Files <CloudUploadRounded/>
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </React.Fragment>
    );
};

export default ShpFileUploader;
