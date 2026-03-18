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
    FormControl,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import { DASnackbarHandle } from "@/components/base/DASnackbar";
import type { IPreviewAppendPayload } from "@/components/admin/forms/shpfile/appendTypes";

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    previewPayload: IPreviewAppendPayload;
    finalMapping: Record<string, string>;
    setFinalMapping: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    unresolvedRequiredTargets: string[];
    handleBack: () => void;
    handleNext: () => void;
}

const DROP_VALUE = "__drop__";

const AppendShpMappingStep = (props: IProps) => {
    const { previewPayload, finalMapping, unresolvedRequiredTargets } = props;

    const targetColumns = previewPayload.target.column_names.filter(
        (c) => c !== previewPayload.target.geometry_column
    );

    const handleChange = (sourceCol: string, targetCol: string) => {
        props.setFinalMapping((prev) => {
            const next = { ...prev };

            if (targetCol === DROP_VALUE) {
                delete next[sourceCol];
                return next;
            }

            Object.keys(next).forEach((src) => {
                if (src !== sourceCol && next[src] === targetCol) {
                    delete next[src];
                }
            });

            next[sourceCol] = targetCol;
            return next;
        });
    };

    const canGoNext =
        previewPayload.geometry_compatible && unresolvedRequiredTargets.length === 0;

    return (
        <React.Fragment>
            <Grid container spacing={1}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1">Field Mapping</Typography>
                </Grid>

                {!!previewPayload.warnings?.length && (
                    <Grid size={{ xs: 12 }}>
                        {previewPayload.warnings.map((warning, idx) => (
                            <Alert key={idx} severity="warning" sx={{ mb: 1 }}>
                                {warning}
                            </Alert>
                        ))}
                    </Grid>
                )}

                {!previewPayload.geometry_compatible && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="error">
                            Source geometry is not compatible with target geometry.
                        </Alert>
                    </Grid>
                )}

                {unresolvedRequiredTargets.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="error">
                            Missing required target fields: {unresolvedRequiredTargets.join(", ")}
                        </Alert>
                    </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                    <Paper>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Source Field</TableCell>
                                    <TableCell>Target Field</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {previewPayload.source.columns.map((srcCol) => (
                                    <TableRow key={srcCol}>
                                        <TableCell>{srcCol}</TableCell>
                                        <TableCell>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={finalMapping[srcCol] || DROP_VALUE}
                                                    onChange={(e) =>
                                                        handleChange(srcCol, e.target.value as string)
                                                    }
                                                >
                                                    <MenuItem value={DROP_VALUE}>Drop</MenuItem>
                                                    {targetColumns.map((tgtCol) => (
                                                        <MenuItem key={tgtCol} value={tgtCol}>
                                                            {tgtCol}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
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
                        onClick={props.handleNext}
                        disabled={!canGoNext}
                    >
                        Next
                    </Button>
                </Grid>
            </Grid>
        </React.Fragment>
    );
};

export default AppendShpMappingStep;