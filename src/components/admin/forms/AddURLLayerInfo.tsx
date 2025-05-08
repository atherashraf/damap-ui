/**
 * AddURLLayerInfo
 * ------------------
 *
 * A form to allow admin users to add a new URL-based layer into the system.
 *
 * Features:
 * - Select URL type (WMS, WFS, TMS, Web API)
 * - Input Layer Title
 * - Input Layer URL
 * - Select or Add a Layer Category
 * - Save the new layer info using MapApi
 *
 * Usage:
 *
 * ```tsx
 * import AddURLLayerInfo from "@/components/admin/forms/AddURLLayerInfo";
 *
 * const snackbarRef = React.useRef<DASnackbarHandle>(null);
 *
 * <AddURLLayerInfo snackbarRef={snackbarRef}  />
 * ```
 *
 * Props:
 * - snackbarRef: Ref to DASnackbar for showing notifications
 * - dialogRef: Ref to DAFullScreenDialog for opening additional forms (Layer Category etc.)
 */


import {RefObject, useState} from "react";
import { Box, Button, Container, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import MapApi, { MapAPIs } from "@/api/MapApi";
import LayerCategoryControl, { ILayerCategory } from "./LayerCategoryControl";
import AddLayerCategoryForm from "./AddLayerCategoryForm";
import { DASnackbarHandle } from "@/components/base/DASnackbar";

interface IProps {
    snackbarRef: RefObject<DASnackbarHandle | null>;
    onSuccess?: () => void;
}

const AddURLLayerInfo = (props: IProps) => {
    const selectItems = ["WMS", "WFS", "TMS", "Web Api"]; // Options for URL Type

    const [selectedItem, setSelectedItem] = useState<string>("");
    const [layerURL, setLayerURL] = useState<string>("");
    const [layerTitle, setLayerTitle] = useState<string>("");
    const [layerCategoryID, setLayerCategoryID] = useState<ILayerCategory>();
    const [formType, setFormType] = useState<"LayerCategory" | null>(null);

    const mapApi = new MapApi(props.snackbarRef);

    // Render secondary form (Add Layer Category)
    const getForm = () => {
        switch (formType) {
            case "LayerCategory":
                return (
                    <AddLayerCategoryForm
                        key={"LayerCategoryFormKey"}
                        snackbarRef={props.snackbarRef}
                        handleBack={() => setFormType(null)}
                    />
                );
            default:
                return null;
        }
    };

    // Handle Save Layer Info
    const handleAddLayerInfo = () => {
        mapApi
            .get(MapAPIs.DCH_ADD_URL_LAYER_INFO, {
                layer_title: layerTitle,
                layer_category_id: layerCategoryID?.pk,
                layer_url: layerURL,
                url_type: selectedItem,
            })
            .then((payload) => {
                if (payload) {
                    props.snackbarRef.current?.show(payload.msg || "Layer Info added successfully");
                    props.onSuccess?.();
                }
            });
    };

    return (
        <>
            {formType !== null ? (
                getForm()
            ) : (
                <Container maxWidth="lg" sx={{ p: 3 }}>
                    {/* Select URL Type */}
                    <FormControl fullWidth>
                        <InputLabel>Select URL Type</InputLabel>
                        <Select
                            fullWidth
                            value={selectedItem}
                            label="Select URL Type"
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

                    {/* Layer Title */}
                    <Box sx={{ margin: "30px" }}>
                        <TextField
                            id="layer-title"
                            label="Layer Title"
                            variant="filled"
                            fullWidth
                            value={layerTitle}
                            onChange={(e) => setLayerTitle(e.target.value)}
                        />
                    </Box>

                    {/* Layer Category Selector */}
                    <Box sx={{ margin: "30px" }}>
                        <LayerCategoryControl
                            api={mapApi}
                            setLayerCategory={(layerCategory: ILayerCategory) => setLayerCategoryID(layerCategory)}
                            handleAddLayerCategory={() => setFormType("LayerCategory")}
                        />
                    </Box>

                    {/* Layer URL */}
                    <Box sx={{ margin: "30px" }}>
                        <TextField
                            id="layer-url"
                            label="Layer URL"
                            variant="filled"
                            fullWidth
                            value={layerURL}
                            onChange={(e) => setLayerURL(e.target.value)}
                        />
                    </Box>

                    {/* Submit Button */}
                    <Box sx={{ margin: "30px" }}>
                        <Button
                            color="primary"
                            variant="contained"
                            onClick={handleAddLayerInfo}
                        >
                            Add Layer Info
                        </Button>
                    </Box>
                </Container>
            )}
        </>
    );
};

export default AddURLLayerInfo;
