/**
 * AddVectorLayerInfo
 * ------------------
 *
 * A component to allow admin users to upload vector layers into the system.
 *
 * Features:
 * - Select Upload Type (Shapefile or PostGIS Table)
 * - Based on the selection, dynamically load the corresponding form:
 *   - ShpFileUploader: Upload multiple Shapefile-related files (.shp, .shx, .dbf, .prj)
 *   - PostGISInfo: Select an existing PostGIS table and create a layer
 * - Uses DASnackbar for showing success/error messages
 * - Uses DAFullScreenDialog (if needed) for related form dialogs
 *
 * Usage:
 *
 * ```tsx
 * import AddVectorLayerInfo from "@/components/admin/forms/AddVectorLayerInfo";
 *
 * const snackbarRef = React.useRef<DASnackbarHandle>(null);
 *
 * <AddVectorLayerInfo snackbarRef={snackbarRef} />
 * ```
 *
 * Props:
 * - snackbarRef: Ref to DASnackbar component for notifications
 * - dialogRef: Ref to DAFullScreenDialog component (currently unused here but passed)
 */

import { DASnackbarHandle } from "@/components/base/DASnackbar";
import { Box, Container, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import ShpFileUploader from "@/components/admin/forms/ShpFileUploader";
import PostGISInfo from "@/components/admin/forms/PostGISInfo";
import {Fragment, RefObject, useState} from "react";

interface IProps {
    snackbarRef: RefObject<DASnackbarHandle | null>; // ✅ Correctly typed Snackbar Ref
}

const AddVectorLayerInfo = (props: IProps) => {
    const selectItems = ["Shapefile", "Postgis"]; // Available options
    const [selectedItem, setSelectedItem] = useState<string>(""); // Selected option

    // Function to return the appropriate form based on selection
    const getSelectedForm = () => {
        switch (selectedItem) {
            case "Shapefile":
                return <ShpFileUploader snackbarRef={props.snackbarRef} />;
            case "Postgis":
                return <PostGISInfo snackbarRef={props.snackbarRef} />;
            default:
                props.snackbarRef.current?.show("Please select form type");
                return null;
        }
    };

    return (
        <Fragment>
            <Container maxWidth="lg" sx={{ p: 3 }}>
                {/* Select Upload Type */}
                <FormControl fullWidth>
                    <InputLabel>Select Upload Type</InputLabel>
                    <Select
                        fullWidth
                        value={selectedItem}
                        onChange={(e: SelectChangeEvent<string>) =>
                            setSelectedItem(e.target.value as string)
                        }
                    >
                        {selectItems.map((item) => (
                            <MenuItem key={"menu-" + item} value={item}>
                                {item}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Form based on selected option */}
                <Box>
                    {getSelectedForm()}
                </Box>
            </Container>
        </Fragment>
    );
};

export default AddVectorLayerInfo;
