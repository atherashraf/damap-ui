import * as React from "react";
import { useMapVM } from "@/hooks/MapVMContext";

const LOISelector = () => {
    const [layerIds, setLayerIds] = React.useState<string[]>([]);
    const mapVM = useMapVM();

    // Register DALayerAdded once and update layerIds when the event is dispatched
    React.useEffect(() => {
        const updateLayerIds = () => {
            const daKeys = Object.keys(mapVM.daLayers);

            const overlayKeys = Object.keys(mapVM.overlayLayers);

            setLayerIds([...daKeys, ...overlayKeys]);
        };

        // Initial load
        updateLayerIds();

        // Event listener
        const listener = () => updateLayerIds();
        window.addEventListener("DALayerAdded", listener);

        return () => {
            window.removeEventListener("DALayerAdded", listener);
        };
    }, [mapVM]);

    return (
        <React.Fragment>
            <select
                id="loi-select"
                style={{
                    backgroundColor: "white",
                    border: "2px solid #000",
                    width: "200px",
                }}
                onChange={(e) => mapVM.setLayerOfInterest(e.target.value)}
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
        </React.Fragment>
    );
};

export default LOISelector;
