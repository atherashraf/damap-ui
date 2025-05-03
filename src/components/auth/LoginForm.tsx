import React, { useState } from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Paper,
} from "@mui/material";
import {useLocation, useNavigate} from "react-router-dom"; // import useLocation
import { AuthServices } from "@/api/authServices.ts";

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation(); // Get the current location

    // Get the intended path the user wanted to access
    const from = (location.state as { from?: Location })?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await AuthServices.performLogin(username, password);

        if (result) {
            navigate(from); // 🔥 Go back to the page the user originally tried to access
        }
        setLoading(false);
    };

    return (
        <Paper elevation={3} sx={{ maxWidth: 400, margin: "auto", mt: 10, p: 4 }}>
            <Typography variant="h5" gutterBottom align="center">
                Login
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    label="Username"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <TextField
                    label="Password"
                    type="password"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 2 }}
                >
                    {loading ? <CircularProgress size={24} /> : "Login"}
                </Button>
            </Box>
        </Paper>
    );
};

export default LoginForm;
