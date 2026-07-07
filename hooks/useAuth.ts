import { useState, useEffect, useCallback } from "react";
import type { DAMapUserBase } from "@/libs/damap/types/authTypes";
import AuthServices from "@damap/api/authServices";

/**
 * -----------------------------------------------------------------------------
 * useAuth<TUser>()
 * -----------------------------------------------------------------------------
 * React hook for authentication and user session management.
 *
 * This hook provides a generic authentication layer that is independent of any
 * specific application. The user type can be extended by the consuming
 * application while DAMap only depends on the common `DAMapUserBase` interface.
 *
 * Features
 * --------
 * ✓ Maintains authenticated user state.
 * ✓ Tracks login/logout status.
 * ✓ Automatically listens for "auth-login" and "auth-logout" events.
 * ✓ Provides login, logout and token refresh helpers.
 * ✓ Supports any application-specific user model through generics.
 *
 * -----------------------------------------------------------------------------
 * Basic Usage
 * -----------------------------------------------------------------------------
 *
 * import { useAuth } from "damap";
 *
 * function App() {
 *     const {
 *         user,
 *         isLoggedIn,
 *         login,
 *         logout,
 *         refresh,
 *     } = useAuth();
 *
 *     ...
 * }
 *
 *
 * -----------------------------------------------------------------------------
 * Using a Custom User Type
 * -----------------------------------------------------------------------------
 *
 * import { useAuth, DAMapUserBase } from "damap";
 *
 * interface WasaUser extends DAMapUserBase {
 *     distId?: number;
 *     distName?: string;
 *     wasaDivId?: number;
 *     wasaSubdivId?: number;
 * }
 *
 * const { user } = useAuth<WasaUser>();
 *
 * user?.distId;
 * user?.wasaDivId;
 *
 *
 * -----------------------------------------------------------------------------
 * Returned Properties
 * -----------------------------------------------------------------------------
 *
 * user
 *      Currently authenticated user or null.
 *
 * isLoggedIn
 *      True if a valid authenticated session exists.
 *
 * login(username, password)
 *      Performs authentication.
 *      Returns true on success.
 *
 * logout()
 *      Clears the current session and dispatches auth-logout.
 *
 * refresh()
 *      Refreshes the access token if possible.
 *
 * roles
 *      User roles extracted using AuthServices.
 *
 * isSuperuser
 *      Convenience boolean.
 *
 * isStaff
 *      Convenience boolean.
 *
 *
 * -----------------------------------------------------------------------------
 * Generic Parameter
 * -----------------------------------------------------------------------------
 *
 * TUser extends DAMapUserBase
 *
 * Allows each application to define its own user model while keeping the hook
 * completely reusable.
 *
 * Examples:
 *
 *   useAuth<WasaUser>()
 *   useAuth<PLRAUser>()
 *   useAuth<MRDAUser>()
 *
 * -----------------------------------------------------------------------------
 */

export function useAuth<TUser extends DAMapUserBase = DAMapUserBase>() {
    const [user, setUser] = useState<TUser | null>(() => AuthServices.getUser<TUser>());
    const [isLoggedIn, setIsLoggedIn] = useState(() => AuthServices.hasUsableSessionSync());

    useEffect(() => {
        const handleLogout = () => {
            setUser(null);
            setIsLoggedIn(false);
        };

        const handleLogin = () => {
            setUser(AuthServices.getUser<TUser>());
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
        const nextUser = await AuthServices.performLogin<TUser>(username, password);

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
            setUser(AuthServices.getUser<TUser>());
        }
    }, []);

    return {
        user,
        isLoggedIn,
        login,
        logout,
        refresh,
        roles: user ? AuthServices.getUserRoles(user) : [],
        isSuperuser: Boolean(user?.isSuperuser),
        isStaff: Boolean(user?.isStaff),
    };
}