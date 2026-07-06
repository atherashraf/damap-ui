import * as React from "react";
import {
    Alert,
    Button,
    FormControlLabel,
    Grid,
    Paper,
    Switch,
    Typography,
} from "@mui/material";
import { DASnackbarHandle } from "@damap/components/base/DASnackbar";
import { MapAPIs } from "@damap/api/MapApi";
import type {
    ICommitAppendPayload,
    IPreviewAppendPayload,
} from "@damap/components/admin/forms/shpfile/appendTypes";
import { useMapVM } from "@damap/damap";
import { useParams } from "react-router-dom";

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    previewPayload: IPreviewAppendPayload;

    // IMPORTANT:
    // finalMapping is TARGET -> SOURCE
    finalMapping: Record<string, string>;

    reprojectIfNeeded: boolean;
    setReprojectIfNeeded: (value: boolean) => void;
    commitPayload: ICommitAppendPayload | null;
    handleBack: () => void;
    onCommitSuccess: (payload: ICommitAppendPayload) => void;
}

const AppendShpCommitStep = (props: IProps) => {
    const [disableCommit, setDisableCommit] = React.useState(false);
    const mapVM = useMapVM();
    const { layerId } = useParams();

    const handleCommit = async () => {
        const formData = new FormData();
        formData.append("upload_id", props.previewPayload.upload_id);
        formData.append("target_table", props.previewPayload.target.table);
        formData.append("target_schema", props.previewPayload.target.schema || "public");

        // Send mapping as TARGET -> SOURCE
        formData.append("final_mapping", JSON.stringify(props.finalMapping));

        formData.append("reproject_if_needed", String(props.reprojectIfNeeded));

        // @ts-ignore
        formData.append("layer_uuid", layerId);

        setDisableCommit(true);
        props.snackbarRef.current?.show("Appending shapefile...", "info");

        try {
            const payload = await mapVM.api.postFormData(
                MapAPIs.DCH_COMMIT_APPEND_SHP,
                formData
            );

            if (payload) {
                props.snackbarRef.current?.show(payload.msg || "Append successful", "success");
                props.onCommitSuccess(payload);

                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                props.snackbarRef.current?.show("Append failed", "error");
                setDisableCommit(false);
            }
        } catch {
            setDisableCommit(false);
        }
    };

    const usedSources = new Set(Object.values(props.finalMapping));

    const droppedColumns = props.previewPayload.source.columns.filter(
        (src) => !usedSources.has(src)
    );

    return (
        <React.Fragment>
            <Grid container spacing={1}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1">Confirm Append</Typography>
                </Grid>

                {!props.commitPayload ? (
                    <>
                        <Grid size={{ xs: 12 }}>
                            <Alert severity="info">
                                Review settings and commit append to the target table.
                            </Alert>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 1.5 }}>
                                <Typography variant="body2">
                                    <strong>Target Table:</strong>{" "}
                                    {props.previewPayload.target.schema}.{props.previewPayload.target.table}
                                </Typography>

                                <Typography variant="body2">
                                    <strong>Mapped Fields:</strong>{" "}
                                    {Object.keys(props.finalMapping).length}
                                </Typography>

                                <Typography variant="body2">
                                    <strong>Dropped Source Fields:</strong>{" "}
                                    {droppedColumns.length ? droppedColumns.join(", ") : "None"}
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={props.reprojectIfNeeded}
                                        onChange={(e) => props.setReprojectIfNeeded(e.target.checked)}
                                    />
                                }
                                label="Reproject if CRS does not match"
                            />
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                            <Button variant="outlined" fullWidth onClick={props.handleBack}>
                                Back
                            </Button>
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                disabled={disableCommit}
                                onClick={handleCommit}
                            >
                                Commit Append
                            </Button>
                        </Grid>
                    </>
                ) : (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="success">
                            {props.commitPayload.msg}. Appended rows: {props.commitPayload.appended_rows}
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </React.Fragment>
    );
};

export default AppendShpCommitStep;