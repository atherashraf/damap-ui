import MapApi, { MapAPIs } from "@/api/MapApi";
import { snackbarRef } from "@/utils/snackbarRef";
import { NavigateFunction } from "react-router-dom";

export interface User {
    name: string;
    email: string;
    isSuperuser: boolean;
    isStaff: boolean;
    groups: string[];
}

class AuthServices {
    static saveToStorage(accessToken: string, refreshToken: string, user: User) {
        sessionStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
    }

    static clearStorage() {
        sessionStorage.clear();
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
    }

    static getAccessToken(): string | null {
        return sessionStorage.getItem("accessToken");
    }

    static getRefreshToken(): string | null {
        return localStorage.getItem("refreshToken");
    }

    static getUser(): User | null {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) as User : null;
    }

    static getUserGroups(): string[] {
        return this.getUser()?.groups ?? [];
    }

    static isLoggedIn(): boolean {
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        const user = this.getUser();

        if (!accessToken || !refreshToken || !user) return false;

        const isAccessValid = !this.isTokenExpired(accessToken);
        const isRefreshValid = !this.isTokenExpired(refreshToken);

        return isAccessValid || isRefreshValid;
    }

    static async checkAndRefreshLogin(): Promise<boolean> {
        const accessToken = this.getAccessToken();
        const user = this.getUser();

        if (!accessToken || this.isTokenExpired(accessToken)) {
            const refreshed = await this.refreshAccessToken();
            return refreshed.success && !!this.getUser();
        }

        return !!user;
    }

    private static isTokenExpired(token: string): boolean {
        try {
            const [, payloadBase64] = token.split(".");
            const payload = JSON.parse(atob(payloadBase64));
            const currentTime = Math.floor(Date.now() / 1000);
            // console.log("token time", payload.exp,"current time", currentTime);
            return payload.exp < currentTime;
        } catch (error) {
            console.error("Invalid token format:", error);
            return true;
        }
    }

    static async performLogin(username: string, password: string): Promise<boolean> {
        try {
            const url = MapApi.getURL(MapAPIs.API_LOGIN_JSON);
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Login error", errorData);
                snackbarRef.current?.show("Incorrect username or password");
                return false;
            }

            const data = await response.json();
            const { token, userInfo } = data;
            const { accessToken, refreshToken } = token;

            this.saveToStorage(accessToken, refreshToken, userInfo);
            snackbarRef.current?.show("Welcome " + userInfo.name + "!");
            return true;
        } catch (error) {
            console.error("Login error:", error);
            snackbarRef.current?.show("Login failed due to network/server error");
            return false;
        }
    }

    static async verifyAccessToken(): Promise<boolean> {
        const token = this.getAccessToken();
        if (!token) {
            const refreshResult = await this.refreshAccessToken();
            return refreshResult.success;
        }

        const url = MapApi.getURL(MapAPIs.API_VERIFY_TOKEN);
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });

        if (response.status === 200) return true;

        const refreshResult = await this.refreshAccessToken();
        return refreshResult.success;
    }

    static async refreshAccessToken(): Promise<{
        success: boolean;
        accessToken?: string;
        refreshToken?: string;
    }> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken || this.isTokenExpired(refreshToken)) return { success: false };

        try {
            const url = MapApi.getURL(MapAPIs.API_REFRESH_ACCESS_TOKEN);
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (!response.ok) return { success: false };

            const data = await response.json();
            const accessToken = data.access;
            const newRefreshToken = data.refresh;
            const user = this.getUser();
            if (!user) return { success: false };

            this.saveToStorage(accessToken, newRefreshToken, user);

            return {
                success: true,
                accessToken,
                refreshToken: newRefreshToken,
            };
        } catch (error) {
            console.error("Token refresh error:", error);
            return { success: false };
        }
    }

    static performLogout(navigate?: NavigateFunction) {
        this.clearStorage();
        window.dispatchEvent(new Event("auth-logout"));
        snackbarRef.current?.show("Logged out");

        if (navigate) {
            navigate("/login", { replace: true });
        } else {
            window.location.href = "/login";
        }
    }
}

export default AuthServices;
