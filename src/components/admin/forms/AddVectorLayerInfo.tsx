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
import {
    Box,
    Button,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack
} from "@mui/material";
import ShpFileUploader from "@/components/admin/forms/ShpFileUploader";
import PostGISInfo from "@/components/admin/forms/PostGISInfo";
import {Fragment, RefObject, useState} from "react";

interface IProps {
    snackbarRef: RefObject<DASnackbarHandle | null>;
    onLayerAdded?: () => void;
}

const AddVectorLayerInfo = ({ snackbarRef, onLayerAdded }: IProps) => {
    const selectItems = ["Shapefile", "Postgis"];
    const [selectedItem, setSelectedItem] = useState<string>("");

    const handleClose = () => {
        setSelectedItem("");
        onLayerAdded?.(); // Refresh list in parent
    };

    // Function to return the appropriate form based on selection
    const getSelectedForm = () => {
        switch (selectedItem) {
            case "Shapefile":
                return (
                    <ShpFileUploader
                        snackbarRef={snackbarRef}
                        onSuccess={handleClose}
                    />
                );
            case "Postgis":
                return (
                    <PostGISInfo
                        snackbarRef={snackbarRef}
                        onSuccess={handleClose}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Fragment>
            <Container maxWidth="lg" sx={{ p: 3 }}>
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
                            <MenuItem key={`menu-${item}`} value={item}>
                                {item}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box mt={2}>
                    {getSelectedForm()}
                </Box>

                {/* Close Button at bottom right */}
                {selectedItem && (
                    <Stack direction="row" justifyContent="flex-end" mt={3}>
                        <Button variant="outlined" onClick={handleClose}>
                            Close
                        </Button>
                    </Stack>
                )}
            </Container>
        </Fragment>
    );
};

export default AddVectorLayerInfo;
