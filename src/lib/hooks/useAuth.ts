import AuthServices, {User} from "@/api/authServices";
import { useState, useEffect, useCallback } from "react";


export function useAuth() {
    const [user, setUser] = useState<User | null>(AuthServices.getUser());
    const [isLoggedIn, setIsLoggedIn] = useState(AuthServices.isLoggedIn());

    useEffect(() => {
        const handleLogout = () => {
            setUser(null);
            setIsLoggedIn(false);
        };

        window.addEventListener("auth-logout", handleLogout);
        return () => window.removeEventListener("auth-logout", handleLogout);
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const success = await AuthServices.performLogin(username, password);
        if (success) {
            setUser(AuthServices.getUser());
            setIsLoggedIn(true);
        }
        return success;
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
        groups: user?.groups ?? [],
        isSuperuser: user?.isSuperuser ?? false,
        isStaff: user?.isStaff ?? false,
    };
}
