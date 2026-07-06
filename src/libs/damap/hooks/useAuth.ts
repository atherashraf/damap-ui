import AuthServices from "@/api/authServices";
import type { User } from "@/components/admin/types";
import { useState, useEffect, useCallback } from "react";

export function useAuth() {
    const [user, setUser] = useState<User | null>(() => AuthServices.getUser());
    const [isLoggedIn, setIsLoggedIn] = useState(() => AuthServices.hasUsableSessionSync());

    useEffect(() => {
        const handleLogout = () => {
            setUser(null);
            setIsLoggedIn(false);
        };

        const handleLogin = () => {
            setUser(AuthServices.getUser());
            setIsLoggedIn(AuthServices.hasUsableSessionSync());
        };

        window.addEventListener("auth-logout", handleLogout);
        window.addEventListener("auth-login", handleLogin);
        return () => {
            window.removeEventListener("auth-logout", handleLogout);
            window.removeEventListener("auth-login", handleLogin);
        };
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const nextUser = await AuthServices.performLogin(username, password);
        if (nextUser) {
            setUser(nextUser);
            setIsLoggedIn(true);
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(() => {
        AuthServices.performLogout();
    }, []);

    const refresh = useCallback(async () => {
        const result = await AuthServices.refreshAccessToken();
        setIsLoggedIn(result.success);
        if (result.success) {
            setUser(AuthServices.getUser());
        }
    }, []);

    return {
        user,
        isLoggedIn,
        login,
        logout,
        refresh,
        roles: user ? AuthServices.getUserRoles(user) : [],
        isSuperuser: user?.isSuperuser ?? false,
        isStaff: user?.isStaff ?? false,
    };
}
