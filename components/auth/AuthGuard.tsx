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

import { Navigate, useLocation } from "react-router-dom";
import { JSX } from "react";
import AuthServices from "@/api/authServices";


export const AuthGuard = ({ children }: { children: JSX.Element }) => {
    const token = AuthServices.getAccessToken();
    const location = useLocation();

    // Check for actual null, undefined, or the literal strings "null"/"undefined"
    const isAuthenticated = token && token !== "null" && token !== "undefined";

    if (!isAuthenticated) {
        console.log("Redirecting to login from:", location.pathname);
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};
