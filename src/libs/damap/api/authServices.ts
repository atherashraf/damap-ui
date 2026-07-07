import MapApi from "./MapApi";
import type { DAMapUserBase, DAMapRole } from "../types/authTypes";

export type NormalizeAuthUser<TUser extends DAMapUserBase> = (
    raw: unknown
) => TUser | null;

export type AuthSnackbarHandler = (
    message: string,
    severity?: "success" | "error" | "warning" | "info"
) => void;

const STORAGE_KEYS = {
    accessToken: "accessToken",
    refreshToken: "refreshToken",
    user: "user",
} as const;

type LoginResponse<TUser extends DAMapUserBase> = {
    token?: {
        accessToken?: string;
        refreshToken?: string;
    };
    userInfo?: TUser | unknown;
};

type RefreshResponse = {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
};

type ApiMessageResponse = {
    message?: string;
};

export type RefreshResult = {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
};

export const AuthAPIs = Object.freeze({
    AUTH_LOGIN_JSON: "api/auth/jwt/login/json",
    AUTH_VERIFY_TOKEN: "api/auth/jwt/token/verify",
    AUTH_REFRESH_ACCESS_TOKEN: "api/auth/jwt/refresh_access_token/",
    AUTH_USER_INFO: "api/auth/jwt/user_info/",
    AUTH_ADD_USER: "api/auth/create_user/",
    AUTH_ACTIVATE_USER: "api/auth/activate-account",
    AUTH_SET_USER_ROLE: "api/auth/set_user_roles",
    VERIFY_EMAIL: "api/auth/jwt/verify_email/",
    SET_PASSWORD: "api/auth/set-password",
    FORGOT_PASSWORD: "api/auth/forgot-password/",
    RESET_PASSWORD: "api/auth/reset-password/",
});

class AuthServices {
    private static refreshPromise: Promise<RefreshResult> | null = null;
    private static profileSyncPromise: Promise<DAMapUserBase | null> | null = null;

    private static normalizeUser: NormalizeAuthUser<DAMapUserBase> = (raw) => {
        if (!raw || typeof raw !== "object") return null;
        return raw as DAMapUserBase;
    };

    private static snackbarHandler: AuthSnackbarHandler | null = null;

    static configureAuth<TUser extends DAMapUserBase = DAMapUserBase>(options: {
        normalizeUser?: NormalizeAuthUser<TUser>;
        snackbar?: AuthSnackbarHandler;
    }) {
        if (options.normalizeUser) {
            this.normalizeUser = options.normalizeUser as NormalizeAuthUser<DAMapUserBase>;
        }

        if (options.snackbar) {
            this.snackbarHandler = options.snackbar;
        }
    }

    private static showMessage(
        message: string,
        severity: "success" | "error" | "warning" | "info" = "info"
    ) {
        this.snackbarHandler?.(message, severity);
    }

    static saveToStorage<TUser extends DAMapUserBase>(
        accessToken: string,
        refreshToken: string,
        user: TUser
    ) {
        sessionStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
        localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    }

    static updateAccessToken(accessToken: string) {
        sessionStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    }

    static updateRefreshToken(refreshToken: string) {
        localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    }

    static updateUser<TUser extends DAMapUserBase>(user: TUser) {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    }

    static clearStorage() {
        sessionStorage.removeItem(STORAGE_KEYS.accessToken);
        localStorage.removeItem(STORAGE_KEYS.refreshToken);
        localStorage.removeItem(STORAGE_KEYS.user);
    }

    static getAccessToken(): string | null {
        return sessionStorage.getItem(STORAGE_KEYS.accessToken);
    }

