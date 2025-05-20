import {createSlice, PayloadAction} from "@reduxjs/toolkit";


export interface User {
    name: string;
    email: string;
    isSuperuser: boolean;
    isStaff: boolean;
    groups: string[];
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
}

function getInitialState(): AuthState {
    const accessToken = sessionStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userString = localStorage.getItem("user");

    return {
        accessToken: accessToken && accessToken !== "undefined" ? accessToken : null,
        refreshToken: refreshToken && refreshToken !== "undefined" ? refreshToken : null,
        user: userString && userString !== "undefined" ? JSON.parse(userString) : null,
    };
}

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ accessToken: string; refreshToken: string; user: User }>
        ) => {
            const {accessToken, refreshToken, user} = action.payload;
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;

            sessionStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));
        },
        updateToken: (
            state,
            action: PayloadAction<{ accessToken: string; refreshToken: string }>
        ) => {
            const {accessToken, refreshToken} = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;

            sessionStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
        },
        logout: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            sessionStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        },
    },
});

export const {setCredentials, updateToken, logout} = authSlice.actions;
export default authSlice.reducer;
export type { AuthState };
