import * as React from "react";
import { useMapVM } from "@/hooks/MapVMContext";

const LOISelector = () => {
    const [layerIds, setLayerIds] = React.useState<string[]>([]);
    const [selectedLayerId, setSelectedLayerId] = React.useState<string>("");
    const mapVM = useMapVM();

    React.useEffect(() => {
        const updateLayerIds = () => {
            const daKeys = Object.keys(mapVM.daLayers);
            const overlayKeys = Object.keys(mapVM.overlayLayers);
            const newLayerIds = [...daKeys, ...overlayKeys];

            if (!newLayerIds.includes(selectedLayerId)) {
                setSelectedLayerId(""); // reset only if selected layer no longer exists
            }

            setLayerIds(newLayerIds);
        };

        // Initial load
        updateLayerIds();

        // Event listener
        const listener = () => updateLayerIds();
        window.addEventListener("DALayerAdded", listener);

        return () => {
            window.removeEventListener("DALayerAdded", listener);
        };
    }, [mapVM, selectedLayerId]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value;
        setSelectedLayerId(selectedValue);
        mapVM.setLayerOfInterest(selectedValue);
    };

    return (
        <select
            id="loi-select"
            style={{
                backgroundColor: "white",
                border: "2px solid #000",
                width: "200px",
            }}
            onChange={handleChange}
            value={selectedLayerId}
        >
            <option key="opt-empty" value="">
                Select Layer of Interest
            </option>
            {layerIds.map((layerId, index) => {
                const layer = mapVM.getDALayer(layerId) || mapVM.getOverlayLayer(layerId);
                return (
                    <option key={`opt-${index}`} value={layerId}>
                        {layer?.getLayerTitle?.() || layerId}
                    </option>
                );
            })}
        </select>
    );
};

export default LOISelector;
