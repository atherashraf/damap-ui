import { useEffect } from "react";

import { useNavigate } from "react-router-dom";
import {AuthServices} from "@/libs/damap";

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        AuthServices.performLogout({ silent: true });
        navigate("/login", { replace: true });
    }, [navigate]);

    return null;
};

export default Logout;
