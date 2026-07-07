import { useEffect, useState } from "react";
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {isImageUrlPreloaded, preloadImageUrl} from "@/libs/damap";


export type AttributeTableImagePreviewState = {
    url: string;
    thumbnailUrl?: string;
    title: string;
} | null;

type Props = {
    preview: AttributeTableImagePreviewState;
    onClose: () => void;
};

export function AttributeTableImagePreview({ preview, onClose }: Props) {
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);
    const [fullLoaded, setFullLoaded] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!preview) {
            setDisplayUrl(null);
            setFullLoaded(false);
            setFailed(false);
            return;
        }

        const initialUrl =
            isImageUrlPreloaded(preview.url) || !preview.thumbnailUrl
                ? preview.url
                : preview.thumbnailUrl;

        setDisplayUrl(initialUrl);
        setFullLoaded(initialUrl === preview.url);
        setFailed(false);

        if (initialUrl !== preview.url) {
            preloadImageUrl(preview.url)
                .then(() => {
                    setDisplayUrl(preview.url);
                    setFullLoaded(true);
                })
                .catch(() => {
                    setFailed(true);
                });
        }
    }, [preview]);

    return (
        <Dialog
            open={Boolean(preview)}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            onClick={(event) => event.stopPropagation()}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    py: 1.5,
                }}
            >
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {preview?.title ?? "Photo preview"}
                </Typography>
                <IconButton aria-label="Close preview" onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 280,
                    bgcolor: "grey.50",
                }}
            >
                {!preview ? null : failed ? (
                    <Typography color="text.secondary">
                        Unable to load this image.
                    </Typography>
                ) : (
                    <Box sx={{ position: "relative", width: "100%", textAlign: "center" }}>
                        <Box
                            component="img"
                            src={displayUrl ?? preview.thumbnailUrl ?? preview.url}
                            alt={preview.title}
                            draggable={false}
                            onError={() => setFailed(true)}
                            sx={{
                                maxWidth: "100%",
                                maxHeight: "72vh",
                                objectFit: "contain",
                                borderRadius: 1,
                                display: "inline-block",
                                transition: "opacity 160ms ease",
                            }}
                        />
                        {!fullLoaded && preview.thumbnailUrl ? (
                            <Typography
                                variant="caption"
                                sx={{
                                    position: "absolute",
                                    right: 12,
                                    bottom: 12,
                                    px: 1,
                                    py: 0.4,
                                    borderRadius: 1,
                                    bgcolor: "rgba(255,255,255,0.92)",
                                    color: "text.secondary",
                                }}
                            >
                                Loading original quality...
                            </Typography>
                        ) : null}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
