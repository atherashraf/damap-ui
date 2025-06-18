import MapApi, {MapAPIs} from "@/api/MapApi";
import {store} from "@/store";
import {setCredentials, logout, updateToken} from "@/store/slices/authSlice";
import {snackbarRef} from "@/utils/snackbarRef";

export class AuthServices {
    static async performLogin(username: string, password: string): Promise<boolean> {
        try {
            const url = MapApi.getURL(MapAPIs.API_LOGIN_JSON);

            const response = await fetch(url, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Login error", errorData);
                snackbarRef.current?.show("Incorrect username or password");
                return false
            }
            const data = await response.json();
            // console.log("data:", data);
            const {token, userInfo} = data;
            const {accessToken, refreshToken} = token;
            store.dispatch(setCredentials({accessToken, refreshToken, user: userInfo}));
            snackbarRef.current?.show("Welcome " + userInfo.name + "!");
            return true
        } catch (error) {
            console.error("Login error:", error);
            snackbarRef.current?.show("Incorrect username or password");
            return false;
        }
    }

    static async verifyAccessToken(): Promise<boolean> {
        let token = store.getState().auth.accessToken;
        // console.log("access token:", token);
        if (!token) {
            // console.warn("Access token missing. Trying to refresh...");

            const refreshResult = await AuthServices.refreshAccessToken();
            if (refreshResult.success && refreshResult.accessToken) {
                // console.log("Token refreshed successfully.");
                return true; // ✅ Success, no need to verify anymore
            } else {
                // console.error("Token refresh failed.");
                return false; // Cannot refresh either, real failure
            }
        }


        const url = MapApi.getURL(MapAPIs.API_VERIFY_TOKEN);

        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token}),
        });

        return response.status === 200;
        // return true
    }


    static async refreshAccessToken(): Promise<{
        success: boolean;
        accessToken?: string;
        refreshToken?: string;
    }> {
        try {
            const refreshToken = store.getState().auth.refreshToken;
            if (!refreshToken) return {success: false};
            const url = MapApi.getURL(MapAPIs.API_REFRESH_ACCESS_TOKEN);

            const response = await fetch(url, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({refresh: refreshToken}),
            });

            // if (!response.ok) {
            //     return { success: false };
            // }

            const data = await response.json();
            console.log("data:", data);
            store.dispatch(updateToken({accessToken: data.access, refreshToken: data.refresh}));

            return {
                success: true,
                accessToken: data.access,
                refreshToken: data.refresh,
            };
        } catch (error) {
            console.error("Token refresh error:", error);
            return {success: false};
        }
    }

    static performLogout() {
        store.dispatch(logout());
        window.location.href = "/login"; // Redirect to login page
    }
}
