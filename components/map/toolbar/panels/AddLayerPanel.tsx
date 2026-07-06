import { useMemo, useState } from "react";
import MapVM from "@damap/components/map/models/MapVM";
import { Box, Button, FormControl, Stack, Typography } from "@mui/material";
import TypeAhead from "@damap/components/map/widgets/TypeAhead";

interface LayerOption {
    uuid: string;
    title: string;
}

interface AddLayerPanelProps {
    mapVM: MapVM;
    layers: LayerOption[];
}

const AddLayerPanel = ({ mapVM, layers }: AddLayerPanelProps) => {
    const options = useMemo(
        () =>
            [...layers].sort((a, b) =>
                a.title.toLowerCase().localeCompare(b.title.toLowerCase())
            ),
        [layers]
    );

    const [selectedOption, setSelectedOption] = useState<string>(options[0]?.uuid ?? "");
    const [isAdding, setIsAdding] = useState(false);

    const handleOptionChange = (selected: LayerOption | null) => {
        setSelectedOption(selected?.uuid ?? "");
    };

    const handleAddButton = async () => {
        if (!selectedOption || isAdding) return;

        try {
            setIsAdding(true);
            await mapVM.addDALayer({ uuid: selectedOption });
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Box width="100%" p={2}>
            <Typography variant="h6" gutterBottom>
                Add New Layer
            </Typography>

            <Stack spacing={2} width="100%">
                <FormControl fullWidth>
                    <TypeAhead
                        data={options}
                        inputLabel="Select Layer"
                        optionLabelKey="title"
                        onChange={handleOptionChange}
                    />
                </FormControl>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddButton}
                    disabled={!selectedOption || isAdding}
                >
                    {isAdding ? "Adding..." : "Add Layer"}
                </Button>
            </Stack>
        </Box>
    );
};

export default AddLayerPanel;
