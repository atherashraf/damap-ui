import * as React from "react";
import { useMapVM } from "@damap/hooks/MapVMContext";
import { LayerKind } from "@damap/components/map/manager/LayerManager";

const LOISelector = () => {
    const mapVM = useMapVM();
    const [layerIds, setLayerIds] = React.useState<string[]>([]);
    const [selectedLayerId, setSelectedLayerId] = React.useState<string>("");

    React.useEffect(() => {
        const updateLayerIds = () => {
            const daLayerIds = mapVM.getLayersByKind("da").map((r) => r.id);
            const overlayLayerIds = ["overlay", "selection", "wms", "wfs"]
                .flatMap((kind) => mapVM.getLayersByKind(kind as LayerKind).map((r) => r.id));

            const newLayerIds = [...daLayerIds, ...overlayLayerIds];

            setLayerIds(newLayerIds);

            // Guard selection boundary cleanly without re-triggering the parent effect
            setSelectedLayerId((prevSelected) => {
                if (prevSelected && !newLayerIds.includes(prevSelected)) {
                    return "";
                }
                return prevSelected;
            });
        };

        // 1. Initial execution pass on component mount
        updateLayerIds();

        // 2. Listen to the unified event that LayerManager fires
        const listener = () => updateLayerIds();
        window.addEventListener("LayerTreeChanged", listener);
        window.addEventListener("DALayerAdded", listener); // Keep fallback compatibility

        return () => {
            window.removeEventListener("LayerTreeChanged", listener);
            window.removeEventListener("DALayerAdded", listener);
        };
    }, [mapVM]); // <-- REMOVED selectedLayerId to prevent state loop traps

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
                color: "black",
                border: "2px solid #000",
                width: "200px",
                padding: "4px",
                borderRadius: "4px"
            }}
            onChange={handleChange}
            value={selectedLayerId}
        >
            <option key="opt-empty" value="">
                Select Layer of Interest
            </option>

            {layerIds.map((layerId) => {
                // Safely extract names using your existing view-model layout properties
                const record = mapVM.getLayerManager().getLayerRecord(layerId);
                const title = record?.title || layerId;

                return (
                    <option key={layerId} value={layerId}>
                        {title}
                    </option>
                );
            })}
        </select>
    );
};

export default LOISelector;