    static getRefreshToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.refreshToken);
    }

    static getUser<TUser extends DAMapUserBase = DAMapUserBase>(): TUser | null {
        const userStr = localStorage.getItem(STORAGE_KEYS.user);
        if (!userStr) return null;

        try {
            const parsed: unknown = JSON.parse(userStr);
            return this.normalizeUser(parsed) as TUser | null;
        } catch (error) {
            console.error("Failed to parse user from storage:", error);
            return null;
        }
    }

    static getDisplayName(): string | null {
        const user = this.getUser();
        return user?.name || user?.username || null;
    }

    static getUserRoles<TUser extends DAMapUserBase = DAMapUserBase>(
        user: TUser | null = null
    ): DAMapRole[] {
        const resolvedUser = user ?? this.getUser<TUser>();

        if (resolvedUser?.isSuperuser) return ["superuser"];

        if (
            !resolvedUser ||
            resolvedUser.isVerified === false ||
            resolvedUser.isActive === false
        ) {
            return [];
        }

        return Array.isArray(resolvedUser.roles)
            ? (resolvedUser.roles as DAMapRole[])
            : [];
    }

    static hasRole<TUser extends DAMapUserBase = DAMapUserBase>(
        role: DAMapRole,
        user: TUser | null = null
    ): boolean {
        return this.getUserRoles(user).includes(role);
    }

    static isSuperuser<TUser extends DAMapUserBase = DAMapUserBase>(
        user: TUser | null = null
    ): boolean {
        const resolvedUser = user ?? this.getUser<TUser>();
        return !!resolvedUser?.isSuperuser;
    }

    private static decodeJwtPayload(token: string): Record<string, any> | null {
        if (!token || token === "undefined" || token === "null") return null;

        try {
            const parts = token.split(".");
            if (parts.length !== 3) return null;

            const payload = parts[1];
            const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64.padEnd(
                base64.length + ((4 - (base64.length % 4)) % 4),
                "="
            );

            return JSON.parse(atob(padded));
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    private static isTokenExpired(token: string | null | undefined): boolean {
        if (!token) return true;

        const payload = this.decodeJwtPayload(token);
        if (!payload?.exp) return true;

        const buffer = 30;
        const currentTime = Math.floor(Date.now() / 1000);

        return payload.exp - buffer <= currentTime;
    }

    static getTokenExpiry(token: string): number | null {
        const payload = this.decodeJwtPayload(token);
        return typeof payload?.exp === "number" ? payload.exp : null;
    }

    static async isLoggedIn(): Promise<boolean> {
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        const user = this.getUser();

        if (!refreshToken || !user) return false;

        if (accessToken && !this.isTokenExpired(accessToken)) {
            return true;
        }

        if (!this.isTokenExpired(refreshToken)) {
            const result = await this.refreshAccessToken();
            return result.success && !!this.getUser();
        }

        this.clearStorage();
        return false;
    }

    static hasUsableSessionSync(): boolean {
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        const user = this.getUser();

        if (!refreshToken || !user) return false;
        if (accessToken && !this.isTokenExpired(accessToken)) return true;

        return !this.isTokenExpired(refreshToken);
    }

    static async checkAndRefreshLogin(): Promise<boolean> {
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();

        if (accessToken && !this.isTokenExpired(accessToken)) {
            await this.syncUserProfileFromServer();
            return true;
        }

        if (refreshToken && !this.isTokenExpired(refreshToken)) {
            const refreshed = await this.refreshAccessToken();

            if (refreshed.success) {
                await this.syncUserProfileFromServer();
            }

            return refreshed.success;
        }

        return false;
    }

    static async syncUserProfileFromServer<
        TUser extends DAMapUserBase = DAMapUserBase
    >(): Promise<TUser | null> {
        const accessToken = this.getAccessToken();

        if (!accessToken || this.isTokenExpired(accessToken)) {
            return this.getUser<TUser>();
        }

        if (!this.profileSyncPromise) {
            this.profileSyncPromise = this.fetchAndStoreUserProfile().finally(() => {
                this.profileSyncPromise = null;
            });
        }

        return this.profileSyncPromise as Promise<TUser | null>;
    }

    private static async fetchAndStoreUserProfile<
        TUser extends DAMapUserBase = DAMapUserBase
    >(): Promise<TUser | null> {
        const accessToken = this.getAccessToken();
        if (!accessToken) return this.getUser<TUser>();

        try {
            const url = MapApi.getURL(AuthAPIs.AUTH_USER_INFO);

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                return this.getUser<TUser>();
            }

            const data = (await response.json()) as {
                user?: unknown;
                userInfo?: unknown;
            };

            const user = this.normalizeUser(data.user ?? data.userInfo) as TUser | null;

            if (!user) {
                return this.getUser<TUser>();
            }

            this.updateUser(user);
            window.dispatchEvent(new Event("auth-login"));

            return user;
        } catch (error) {
            console.error("Failed to sync user profile:", error);
            return this.getUser<TUser>();
        }
    }

    static async performLogin<TUser extends DAMapUserBase = DAMapUserBase>(
        username: string,
        password: string
    ): Promise<TUser | null> {
        try {
            const url = MapApi.getURL(AuthAPIs.AUTH_LOGIN_JSON);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                let errorMessage = "Incorrect username or password";

                try {
                    const errorData = await response.json();
                    errorMessage = errorData?.message || errorMessage;
                } catch {
                    console.error("Login failed with non-JSON error response");
                }

                this.showMessage(errorMessage, "error");
                return null;
            }

            const data: LoginResponse<TUser> = await response.json();

            const accessToken = data?.token?.accessToken;
            const refreshToken = data?.token?.refreshToken;
            const userInfo = this.normalizeUser(data?.userInfo) as TUser | null;

            if (!accessToken || !refreshToken || !userInfo) {
                console.error("Invalid login response:", data);
                this.showMessage("Invalid login response from server", "error");
                return null;
            }

            this.saveToStorage(accessToken, refreshToken, userInfo);

            this.showMessage(
                `Welcome ${userInfo.name || userInfo.username || "User"}!`,
                "success"
            );

            window.dispatchEvent(new Event("auth-login"));

            return userInfo;
        } catch (error) {
            console.error("Login error:", error);
            this.showMessage("Login failed due to network/server error", "error");
            return null;
        }
    }

    static async verifyAccessToken(): Promise<boolean> {
        const token = this.getAccessToken();

        if (!token || this.isTokenExpired(token)) {
            const refreshResult = await this.refreshAccessToken();
            if (!refreshResult.success) this.clearStorage();
            return refreshResult.success;
        }

        try {
            const url = MapApi.getURL(AuthAPIs.AUTH_VERIFY_TOKEN);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            if (response.ok) return true;

            const refreshResult = await this.refreshAccessToken();
            if (!refreshResult.success) this.clearStorage();

            return refreshResult.success;
        } catch (error) {
            console.error("Token verification failed:", error);
            return false;
        }
    }

    static async refreshAccessToken(): Promise<RefreshResult> {
        if (this.refreshPromise) return this.refreshPromise;

        this.refreshPromise = (async (): Promise<RefreshResult> => {
            const refreshToken = this.getRefreshToken();

            if (!refreshToken || this.isTokenExpired(refreshToken)) {
                this.clearStorage();
                return { success: false };
            }

            try {
                const url = MapApi.getURL(AuthAPIs.AUTH_REFRESH_ACCESS_TOKEN);

                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh: refreshToken }),
                });

                if (!response.ok) {
                    this.clearStorage();
                    return { success: false };
                }

                const data: RefreshResponse = await response.json();
                const newAccessToken = data?.accessToken;
                const newRefreshToken = data?.refreshToken ?? refreshToken;
                const user = this.getUser();

                if (!user || !newAccessToken) {
                    this.clearStorage();
                    return { success: false };
                }

                this.saveToStorage(newAccessToken, newRefreshToken, user);

                return {
                    success: true,
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                };
            } catch (error) {
                console.error("Token refresh failed:", error);
                this.clearStorage();
                return { success: false };
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    static async forgotPassword(
        username: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const url = MapApi.getURL(AuthAPIs.FORGOT_PASSWORD);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username }),
            });

            const data: ApiMessageResponse = await response.json().catch(() => ({}));

            return {
                success: response.ok,
                message:
                    data?.message ||
                    (response.ok
                        ? "Password reset link sent."
                        : "Failed to send reset link."),
            };
        } catch (error) {
            console.error("Forgot password error:", error);

            return {
                success: false,
                message: "Network/server error. Please try again later.",
            };
        }
    }

    static async resetPassword(
        token: string,
        newPassword: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const url = MapApi.getURL(AuthAPIs.RESET_PASSWORD);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    new_password: newPassword,
                }),
            });

            const data: ApiMessageResponse = await response.json().catch(() => ({}));

            return {
                success: response.ok,
                message:
                    data?.message ||
                    (response.ok
                        ? "Password has been reset."
                        : "Failed to reset password."),
            };
        } catch (error) {
            console.error("Reset password error:", error);

            return {
                success: false,
                message: "Network/server error. Please try again later.",
            };
        }
    }

    static performLogout(opts?: { silent?: boolean }) {
        this.clearStorage();
        window.dispatchEvent(new Event("auth-logout"));

        if (!opts?.silent) {
            this.showMessage("Logged out", "info");
        }
    }

    static async getValidAccessToken(): Promise<string | null> {
        const accessToken = this.getAccessToken();

        if (accessToken && !this.isTokenExpired(accessToken)) {
            return accessToken;
        }

        const refreshed = await this.refreshAccessToken();
        if (!refreshed.success) return null;

        return this.getAccessToken();
    }

    static async getAuthHeader(): Promise<Record<string, string>> {
        const token = await this.getValidAccessToken();

        if (!token) return {};

        return {
            Authorization: `Bearer ${token}`,
        };
    }

    static async authenticatedFetch(
        input: RequestInfo | URL,
        init: RequestInit = {}
    ): Promise<Response> {
        const token = await this.getValidAccessToken();

        const headers = new Headers(init.headers || {});

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        let response = await fetch(input, {
            ...init,
            headers,
        });

        if (response.status !== 401) {
            return response;
        }

        const refreshResult = await this.refreshAccessToken();

        if (!refreshResult.success) {
            this.performLogout({ silent: true });
            return response;
        }

        const retryToken = this.getAccessToken();
        const retryHeaders = new Headers(init.headers || {});

        if (retryToken) {
            retryHeaders.set("Authorization", `Bearer ${retryToken}`);
        }

        return fetch(input, {
            ...init,
            headers: retryHeaders,
        });
    }
}

export default AuthServices;