import {Outlet} from "react-router-dom";
import DAAppBar from "@/components/base/DAAppbar";
import DASnackbar from "@/components/base/DASnackbar";
import {snackbarRef} from "@/utils/snackbarRef";

const DashboardLayout = () => {
    return (
        <>
            <DAAppBar snackbarRef={snackbarRef}/>

            <div style={{ height: "calc(100vh - 150px)", overflow: "auto" }}>
                <Outlet />
            </div>

            <DASnackbar ref={snackbarRef}/>
        </>
    );
};

export default DashboardLayout;
