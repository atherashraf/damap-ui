import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import AuthServices from "@/api/authServices";

const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        AuthServices.performLogout(navigate)
        navigate("/");        // ✅ redirect
    }, [dispatch, navigate]);

    return null;
};

export default Logout;
