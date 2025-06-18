import React, { useState } from "react";
import {
    AppBar,
    Box,
    Toolbar,
    Typography,
    IconButton,
    MenuItem,
    Menu,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import LoginIcon from "@mui/icons-material/Login";
import { useNavigate } from "react-router-dom";

import { logout } from "@/store/slices/authSlice";
import { useMapDispatch, useMapSelector } from "@/hooks/storeHooks";
// import { performLogin } from "@/utils/authUtils";

export default function xDAAppBar(props: { snackbarRef: React.RefObject<any> }) {
    const dispatch = useMapDispatch();
    const navigate = useNavigate();
    const user = useMapSelector((state) => state.auth.user);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        dispatch(logout());
        props.snackbarRef?.current?.show("Logout Success!");
        navigate("/login");
    };

    const handleLogin = async () => {
        navigate("/login");

    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {user ? `Welcome ${user.name}` : ""}
                    </Typography>
                    <div>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            {user ? <AccountCircle /> : <LoginIcon />}
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{ vertical: "top", horizontal: "right" }}
                            keepMounted
                            transformOrigin={{ vertical: "top", horizontal: "right" }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={() => { handleClose(); navigate("/"); }}>
                                Home
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    handleClose();
                                    user ? handleLogout() : handleLogin();
                                }}
                            >
                                {user ? "Logout" : "Login"}
                            </MenuItem>
                        </Menu>
                    </div>
                </Toolbar>
            </AppBar>
        </Box>
    );
}