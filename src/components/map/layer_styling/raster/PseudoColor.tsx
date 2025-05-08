import React, { useRef, useState, useCallback } from "react";
import { Box, FormControl, TextField, Button } from "@mui/material";
import ColorRamp from "../atoms/ColorRamp";
import AddStyleButton from "../atoms/AddStyleButton";
import LegendGrid from "../atoms/LegendGrid";
import { IRule } from "@/types/typeDeclarations";
import { MapAPIs } from "@/api/MapApi";
import MapVM from "@/components/map/models/MapVM";

// ---- Types ----
interface BandStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  q25: number;
  q75: number;
  max: number;
  sum: number;
}

interface BandInfo {
  bandCount: number;
  bandsInfo: {
    [bandIndex: number]: BandStats;
  };
}

interface Props {
  mapVM: MapVM;
  bandInfo: BandInfo;
}

const PseudoColor: React.FC<Props> = ({ mapVM, bandInfo }) => {
  const [noOfClasses, setNoOfClasses] = useState<number>(3);
  const [styleList, setStyleList] = useState<IRule[]>([]);

  const colorRampRef = useRef<ColorRamp | null>(null);
  const legendGridRef = useRef<LegendGrid | null>(null);

  const stats = bandInfo.bandsInfo[0];

  const calculateClassValue = (classIndex: number): number => {
    const percentile = Math.round((classIndex / noOfClasses) * 100);

    if (percentile >= 0 && percentile <= 25) {
      return stats.min + ((stats.q25 - stats.min) * percentile) / 25;
    } else if (percentile <= 50) {
      return stats.q25 + ((stats.median - stats.q25) * (percentile - 25)) / 25;
    } else if (percentile <= 75) {
      return stats.median + ((stats.q75 - stats.median) * (percentile - 50)) / 25;
    } else {
      return stats.q75 + ((stats.max - stats.q75) * (percentile - 75)) / 25;
    }
  };

  const addStyles = useCallback(() => {
    const styles: IRule[] = [];
    for (let i = 0; i < noOfClasses; i++) {
      const value = calculateClassValue(i);
      const color =
          colorRampRef.current?.getColor(noOfClasses, i) || "#000000";
      styles.push({
        title: value.toFixed(3),
        style: { fillColor: color },
      });
    }
    setStyleList(styles);
  }, [noOfClasses]);

  const removeStyles = () => {
    setStyleList([]);
  };

  const updateStyleItem = (index: number, styleRule: IRule) => {
    const updated = [...styleList];
    updated[index] = { ...updated[index], ...styleRule };
    setStyleList(updated);
  };

  const saveStyle = () => {
    mapVM.showSnackbar("Creating new style");

    const values = styleList.map((item) => parseFloat(item.title));
    const palette = styleList.map((item) => item.style.fillColor);

    const payload = {
      min_val: stats.min,
      max_val: stats.max,
      values,
      palette,
    };
    console.log("map info", mapVM.getMapInfo());
    mapVM
        .getApi()
        .post(MapAPIs.DCH_SAVE_STYLE, payload, {
          uuid: mapVM.getLayerOfInterest(),
            map_uuid: "-1"
        })
        .then(() => {
          mapVM.showSnackbar("Style saved successfully");
          const daLayer = mapVM.getDALayer(mapVM.getLayerOfInterest());
          setTimeout(() => daLayer?.refreshLayer(), 2000);
        });
  };

  return (
      <>
        <Box sx={{ flex: 1, pt: 1 }}>
          <FormControl fullWidth size="small">
            <TextField
                type="number"
                label="No of Classes"
                size="small"
                value={noOfClasses}
                onChange={(e) => {
                  const val = parseInt(e.target.value || "0");
                  if (!isNaN(val) && val >= 1 && val <= 10) {
                    setNoOfClasses(val);
                  }
                }}
                InputProps={{
                  inputMode: "numeric",
                  inputProps: { min: 1, max: 10 },
                }}
            />
          </FormControl>
        </Box>

        <Box sx={{ flex: 1, pt: 1 }}>Color Ramp:</Box>
        <Box sx={{ flex: 1, pt: 1 }}>
          <ColorRamp ref={colorRampRef} mapVM={mapVM} />
        </Box>

        <Box sx={{ flex: 1, pt: 1 }}>
          <AddStyleButton
              menuList={[
                { name: "Add Style", handleClick: addStyles },
                { name: "Remove Styles", handleClick: removeStyles },
              ]}
          />
        </Box>

        <LegendGrid
            ref={legendGridRef}
            styleList={styleList}
            updateStyleItem={updateStyleItem}
            mapVM={mapVM}
            layerId={mapVM.getLayerOfInterest()}
        />

        <Box sx={{ flex: 1, pt: 1 }}>
          <Button
              variant="contained"
              color="primary"
              sx={{ width: "100%" }}
              onClick={saveStyle}
          >
            Save Style
          </Button>
        </Box>
      </>
  );
};

export default PseudoColor;
