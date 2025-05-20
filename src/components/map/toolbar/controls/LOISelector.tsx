import * as React from "react";
import {useMapVM} from "@/components/map/models/MapVMContext";


const LOISelector = () => {
  const [layerIds, setLayerIds] = React.useState<string[]>([]);
  const mapVM = useMapVM();
  window.addEventListener("DALayerAdded", () => {
    const k: string[] = Object.keys(mapVM.daLayers);
    setLayerIds(k);
    // props.mapVM.setLayerOfInterest(k[0])
  });
  return (
    <React.Fragment>
      <select
        id={"loi-select"}
        style={{
          backgroundColor: "white",
          border: "2px solid #000",
          width: "200px",
        }}
        onChange={(e) =>
          mapVM.setLayerOfInterest(e.target.value as string)
        }
      >
        <option key={"opt-empty"} value={""}>
          Select Layer of Interest
        </option>
        {layerIds.map((layerId, index) => {
          const layer = mapVM.getDALayer(layerId);
          return (
            <option key={"opt-" + index} value={layerId}>
              {layer?.getLayerTitle()}
            </option>
          );
        })}
      </select>
    </React.Fragment>
  );
};

export default LOISelector;
