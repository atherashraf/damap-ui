import { useEffect } from "react";
import AuthServices from "@/api/authServices";
import { useNavigate } from "react-router-dom";

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        AuthServices.performLogout({ silent: true });
        navigate("/login", { replace: true });
    }, [navigate]);

    return null;
};

export default Logout;
