import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import IdentifyResult from "@/components/map/widgets/IdentifyResult";
import {useMapVM} from "@/hooks/MapVMContext";

const Identifier = () => {
  const mapVM= useMapVM();
  const theme = mapVM.getTheme();
  const drawerRef = mapVM.getRightDrawerRef();
  const handleClick = () => {
    drawerRef?.current?.setContent(
      "Identifier",
      <IdentifyResult />
    );
    drawerRef?.current?.openDrawer();
    // props.mapVM.refreshMap();
    // props.mapVM.identifyFeature();
  };
  return (
    <React.Fragment>
      <Tooltip title={"Identify Feature"}>
        <IconButton sx={{ padding: "3px" }}
                    style={{width: 30, height: 30,
                      backgroundColor: theme?.palette.secondary.main,
                      color:theme?.palette.secondary.contrastText}}
                    onClick={handleClick}>
          <InfoIcon />
        </IconButton>
      </Tooltip>
    </React.Fragment>
  );
};
export default Identifier;
