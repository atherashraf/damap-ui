import { useState } from "react";
import MapVM from "@/components/map/models/MapVM";
import { Box, Button, FormControl, Stack, Typography } from "@mui/material";
import TypeAhead from "@/components/map/widgets/TypeAhead";

interface AddLayerPanelProps {
    mapVM: MapVM;
    layers: any;
}

const AddLayerPanel = (props: AddLayerPanelProps) => {
    const options = props.layers.sort((a: any, b: any) => {
        const fa = a.title.toLowerCase();
        const fb = b.title.toLowerCase();
        return fa.localeCompare(fb);
    });

    const [selectedOption, setSelectedOption] = useState<string>(options[0]?.uuid || "");

    const handleOptionChange = (selected: any) => {
        setSelectedOption(selected.uuid);
    };

    const handleAddButton = async () => {
        if (selectedOption) {
            await props.mapVM.addDALayer({ uuid: selectedOption });
        }
    };

    return (
        <Box width="100%" p={2} sx={{overflow:"hidden"}}>
            <Typography variant="h6" gutterBottom>
                Add New Layer
            </Typography>

            <Stack spacing={2} width="90%">
                <FormControl >
                    <TypeAhead
                        data={props.layers}
                        inputLabel="Select Layer"
                        optionLabelKey="title"
                        onChange={handleOptionChange}
                    />
                </FormControl>

                <Button
                    // fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleAddButton}
                    sx={{overflow:"hidden"}}
                >
                    Add Layer
                </Button>

                {/*<Box id="div-add_layer" width="100%" height="auto" />*/}
            </Stack>
        </Box>
    );
};

export default AddLayerPanel;
