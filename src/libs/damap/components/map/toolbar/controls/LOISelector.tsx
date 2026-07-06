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

            if (!newLayerIds.includes(selectedLayerId)) {
                setSelectedLayerId("");
            }

            setLayerIds(newLayerIds);
        };

        updateLayerIds();

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
                color: "black",
                border: "2px solid #000",
                width: "200px",
            }}
            onChange={handleChange}
            value={selectedLayerId}
        >
            <option key="opt-empty" value="">
                Select Layer of Interest
            </option>

            {layerIds.map((layerId) => {
                const layer =
                    mapVM.getDALayer(layerId) ||
                    mapVM.getOverlayLayer(layerId);

                return (
                    <option key={layerId} value={layerId}>
                        {layer?.getLayerTitle?.() || layerId}
                    </option>
                );
            })}
        </select>
    );
};

export default LOISelector;