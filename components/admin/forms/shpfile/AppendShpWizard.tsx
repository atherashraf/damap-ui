import * as React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { DASnackbarHandle } from "@damap/components/base/DASnackbar";

import type { ICommitAppendPayload, IPreviewAppendPayload } from "./appendTypes";
import AppendShpUploadStep from "@damap/components/admin/forms/shpfile/AppendShpUploadStep";
import AppendShpMappingStep from "@damap/components/admin/forms/shpfile/AppendShpMappingStep";
import AppendShpCommitStep from "@damap/components/admin/forms/shpfile/AppendShpCommitStep";
import { RightDrawerHandle } from "@damap/components/map/drawers/RightDrawer";

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    rightDrawerRef?: React.RefObject<RightDrawerHandle | null>;
    onSuccess?: () => void;
    layerUUID?: string;
}

export const previewLayerUUID = "append-preview-layer";

const AppendShpWizard = (props: IProps) => {
    const [step, setStep] = React.useState<0 | 1 | 2>(0);

    const [previewPayload, setPreviewPayload] = React.useState<IPreviewAppendPayload | null>(null);

    // IMPORTANT:
    // finalMapping is now TARGET -> SOURCE
    const [finalMapping, setFinalMapping] = React.useState<Record<string, string>>({});

    const [commitPayload, setCommitPayload] = React.useState<ICommitAppendPayload | null>(null);
    const [reprojectIfNeeded, setReprojectIfNeeded] = React.useState(true);

    const handlePreviewSuccess = (payload: IPreviewAppendPayload) => {
        setPreviewPayload(payload);

        // Backend auto_mapping is now expected as target -> source
        setFinalMapping(payload.auto_mapping || {});

        setStep(1);
        props.rightDrawerRef?.current?.setWidth(460);
    };

    const handleCommitSuccess = (payload: ICommitAppendPayload) => {
        setCommitPayload(payload);
        setStep(2);
        props.onSuccess?.();
    };

    const unresolvedRequiredTargets = React.useMemo(() => {
        if (!previewPayload) return [];

        const assignedTargets = new Set(
            Object.keys(finalMapping).map((v) => v.toLowerCase())
        );

        const geomCol = previewPayload.target.geometry_column?.toLowerCase();

        return (previewPayload.target.columns || [])
            .filter((col) => {
                const colName = col.name.toLowerCase();

                const isRequired =
                    typeof col.input_required === "boolean"
                        ? col.input_required
                        : col.nullable === false && !col.default;

                if (!isRequired) return false;
                if (colName === geomCol) return false;

                return !assignedTargets.has(colName);
            })
            .map((col) => col.name);
    }, [previewPayload, finalMapping]);

    return (
        <Box sx={{ width: "100%", p: 1 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
                <Chip label="1. Upload" color={step === 0 ? "primary" : "default"} size="small" />
                <Chip label="2. Mapping" color={step === 1 ? "primary" : "default"} size="small" />
                <Chip label="3. Commit" color={step === 2 ? "primary" : "default"} size="small" />
            </Stack>

            {step === 0 && (
                <AppendShpUploadStep
                    onPreviewSuccess={handlePreviewSuccess}
                    layerUUID={props.layerUUID}
                />
            )}

            {step === 1 && previewPayload && (
                <AppendShpMappingStep
                    snackbarRef={props.snackbarRef}
                    previewPayload={previewPayload}
                    finalMapping={finalMapping}
                    setFinalMapping={setFinalMapping}
                    unresolvedRequiredTargets={unresolvedRequiredTargets}
                    handleBack={() => setStep(0)}
                    handleNext={() => setStep(2)}
                />
            )}

            {step === 2 && previewPayload && (
                <AppendShpCommitStep
                    snackbarRef={props.snackbarRef}
                    previewPayload={previewPayload}
                    finalMapping={finalMapping}
                    reprojectIfNeeded={reprojectIfNeeded}
                    setReprojectIfNeeded={setReprojectIfNeeded}
                    commitPayload={commitPayload}
                    handleBack={() => setStep(1)}
                    onCommitSuccess={handleCommitSuccess}
                />
            )}
        </Box>
    );
};

export default AppendShpWizard;