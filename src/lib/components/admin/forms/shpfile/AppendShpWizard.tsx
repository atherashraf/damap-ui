import * as React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { DASnackbarHandle } from "@/components/base/DASnackbar";

import type { ICommitAppendPayload, IPreviewAppendPayload } from "./appendTypes";
import AppendShpUploadStep from "@/components/admin/forms/shpfile/AppendShpUploadStep";
import AppendShpMappingStep from "@/components/admin/forms/shpfile/AppendShpMappingStep";
import AppendShpCommitStep from "@/components/admin/forms/shpfile/AppendShpCommitStep";
import {RightDrawerHandle} from "@/components/map/drawers/RightDrawer";

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
    const [finalMapping, setFinalMapping] = React.useState<Record<string, string>>({});
    const [commitPayload, setCommitPayload] = React.useState<ICommitAppendPayload | null>(null);
    const [reprojectIfNeeded, setReprojectIfNeeded] = React.useState(true);

    const handlePreviewSuccess = (payload: IPreviewAppendPayload) => {
        setPreviewPayload(payload);
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
        const mappedTargets = new Set(Object.values(finalMapping));
        return (previewPayload.missing_required_target_columns || []).filter(
            (col) => !mappedTargets.has(col)
        );
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