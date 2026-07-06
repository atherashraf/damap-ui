import React from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Box,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

interface LegendDialogProps {
    open: boolean;
    title?: string;
    imageSrc?: string;
    onClose: () => void;
}

const LegendDialog = ({
                          open,
                          title,
                          imageSrc,
                          onClose,
                      }: LegendDialogProps): React.ReactElement => {


    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span>{title || "Legend"}</span>

                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Box
                    sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "auto",
                        p: 1,
                    }}
                >
                    {imageSrc && (
                        <img
                            src={imageSrc}
                            alt={title || "Legend"}
                            style={{
                                maxWidth: "100%",
                                height: "auto",
                                objectFit: "contain",
                            }}
                        />
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default LegendDialog;