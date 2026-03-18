import * as React from "react";
import { Tooltip, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { DASnackbarHandle } from "@/components/base/DASnackbar";

interface IProps {
    value: string;
    maxLength?: number; // Default 30
    snackbarRef?: React.RefObject<DASnackbarHandle>;
}

const TruncateWithTooltip = ({ value, maxLength = 30, snackbarRef }: IProps) => {
    const isLong = value.length > maxLength;
    const [openDialog, setOpenDialog] = React.useState(false);
    // const { copy, isCopied } = useClipboardCopy();

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        snackbarRef?.current?.show("Copied to clipboard!", "success");
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLong) {
            setOpenDialog(true);
        }
    };

    const handleClose = () => {
        setOpenDialog(false);
    };

    return (
        <>
            <Tooltip title={isLong ? "Click to view" : ""} arrow>
                <Typography
                    noWrap
                    onClick={handleClick}
                    sx={{
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: isLong ? "pointer" : "default",
                        fontSize: "0.9rem",
                        background: isLong
                            ? "linear-gradient(to right, #fff 80%, transparent)"
                            : undefined,
                    }}
                >
                    {value}
                </Typography>
            </Tooltip>

            {/* Expand Full Dialog */}
            <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Full Content
                    <IconButton onClick={handleCopy} sx={{ marginLeft: "10px" }}>
                        <ContentCopyIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ wordBreak: "break-word", fontSize: "0.9rem" }}>{value}</Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary" variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TruncateWithTooltip;
