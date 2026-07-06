/**
 * Custom asynchronous feedback dialog.
 *
 * Shows a draggable dialog with a textarea input for collecting user feedback/reason.
 *
 * @function window.customFeedback
 * @param {string} message - Message shown in dialog
 * @param {string} [confirmText="Submit"] - Confirm button label
 * @returns {Promise<{ confirmed: boolean; feedback: string }>}
 */

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
    Box,
    Button,
    Paper,
    Typography,
    TextField,
    useTheme,
} from "@mui/material";

declare global {
    interface Window {
        customFeedback: (
            message: string,
            confirmText?: string
        ) => Promise<{ confirmed: boolean; feedback: string }>;
    }
}

let resolver:
    | ((value: { confirmed: boolean; feedback: string }) => void)
    | null = null;

const CustomFeedbackBox: React.FC = () => {
    const theme = useTheme();

    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [confirmText, setConfirmText] = useState("Submit");
    const [feedback, setFeedback] = useState("");

    // Position (top-right by default)
    const [position, setPosition] = useState({
        x: window.innerWidth - 420,
        y: 80,
    });

    const draggingRef = useRef(false);
    const offsetRef = useRef({ x: 0, y: 0 });
    const dialogRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        window.customFeedback = (msg: string, btnText: string = "Submit") => {
            setMessage(msg);
            setConfirmText(btnText);
            setFeedback("");
            setOpen(true);

            return new Promise((resolve) => {
                resolver = (value) => {
                    setOpen(false);
                    resolve(value);
                    resolver = null;
                };
            });
        };
    }, []);

    useEffect(() => {
        if (!open) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingRef.current || !dialogRef.current) return;

            const dialog = dialogRef.current;
            const dialogWidth = dialog.offsetWidth;
            const dialogHeight = dialog.offsetHeight;

            const nextX = e.clientX - offsetRef.current.x;
            const nextY = e.clientY - offsetRef.current.y;

            const maxX = window.innerWidth - dialogWidth - 8;
            const maxY = window.innerHeight - dialogHeight - 8;

            setPosition({
                x: Math.max(8, Math.min(nextX, maxX)),
                y: Math.max(8, Math.min(nextY, maxY)),
            });
        };

        const handleMouseUp = () => {
            draggingRef.current = false;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === "Escape") {
                resolver?.({ confirmed: false, feedback: "" });
            } else if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (feedback.trim()) {
                    resolver?.({ confirmed: true, feedback });
                }
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, feedback]);

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dialogRef.current) return;

        draggingRef.current = true;

        const rect = dialogRef.current.getBoundingClientRect();
        offsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
    };

    const handleCancel = () =>
        resolver?.({ confirmed: false, feedback: "" });

    const handleConfirm = () => {
        if (!feedback.trim()) return;
        resolver?.({ confirmed: true, feedback });
    };

    if (!open) return null;

    const appName = import.meta.env.VITE_READING_APP_NAME || "DAMap";
    const isDanger = confirmText.toLowerCase() === "reject";

    return ReactDOM.createPortal(
        <>
            {/* Light overlay */}
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.08)",
                    zIndex: 9998,
                    pointerEvents: "none",
                }}
            />

            {/* Dialog */}
            <Paper
                ref={dialogRef}
                elevation={10}
                sx={{
                    position: "fixed",
                    left: position.x,
                    top: position.y,
                    width: 380,
                    maxWidth: "calc(100vw - 16px)",
                    borderRadius: 3,
                    overflow: "hidden",
                    zIndex: 9999,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(6px)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
                }}
            >
                {/* Header (draggable) */}
                <Box
                    onMouseDown={handleDragStart}
                    sx={{
                        px: 2,
                        py: 1.25,
                        cursor: "grab",
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: theme.palette.primary.contrastText,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontWeight: 700,
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={700}>
                        {appName}
                    </Typography>

                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.9,
                            border: "1px solid rgba(255,255,255,0.35)",
                            px: 1,
                            borderRadius: 5,
                        }}
                    >
                        Drag me
                    </Typography>
                </Box>

                {/* Content */}
                <Box sx={{ p: 2 }}>
                    <Typography
                        variant="body1"
                        sx={{ mb: 1.2, fontWeight: 500 }}
                    >
                        {message}
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        autoFocus
                        placeholder="Enter reason..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        error={!feedback.trim()}
                        helperText={
                            !feedback.trim()
                                ? "Reason is required"
                                : "Press Enter to submit"
                        }
                        sx={{ mb: 2 }}
                    />

                    <Box sx={{ display: "flex", gap: 1.25 }}>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={handleCancel}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleConfirm}
                            disabled={!feedback.trim()}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                bgcolor: isDanger
                                    ? theme.palette.error.main
                                    : theme.palette.primary.main,
                                "&:hover": {
                                    bgcolor: isDanger
                                        ? theme.palette.error.dark
                                        : theme.palette.primary.dark,
                                },
                            }}
                        >
                            {confirmText}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </>,
        document.body
    );
};

export default CustomFeedbackBox;