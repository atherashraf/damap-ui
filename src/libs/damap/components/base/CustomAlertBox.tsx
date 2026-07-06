import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Box, Button,  useTheme } from "@mui/material";

declare global {
    interface Window {
        customAlert: (content: React.ReactNode) => Promise<void>;
    }
}

let resolver: (() => void) | null = null;
/***
 await window.customAlert(`${features.length} feature(s) deleted successfully.`);
 ***/
const CustomAlertBox: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState<React.ReactNode>(null);
    const theme = useTheme();

    useEffect(() => {
        window.customAlert = (content: React.ReactNode) => {
            setContent(content);
            setOpen(true);

            return new Promise<void>((resolve) => {
                resolver = () => {
                    setOpen(false);
                    resolve();
                };
            });
        };

        // Optional: override native alert
        window.alert = window.customAlert;
    }, []);

    if (!open) return null;

    const appName = import.meta.env.VITE_READING_APP_NAME || "DAMap";

    return ReactDOM.createPortal(
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
            }}
        >
            <Box
                sx={{
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    minWidth: 200,
                    boxShadow: 4,
                    overflow: "hidden",
                }}
            >
                {/* Top colored bar with app name */}
                <Box
                    sx={{
                        height: "30px",
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "1rem",
                    }}
                >
                    {appName}
                </Box>

                {/* Message and OK button */}
                <Box sx={{ p: 2, textAlign: "center" }}>
                    <Box sx={{ mb: 2 }}>
                        {content}
                    </Box>
                    <Button
                        variant="contained"
                        onClick={() => resolver && resolver()}
                        fullWidth
                        sx={{
                            height: "30px",
                            bgcolor: theme.palette.secondary.main,
                            color: theme.palette.secondary.contrastText,
                            "&:hover": {
                                bgcolor: theme.palette.secondary.dark,
                            },
                        }}
                    >
                        OK
                    </Button>
                </Box>
            </Box>
        </Box>,
        document.body
    );
};

export default CustomAlertBox;
