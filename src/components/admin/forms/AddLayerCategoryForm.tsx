/**
 * AddLayerCategoryForm
 * ----------------------
 *
 * A form to create a new Layer Category by entering Main and Sub categories.
 *
 * Features:
 * - Enter Main Category and Sub Category
 * - Submit to server via MapApi
 * - Show success message using Snackbar
 * - Back button to return to previous view
 *
 * Usage:
 *
 * <AddLayerCategoryForm
 *    snackbarRef={snackbarRef}
 *    handleBack={() => { ... }}
 * />
 *
 * Props:
 * - snackbarRef: Ref to a DASnackbar component for showing success messages
 * - handleBack: Callback to go back to previous page/view
 *
 * Dependencies:
 * - DASnackbar for notifications
 * - MapApi for API operations
 */

import * as React from "react";
import {Box, Button, TextField, Typography} from "@mui/material";
import MapApi, {MapAPIs} from "@/api/MapApi";
import {DASnackbarHandle} from "@/components/base/DASnackbar";

interface IProps {
    handleBack: () => void;
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
}

const AddLayerCategoryForm: React.FC<IProps> = (props) => {
    const [mainCategory, setMainCategory] = React.useState<string>("");
    const [subCategory, setSubCategory] = React.useState<string>("");

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("main", mainCategory);
        formData.append("sub", subCategory);
        formData.append("model_name", "layercategory");

        const api = new MapApi(props.snackbarRef);
        api.postFormData(MapAPIs.DCH_ADD_MODEL_ROW, formData).then((payload) => {
            if (payload) {
                props.snackbarRef?.current?.show("Category added successfully");
            }
        });
    };

    return (
        <React.Fragment>
            <Box
                sx={{
                    display: "block",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: "20px",
                }}
            >
                <Typography variant="h6" sx={{marginBottom: 2}}>
                    Add Layer Category
                </Typography>

                {/* Category Form */}
                <form onSubmit={handleSubmit}>
                    {/* Main Category Field */}
                    <Box sx={{margin: "30px"}}>
                        <TextField
                            id="main-category"
                            label="Main Category"
                            variant="standard"
                            fullWidth
                            value={mainCategory}
                            onChange={(e) => setMainCategory(e.target.value)}
                            required
                            error={mainCategory === ""}
                        />
                    </Box>

                    {/* Sub Category Field */}
                    <Box sx={{margin: "30px"}}>
                        <TextField
                            id="sub-category"
                            label="Sub Category"
                            variant="standard"
                            fullWidth
                            value={subCategory}
                            onChange={(e) => setSubCategory(e.target.value)}
                            required
                            error={subCategory === ""}
                        />
                    </Box>

                    {/* Buttons */}
                    <Box sx={{margin: "30px"}}>
                        <Button
                            type="submit"
                            sx={{backgroundColor: "black", color: "white"}}
                            variant="contained"
                        >
                            Create Category
                        </Button>

                        &nbsp; &nbsp;

                        <Button
                            sx={{backgroundColor: "black", color: "white"}}
                            variant="contained"
                            onClick={() => {
                                setMainCategory("");
                                setSubCategory("");
                                props.handleBack();
                            }}
                        >
                            Back
                        </Button>
                    </Box>
                </form>
            </Box>
        </React.Fragment>
    );
};

export default AddLayerCategoryForm;
