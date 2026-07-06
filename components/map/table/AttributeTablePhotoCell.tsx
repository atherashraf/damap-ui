import { memo, useState } from "react";
import { Box } from "@mui/material";
import PhotoOutlinedIcon from "@mui/icons-material/PhotoOutlined";
import { preloadImageUrl } from "@/utils/media";

type Props = {
    label: string;
    thumbnailUrl: string;
    imageUrl: string;
    onPreview: (fullImageUrl: string, thumbnailUrl: string, title: string) => void;
};

function AttributeTablePhotoCellComponent({ label, thumbnailUrl, imageUrl, onPreview }: Props) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);

    return (
        <Box
            component="button"
            type="button"
            title={label}
            onClick={(event) => {
                event.stopPropagation();
                onPreview(imageUrl, thumbnailUrl, label);
            }}
            onMouseEnter={() => {
                void preloadImageUrl(imageUrl);
            }}
            onFocus={() => {
                void preloadImageUrl(imageUrl);
            }}
            sx={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 72,
                height: 44,
                p: 0,
                overflow: "hidden",
                contain: "paint",
                cursor: "pointer",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "grey.100",
                transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                outline: "none",
                "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: 2,
                    borderColor: "primary.main",
                },
                "&:focus-visible": {
                    boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
                    borderColor: "primary.main",
                },
            }}
        >
            {!failed ? (
                <>
                    {!loaded && (
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                    "linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 37%, rgba(0,0,0,0.05) 63%)",
                            }}
                        >
                            <PhotoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        </Box>
                    )}

                    <Box
                        component="img"
                        src={thumbnailUrl}
                        alt={label}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onLoad={() => setLoaded(true)}
                        onError={() => setFailed(true)}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            opacity: loaded ? 1 : 0,
                            willChange: "opacity",
                            transition: "opacity 160ms ease",
                        }}
                    />
                </>
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        color: "text.secondary",
                    }}
                >
                    <PhotoOutlinedIcon sx={{ fontSize: 18 }} />
                </Box>
            )}
        </Box>
    );
}

const AttributeTablePhotoCell = memo(AttributeTablePhotoCellComponent);
export default AttributeTablePhotoCell;
