import * as React from "react";
import {
    Alert,
    Box,
    Button,
    FormControl,
    Grid,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { DASnackbarHandle } from "@damap/components/base/DASnackbar";
import type { IPreviewAppendPayload } from "@damap/components/admin/forms/shpfile/appendTypes";

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    previewPayload: IPreviewAppendPayload;

    // IMPORTANT:
    // finalMapping is TARGET -> SOURCE
    finalMapping: Record<string, string>;
    setFinalMapping: React.Dispatch<React.SetStateAction<Record<string, string>>>;

    unresolvedRequiredTargets: string[];
    handleBack: () => void;
    handleNext: () => void;
}

const DROP_VALUE = "__drop__";

const AppendShpMappingStep = (props: IProps) => {
    const { previewPayload, finalMapping, unresolvedRequiredTargets } = props;

    const targetColumns = React.useMemo(() => {
        return (previewPayload.target.columns || []).filter(
            (col) => col.name !== previewPayload.target.geometry_column
        );
    }, [previewPayload]);

    const sourceColumns = React.useMemo(() => {
        return previewPayload.source.columns || [];
    }, [previewPayload]);

    const requiredTargetColumns = React.useMemo(() => {
        return new Set(
            targetColumns
                .filter((col) => {
                    if (typeof col.input_required === "boolean") {
                        return col.input_required;
                    }
                    return col.nullable === false && !col.default;
                })
                .map((col) => col.name.toLowerCase())
        );
    }, [targetColumns]);

    const handleChange = (targetCol: string, sourceCol: string) => {
        props.setFinalMapping((prev) => {
            const next = { ...prev };

            if (sourceCol === DROP_VALUE) {
                delete next[targetCol];
            } else {
                next[targetCol] = sourceCol;
            }

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
                                    <TableCell>Target Field</TableCell>
                                    <TableCell>Source Field</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {targetColumns.map((targetCol) => {
                                    const tgtName = targetCol.name;
                                    const isRequired = requiredTargetColumns.has(
                                        tgtName.toLowerCase()
                                    );

                                    return (
                                        <TableRow key={tgtName}>
                                            <TableCell>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        color: isRequired ? "error.main" : "inherit",
                                                        fontWeight: isRequired ? 700 : 400,
                                                    }}
                                                >
                                                    {tgtName}
                                                    {isRequired ? " *" : ""}
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={finalMapping[tgtName] || DROP_VALUE}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                tgtName,
                                                                e.target.value as string
                                                            )
                                                        }
                                                    >
                                                        <MenuItem value={DROP_VALUE}>
                                                            Drop
                                                        </MenuItem>

                                                        {sourceColumns.map((srcCol) => (
                                                            <MenuItem key={srcCol} value={srcCol}>
                                                                {srcCol}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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