import React, { useRef, useState } from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Paper,
    Checkbox,
    FormControlLabel,
    Link,
    InputAdornment,
    IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import DASnackbar, {
    DASnackbarHandle,
} from "@damap/components/base/DASnackbar";
import AuthServices from "@damap/api/authServices";
import type { DAMapUserBase } from "@damap/types/authTypes";

export type LoginFormProps<TUser extends DAMapUserBase = DAMapUserBase> = {
    getPostLoginPath?: (user: TUser) => string;
    defaultPostLoginPath?: string;
    onLoginSuccess?: (user: TUser) => void;
    forgotPasswordPath?: string;
    title?: string;
    subtitle?: string;
};

const LoginForm = <TUser extends DAMapUserBase = DAMapUserBase>({
                                                                    getPostLoginPath,
                                                                    defaultPostLoginPath = "/",
                                                                    onLoginSuccess,
                                                                    forgotPasswordPath = "#",
                                                                    title = "Welcome!",
                                                                    subtitle = "Please enter your details",
                                                                }: LoginFormProps<TUser>) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const snackbarRef = useRef<DASnackbarHandle>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await AuthServices.performLogin<TUser>(
                username,
                password
            );

            if (!user) {
                snackbarRef.current?.show(
                    "Invalid username or password",
                    "error"
                );
                return;
            }

            snackbarRef.current?.show("Login successful", "success");
            window.dispatchEvent(new Event("auth-login"));

            onLoginSuccess?.(user);

            const target = getPostLoginPath
                ? getPostLoginPath(user)
                : defaultPostLoginPath;

            navigate(target, { replace: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{
                margin: "auto",
                mt: 2,
                py: 3,
                px: 5,
                width: "100%",
                maxWidth: 520,
                borderRadius: 5,
                backgroundColor: "rgba(245,245,245,0.96)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
            }}
        >
            <Typography
                align="center"
                sx={{
                    fontFamily: "Georgia, serif",
                    fontWeight: 700,
                    fontSize: "2.3rem",
                    color: "#355a92",
                    mb: 0.5,
                    lineHeight: 1.2,
                }}
            >
                {title}
            </Typography>

            <Typography
                align="center"
                sx={{
                    fontFamily: "Georgia, serif",
                    fontSize: "1rem",
                    color: "#555",
                    mb: 3,
                }}
            >
                {subtitle}
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
                <Typography
                    sx={{
                        fontFamily: "Georgia, serif",
                        fontWeight: 700,
                        fontSize: "1rem",
                        mb: 0.8,
                        color: "#222",
                    }}
                >
                    Username
                </Typography>

                <TextField
                    placeholder="Enter username"
                    variant="outlined"
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    sx={{
                        mb: 2,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2.5,
                            backgroundColor: "#fbfbfb",
                            fontFamily: "Georgia, serif",
                            "& fieldset": {
                                borderColor: "#cfd6dd",
                            },
                            "&:hover fieldset": {
                                borderColor: "#b3bfcb",
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: "#355a92",
                                borderWidth: "1.5px",
                            },
                        },
                        "& input": {
                            py: 1.35,
                            fontSize: "1rem",
                            fontFamily: "Georgia, serif",
                        },
                    }}
                />

                <Typography
                    sx={{
                        fontFamily: "Georgia, serif",
                        fontWeight: 700,
                        fontSize: "1rem",
                        mb: 0.8,
                        color: "#222",
                    }}
                >
                    Password
                </Typography>

                <TextField
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    sx={{
                        mb: 2,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2.5,
                            backgroundColor: "#fbfbfb",
                            fontFamily: "Georgia, serif",
                            "& fieldset": {
                                borderColor: "#cfd6dd",
                            },
                            "&:hover fieldset": {
                                borderColor: "#b3bfcb",
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: "#355a92",
                                borderWidth: "1.5px",
                            },
                        },
                        "& input": {
                            py: 1.35,
                            fontSize: "1rem",
                            fontFamily: "Georgia, serif",
                        },
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    edge="end"
                                    sx={{ color: "#5f6f82" }}
                                >
                                    {showPassword ? (
                                        <VisibilityOff />
                                    ) : (
                                        <Visibility />
                                    )}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        mb: 2.5,
                        flexWrap: "wrap",
                    }}
                >
                    <FormControlLabel
                        sx={{
                            m: 0,
                            ".MuiFormControlLabel-label": {
                                marginLeft: "4px",
                            },
                        }}
                        control={
                            <Checkbox
                                checked={rememberMe}
                                onChange={(e) =>
                                    setRememberMe(e.target.checked)
                                }
                                sx={{
                                    color: "#355a92",
                                    p: 0.5,
                                    "&.Mui-checked": {
                                        color: "#355a92",
                                    },
                                }}
                            />
                        }
                        label={
                            <Typography
                                sx={{
                                    fontFamily: "Georgia, serif",
                                    fontSize: "0.98rem",
                                    color: "#222",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Remember me
                            </Typography>
                        }
                    />

                    <Link
                        href={forgotPasswordPath}
                        underline="hover"
                        sx={{
                            fontFamily: "Georgia, serif",
                            fontSize: "0.98rem",
                            fontWeight: 700,
                            color: "#355a92",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Forgot Password
                    </Link>
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{
                        mt: 0.5,
                        py: 1.25,
                        borderRadius: 2.5,
                        background:
                            "linear-gradient(180deg, #6f8fc0 0%, #5f81b5 100%)",
                        textTransform: "none",
                        fontFamily: "Georgia, serif",
                        fontWeight: 700,
                        fontSize: "1.15rem",
                        boxShadow: "none",
                        "&:hover": {
                            background:
                                "linear-gradient(180deg, #6787b7 0%, #5377aa 100%)",
                            boxShadow: "none",
                        },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        "Sign In"
                    )}
                </Button>
            </Box>

            <DASnackbar ref={snackbarRef} />
        </Paper>
    );
};

export default LoginForm;