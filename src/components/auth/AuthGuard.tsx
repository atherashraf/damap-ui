/**
 * AuthGuard.tsx
 *
 * Purpose:
 *  - Protects individual routes or components based on authentication status.
 *  - Checks if the user has a valid access token.
 *  - If no token is found, redirects the user to the Login page.
 *  - Also saves the page the user was trying to access using React Router's `location.state`.
 *
 * Usage:
 *  - Wrap your protected routes with <AuthGuard> in App.tsx or wherever your routes are defined.
 *
 * Example:
 *  <Route
 *    path="/dashboard"
 *    element={
 *      <AuthGuard>
 *        <Dashboard />
 *      </AuthGuard>
 *    }
 *  />
 */

import {Navigate, useLocation} from "react-router-dom";
import { useSelector } from "react-redux";
import { MapRootState } from "@/store";
import {JSX} from "react";

export const AuthGuard = ({ children }: { children: JSX.Element }) => {
    const token =
        useSelector((state: MapRootState) => state.auth.accessToken) ||
        localStorage.getItem("accessToken");
    const location = useLocation(); // Capture the current location

    // If token exists, allow access to the children
    // Otherwise, redirect to login page with the original location saved in state
    return token ? children : <Navigate to="/login" state={{ from: location }} replace />;
};
    // console.log("token", token);
//     return token ? children : <Navigate to="/login" />;
// };


