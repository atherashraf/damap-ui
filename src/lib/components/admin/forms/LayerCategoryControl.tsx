/**
 * LayerCategoryControl
 * ----------------------
 *
 * A dropdown selector to choose a Layer Category.
 *
 * Features:
 * - Fetches available Layer Categories from the server
 * - Allows selecting a Layer Category
 * - Provides a button to trigger "Add New Layer Category" form
 *
 * Usage:
 *
 * <LayerCategoryControl
 *    api={apiInstance}
 *    handleAddLayerCategory={() => { ... }}
 *    setLayerCategory={(layerCategory) => { ... }}
 * />
 *
 * Props:
 * - api: instance of MapApi for fetching categories
 * - handleAddLayerCategory: callback function to open the Add Category form
 * - setLayerCategory: callback when a category is selected
 */

import * as React from "react";
import { useState } from "react";
import { FormControl, Button, Stack, InputLabel, Select, MenuItem } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import MapApi, { MapAPIs } from "@/api/MapApi";

// Interface for a Layer Category
export interface ILayerCategory {
    pk: string;
    name: string;
}

// Props expected by LayerCategoryControl
interface IProps {
    api: MapApi;
    handleAddLayerCategory: () => void;              // 🔵 Correct typing for function
    setLayerCategory: (layerCategory: ILayerCategory) => void;
}

const LayerCategoryControl: React.FC<IProps> = (props) => {
    const [layerCategories, setLayerCategories] = useState<ILayerCategory[]>([]);
    const [selectedLayerCat, setSelectedLayerCat] = useState<ILayerCategory | undefined>(undefined);

    // Handle user selecting a Layer Category
    const handleLayerCategoryChange = (e: any) => {
        const selectedCategory = layerCategories.find(cat => cat.pk === e.target.value);
        if (selectedCategory) {
            props.setLayerCategory(selectedCategory);
            setSelectedLayerCat(selectedCategory);
        }
    };

    // Fetch Layer Categories from API
    const updateLayerCategories = React.useCallback(() => {
        props.api.get(MapAPIs.DCH_LAYER_CATEGORIES).then((payload) => {
            setLayerCategories(payload);
        });
    }, [props.api]);

    // Fetch categories on mount
    React.useEffect(() => {
        updateLayerCategories();
    }, [updateLayerCategories]);

    return (
        <FormControl variant="standard" fullWidth>
            <Stack direction="row" alignItems="center" spacing={3}>
                <InputLabel id="layer-category-label">Layer Category</InputLabel>
                <Select
                    labelId="layer-category-label"
                    id="layer-category-select"
                    value={selectedLayerCat?.pk ?? ""}
                    onChange={handleLayerCategoryChange}
                    sx={{ flexGrow: 1, p:2 }}
                >
                    {layerCategories.map((item) => (
                        <MenuItem key={item.pk} value={item.pk}>
                            {item.name}
                        </MenuItem>
                    ))}
                </Select>

                {/* Button to Add a New Category */}
                <Button onClick={props.handleAddLayerCategory}>
                    <EditIcon />
                </Button>
            </Stack>
        </FormControl>
    );
};

export default LayerCategoryControl;
