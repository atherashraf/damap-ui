/**
 * Custom asynchronous confirm dialog (replacement for window.confirm).
 *
 * Displays a styled modal dialog and resolves a Promise based on user action.
 *
 * @function window.customConfirm
 * @param {string} message - The message to display in the confirmation dialog.
 * @param {string} [confirmText="OK"] - Optional label for the confirm button.
 * @returns {Promise<boolean>} Resolves to:
 *  - `true` if user confirms
 *  - `false` if user cancels
 *
 * @example
 * // Basic usage (default OK button)
 * const confirmed = await window.customConfirm("Are you sure?");
 * if (confirmed) {
 *   console.log("User confirmed");
 * }
 *
 * @example
 * // Custom confirm button text
 * const confirmed = await window.customConfirm(
 *   "Delete this item permanently?",
 *   "Delete"
 * );
 * if (confirmed) {
 *   console.log("Item deleted");
 * }
 *
 * @example
 * // Inside async function
 * async function handleDelete() {
 *   const ok = await window.customConfirm("Proceed with deletion?", "Delete");
 *   if (!ok) return;
 *
 *   // continue deletion logic...
 * }
 *
 * @remarks
 * - Must be initialized by rendering <CustomConfirmBox /> at app root.
 * - Uses React Portal to render dialog at document.body level.
 * - Only one confirmation dialog is supported at a time.
 */
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Box, Button, Paper, Typography, useTheme } from "@mui/material";

declare global {
    interface Window {
        /**
         * Shows a draggable custom confirmation dialog.
         *
         * @param message - Message shown inside the dialog.
         * @param confirmText - Optional confirm button label. Defaults to "OK".
         * @returns Promise<boolean> resolving to true on confirm, false on cancel.
         *
         * @example
         * const ok = await window.customConfirm("Are you sure?");
         * if (ok) {
         *   console.log("Confirmed");
         * }
         *
         * @example
         * const deleted = await window.customConfirm(
         *   "Delete parcel P-1023?",
         *   "Delete"
         * );
         * if (deleted) {
         *   console.log("Delete confirmed");
         * }
         */
        customConfirm: (message: string, confirmText?: string) => Promise<boolean>;
    }
}

let resolver: ((value: boolean) => void) | null = null;

const CustomConfirmBox: React.FC = () => {
    const theme = useTheme();

    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [confirmText, setConfirmText] = useState("OK");

    // Start near top-right so it doesn't block map center
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 80 });

    const draggingRef = useRef(false);
    const offsetRef = useRef({ x: 0, y: 0 });
    const dialogRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        window.customConfirm = (msg: string, btnText: string = "OK") => {
            setMessage(msg);
            setConfirmText(btnText);
            setOpen(true);

            return new Promise<boolean>((resolve) => {
                resolver = (value: boolean) => {
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
                resolver?.(false);
            } else if (e.key === "Enter") {
                resolver?.(true);
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
    }, [open]);

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

    const handleCancel = () => resolver?.(false);
    const handleConfirm = () => resolver?.(true);

    if (!open) return null;

    const appName = import.meta.env.VITE_READING_APP_NAME || "DAMap";
    const isDanger = confirmText.toLowerCase() === "delete";

    return ReactDOM.createPortal(
        <>
            {/* Very light overlay so map remains visible */}
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.08)",
                    zIndex: 9998,
                    pointerEvents: "none",
                }}
            />

            {/* Draggable floating dialog */}
            <Paper
                ref={dialogRef}
                elevation={10}
                sx={{
                    position: "fixed",
                    left: position.x,
                    top: position.y,
                    width: 360,
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
                {/* Drag handle / header */}
                <Box
                    onMouseDown={handleDragStart}
                    sx={{
                        px: 2,
                        py: 1.25,
                        cursor: "grab",
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: theme.palette.primary.contrastText,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontWeight: 700,
                        letterSpacing: 0.3,
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {appName}
                    </Typography>

                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.9,
                            fontSize: "0.72rem",
                            border: "1px solid rgba(255,255,255,0.35)",
                            px: 1,
                            py: 0.25,
                            borderRadius: 5,
                        }}
                    >
                        Drag me
                    </Typography>
                </Box>

                <Box sx={{ p: 2 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            color: "text.primary",
                            lineHeight: 1.6,
                            mb: 1,
                            fontWeight: 500,
                        }}
                    >
                        {message}
                    </Typography>

                    <Typography
                        variant="caption"
                        sx={{
                            display: "block",
                            color: "text.secondary",
                            mb: 2.25,
                        }}
                    >
                        Press <strong>Enter</strong> to confirm or <strong>Esc</strong> to cancel.
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1.25 }}>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={handleCancel}
                            sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                py: 1,
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleConfirm}
                            sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 700,
                                py: 1,
                                bgcolor: isDanger
                                    ? theme.palette.error.main
                                    : theme.palette.primary.main,
                                color: isDanger
                                    ? theme.palette.error.contrastText
                                    : theme.palette.primary.contrastText,
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

export default CustomConfirmBox;