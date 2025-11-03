// src/components/map/MapMessageChip.tsx
import React, {
    forwardRef,
    useImperativeHandle,
    useMemo,
    useState,
    useCallback,
    createRef,
    ReactNode,
} from "react";
import { Paper, Button, Stack } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export const mapMessageChipRef = createRef<MapMessageChipHandle>();

export type MapMessageAction = {
    label: string;
    onClick: () => void;
    color?: "inherit" | "primary" | "secondary" | "success" | "error" | "warning" | "info";
    variant?: "text" | "outlined" | "contained";
};

export type SeverityType = "info" | "success" | "warning" | "error";

// ✅ allow optional actions in show payload
export type PayloadType = {
    text: string | ReactNode;
    severity: SeverityType;
    actions?: MapMessageAction[];
};

const paletteBySeverity: Record<
    SeverityType,
    { bg: string; fg: string; border: string; Icon: typeof InfoOutlinedIcon }
> = {
    info: { bg: "#e3f2fd", fg: "#0d47a1", border: "#90caf9", Icon: InfoOutlinedIcon },
    success: { bg: "#e8f5e9", fg: "#1b5e20", border: "#a5d6a7", Icon: CheckCircleOutlineIcon },
    warning: { bg: "#fff8e1", fg: "#7f5700", border: "#ffe082", Icon: WarningAmberOutlinedIcon },
    error: { bg: "#ffebee", fg: "#b71c1c", border: "#ef9a9a", Icon: ErrorOutlineIcon },
};

export type MapMessageChipHandle = {
    show: (payload: PayloadType) => void;
    hide: () => void;
    setText: (text: string | ReactNode) => void;
    setSeverity: (sev: SeverityType) => void;
    setActions: (actions: MapMessageAction[]) => void;
    clearActions: () => void;
    setVisibility: (visible: boolean) => void;
    isVisible: () => boolean; // returns a boolean directly
};

const MapMessageChip = forwardRef<MapMessageChipHandle>((_, ref) => {
    const [isChipVisible, setIsChipVisible] = useState(false);
    const [chipText, setChipText] = useState<string | React.ReactNode>("");
    const [chipSeverity, setChipSeverity] = useState<SeverityType>("info");
    const [chipActions, setChipActions] = useState<MapMessageAction[]>([]);

    const { bg, fg, border, Icon } = useMemo(
        () => paletteBySeverity[chipSeverity],
        [chipSeverity]
    );

    // Stable callbacks so the imperative handle doesn't churn
    const show = useCallback((payload: PayloadType) => {
        setIsChipVisible(true);
        setChipText(payload.text);
        setChipSeverity(payload.severity);
        // ✅ wire actions if provided, else clear
        setChipActions(payload.actions ? payload.actions.slice() : []);
    }, []);

    const hide = useCallback(() => {
        setIsChipVisible(false);
    }, []);

    const setText = useCallback((value: string | ReactNode) => {
        setIsChipVisible(true);
        setChipText(value);
    }, []);

    const setSeverity = useCallback((value: SeverityType) => {
        setChipSeverity(value);
    }, []);

    const setActions = useCallback((actions: MapMessageAction[]) => {
        setChipActions(actions.slice());
    }, []);

    const clearActions = useCallback(() => {
        setChipActions([]);
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            show,
            hide,
            setText,
            setSeverity,
            setActions,
            clearActions,
            setVisibility: (visible: boolean) => {
                setIsChipVisible(visible);
            },
            isVisible: () => isChipVisible,
        }),
        // ⚠️ include isChipVisible so isVisible() always reflects latest value
        [show, hide, setText, setSeverity, setActions, clearActions, isChipVisible]
    );

    return (
        <>
            {isChipVisible && (
                <Paper
                    elevation={6}
                    sx={{
                        position: "absolute",
                        bottom: 70,
                        left: 16,
                        zIndex: 99999,
                        bgcolor: bg,
                        color: fg,
                        border: `1px solid ${border}`,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1.5,
                        pointerEvents: "auto",
                        maxWidth: "min(520px, 92vw)",
                    }}
                >
                    <Icon fontSize="small" sx={{ mr: 0.5 }} />
                    <span style={{ lineHeight: 1.35, wordBreak: "break-word" }}>{chipText}</span>

                    {chipActions.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
                            {chipActions.map((a, i) => (
                                <Button
                                    key={`${a.label}-${i}`}
                                    onClick={a.onClick}
                                    size="small"
                                    color={a.color ?? "inherit"}
                                    variant={a.variant ?? "text"}
                                    sx={{ textTransform: "none" }}
                                >
                                    {a.label}
                                </Button>
                            ))}
                        </Stack>
                    )}
                </Paper>
            )}
        </>
    );
});

export default MapMessageChip;
