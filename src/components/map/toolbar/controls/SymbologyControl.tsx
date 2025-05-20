import * as React from "react";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import { IconButton, Tooltip } from "@mui/material";

import SymbologySetting from "@/components/map/layer_styling/SymbologySetting";
import {useMapVM} from "@/components/map/models/MapVMContext";

const SymbologyControl = () => {
  const mapVM = useMapVM();
  const theme = mapVM.getTheme();
  const drawerRef = mapVM.getRightDrawerRef();
  const handleClick = () => {
    drawerRef?.current?.setContent(
      "Layer Styler",
      <SymbologySetting key={"symbology-setting"} mapVM={mapVM} />
    );
    drawerRef?.current?.openDrawer();
    // props.mapVM?.refreshMap()
  };
  return (
    <React.Fragment>
      <Tooltip title={"Create Layer Style"}>
        <IconButton sx={{ width: 30, height: 30 }}
                    style={{width: 30, height: 30,
                      backgroundColor: theme?.palette.secondary.main,
                      color:theme?.palette.secondary.contrastText}}
                    onClick={handleClick}>
          <DesignServicesIcon />
        </IconButton>
      </Tooltip>
    </React.Fragment>
  );
};

export default SymbologyControl;
