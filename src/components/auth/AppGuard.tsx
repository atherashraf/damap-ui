import { JSX, useEffect, useState } from "react";
import { CircularProgress, Box } from "@mui/material";

import { logout } from "@/store/slices/authSlice";
import { AuthServices } from "@/api/authServices";
import { useNavigate, useLocation } from "react-router-dom";
import {useMapDispatch} from "@/hooks/storeHooks"; // ✅ add these

const AppGuard = ({ children }: { children: JSX.Element }) => {
    const dispatch = useMapDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            const isValid = await AuthServices.verifyAccessToken();
            if (!isValid) {
                dispatch(logout());

                // 🚀 Redirect to login if token invalid
                // navigate("/login", { state: { from: location }, replace: true });
            }
            setChecking(false);
        };

        verifyToken();
    }, [dispatch, navigate, location]); // ✅ Add navigate, location to dependencies

    if (checking) {
        return (
            <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    return children;
};

export default AppGuard;
