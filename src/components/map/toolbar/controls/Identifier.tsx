import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import IdentifyResult from "@/components/map/widgets/IdentifyResult.tsx";
import {useMapVM} from "@/components/map/toolbar/MapToolbarVMContext.tsx";

const Identifier = () => {
  const mapVM= useMapVM();
  const drawerRef = mapVM.getRightDrawerRef();
  const handleClick = () => {
    drawerRef?.current?.setContent(
      "Identifier",
      <IdentifyResult mapVM={mapVM}/>
    );
    drawerRef?.current?.openDrawer();
    // props.mapVM.refreshMap();
    // props.mapVM.identifyFeature();
  };
  return (
    <React.Fragment>
      <Tooltip title={"Identify Feature"}>
        <IconButton sx={{ padding: "3px" }} onClick={handleClick}>
          <InfoIcon />
        </IconButton>
      </Tooltip>
    </React.Fragment>
  );
};
export default Identifier;
