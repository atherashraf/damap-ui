import {
    forwardRef,
    ReactNode,
    SyntheticEvent,
    useImperativeHandle,
    useState,
} from "react";
import {
    Snackbar,
    Alert,
    AlertColor,
    SnackbarCloseReason,
} from "@mui/material";

export type DASnackbarOptions = {
    message: ReactNode;
    severity?: AlertColor;
    duration?: number;
    icon?: ReactNode;
};

export interface DASnackbarHandle {
    show: (
        messageOrOptions: string | ReactNode | DASnackbarOptions,
        severity?: AlertColor,
        duration?: number
    ) => void;
    close: () => void;
}

const DASnackbar = forwardRef<DASnackbarHandle>((_, ref) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState<ReactNode>("");
    const [severity, setSeverity] = useState<AlertColor>("info");
    const [duration, setDuration] = useState(4000);
    const [icon, setIcon] = useState<ReactNode>(undefined);
    const [snackbarKey, setSnackbarKey] = useState(0);

    useImperativeHandle(ref, () => ({
        show(messageOrOptions, severityArg = "info", durationArg = 4000) {
            let options: DASnackbarOptions;

            if (
                typeof messageOrOptions === "object" &&
                messageOrOptions !== null &&
                "message" in messageOrOptions
            ) {
                options = {
                    message: messageOrOptions.message,
                    severity: messageOrOptions.severity ?? "info",
                    duration: messageOrOptions.duration ?? 4000,
                    icon: messageOrOptions.icon,
                };
            } else {
                options = {
                    message: messageOrOptions,
                    severity: severityArg,
                    duration: durationArg,
                    icon: undefined,
                };
            }

            setOpen(false);

            setTimeout(() => {
                setMessage(options.message);
                setSeverity(options.severity ?? "info");
                setDuration(options.duration ?? 4000);
                setIcon(options.icon);
                setSnackbarKey((prev) => prev + 1);
                setOpen(true);
            }, 50);
        },

        close() {
            setOpen(false);
        },
    }));

    const handleClose = (
        _: Event | SyntheticEvent,
        reason?: SnackbarCloseReason
    ) => {
        if (reason === "clickaway") return;
        setOpen(false);
    };

    return (
        <Snackbar
            key={snackbarKey}
            open={open}
            autoHideDuration={duration}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
            <Alert
                onClose={handleClose}
                severity={severity}
                variant="filled"
                icon={icon ?? undefined}
                sx={{
                    width: "100%",
                    minWidth: 320,
                    maxWidth: 520,
                    alignItems: "flex-start",
                    whiteSpace: "pre-line",
                }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
});

DASnackbar.displayName = "DASnackbar";

export default DASnackbar;