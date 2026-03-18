import * as React from "react";
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import MapApi, { MapAPIs } from "@/api/MapApi";
import { DASnackbarHandle } from "@/components/base/DASnackbar";

interface IProps {
    handleBack: () => void;
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
}

const AddLayerCategoryForm: React.FC<IProps> = ({ snackbarRef, handleBack }) => {
    const [mainCategory, setMainCategory] = React.useState("");
    const [subCategory, setSubCategory] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const valid = mainCategory.trim().length > 0 && subCategory.trim().length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!valid || loading) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("main", mainCategory.trim());
        formData.append("sub", subCategory.trim());
        // IMPORTANT: match backend
        formData.append("model_name", "LayerCategory");

        const api = new MapApi(snackbarRef);
        try {
            const payload = await api.postFormData(MapAPIs.DCH_ADD_MODEL_ROW, formData);
            if (payload?.payload?.msg === "row added") {
                snackbarRef?.current?.show("Category added successfully ✅");
                setMainCategory("");
                setSubCategory("");
            } else {
                // Show whatever the server returned (fallback message if none)
                const errMsg =
                    payload?.error || payload?.message || "Failed to add category.";
                snackbarRef?.current?.show(`❌ ${errMsg}`);
            }
        } catch (err: any) {
            snackbarRef?.current?.show(`❌ ${err?.message || "Network/Server error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBackClick = () => {
        if (!loading) {
            setMainCategory("");
            setSubCategory("");
            handleBack();
        }
    };

    return (
        <React.Fragment>
            <Box sx={{ display: "block", margin: "20px" }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Add Layer Category
                </Typography>

                <form onSubmit={handleSubmit} noValidate>
                    <Box sx={{ m: "30px" }}>
                        <TextField
                            id="main-category"
                            label="Main Category"
                            variant="standard"
                            fullWidth
                            value={mainCategory}
                            onChange={(e) => setMainCategory(e.target.value)}
                            required
                            error={mainCategory.trim() === ""}
                            helperText={mainCategory.trim() === "" ? "Required" : " "}
                            inputProps={{ maxLength: 128 }}
                        />
                    </Box>

                    <Box sx={{ m: "30px" }}>
                        <TextField
                            id="sub-category"
                            label="Sub Category"
                            variant="standard"
                            fullWidth
                            value={subCategory}
                            onChange={(e) => setSubCategory(e.target.value)}
                            required
                            error={subCategory.trim() === ""}
                            helperText={subCategory.trim() === "" ? "Required" : " "}
                            inputProps={{ maxLength: 128 }}
                        />
                    </Box>

                    <Box sx={{ m: "30px", display: "flex", gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ backgroundColor: "black", color: "white" }}
                            disabled={!valid || loading}
                            endIcon={loading ? <CircularProgress size={16} /> : undefined}
                        >
                            {loading ? "Creating..." : "Create Category"}
                        </Button>

                        <Button
                            variant="contained"
                            sx={{ backgroundColor: "black", color: "white" }}
                            onClick={handleBackClick}
                            disabled={loading}
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
