import * as React from "react";
import {
    Box,
    IconButton,
    MenuItem,
    Popover,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import PlaceIcon from "@mui/icons-material/Place";
import { useMapVM } from "@/libs/damap";

type SupportedSRID = "4326" | "3857" | "32643" | "32642";

interface GoToButtonProps {
    targetZoom?: number;
}

const SRID_OPTIONS: { value: SupportedSRID; label: string }[] = [
    { value: "4326", label: "WGS-84" },
    { value: "3857", label: "Web Mercator" },
    { value: "32643", label: "UTM Zone 43 N" },
    { value: "32642", label: "UTM Zone 42 N" },
];

export default function GoToButton({
                                       targetZoom = 19,
                                   }: GoToButtonProps): React.ReactElement {
    const mapVM = useMapVM();

    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const [x, setX] = React.useState("");
    const [y, setY] = React.useState("");
    const [srid, setSrid] = React.useState<SupportedSRID>("4326");
    const [error, setError] = React.useState("");

    const open = Boolean(anchorEl);
    const isGeographic = srid === "4326";

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setError("");
    };

    const handleGo = () => {
        const xNum = Number(x);
        const yNum = Number(y);

        if (Number.isNaN(xNum) || Number.isNaN(yNum)) {
            setError("Please enter valid numeric values.");
            return;
        }

        try {
            mapVM.goToCoordinate(xNum, yNum, srid, targetZoom);
            handleClose();
        } catch {
            setError("Unable to zoom to the given coordinate.");
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleGo();
    };

    return (
        <>
            <Tooltip title="Go To Coordinate">
                <IconButton size="small" onClick={handleOpen}>
                    <PlaceIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ p: 2, width: 280 }}
                >
                    <Stack spacing={2}>
                        <Typography variant="subtitle2">
                            Go To Coordinate
                        </Typography>

                        <TextField
                            label={isGeographic ? "Longitude (X)" : "Easting (X)"}
                            value={x}
                            onChange={(e) => setX(e.target.value)}
                            size="small"
                            fullWidth
                            autoFocus
                        />

                        <TextField
                            label={isGeographic ? "Latitude (Y)" : "Northing (Y)"}
                            value={y}
                            onChange={(e) => setY(e.target.value)}
                            size="small"
                            fullWidth
                        />

                        <TextField
                            select
                            label="SRID"
                            value={srid}
                            onChange={(e) => setSrid(e.target.value as SupportedSRID)}
                            size="small"
                            fullWidth
                        >
                            {SRID_OPTIONS.map((item) => (
                                <MenuItem key={item.value} value={item.value}>
                                    {item.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        {error && (
                            <Typography variant="caption" color="error">
                                {error}
                            </Typography>
                        )}

                        <Stack direction="row" justifyContent="flex-end">
                            <Button type="submit" color="primary">
                                GoTo XY
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Popover>
        </>
    );
}