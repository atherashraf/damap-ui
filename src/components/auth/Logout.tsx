import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { useNavigate } from "react-router-dom";

const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(logout());        // ✅ clears redux + localStorage
        navigate("/");        // ✅ redirect
    }, [dispatch, navigate]);

    return null;
};

export default Logout;
