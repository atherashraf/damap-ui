import { IconButton, Tooltip } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import * as React from "react";
import {useMapVM} from "@/components/map/toolbar/MapToolbarVMContext.tsx";

const ClearSelection = () => {
  const mapVM = useMapVM();
  const handleClick = () => {

    mapVM.getSelectionLayer().clearSelection();
  };
  return (
    <React.Fragment>
      <Tooltip title={"Clear Selection"}>
        <IconButton sx={{ padding: "3px" }} onClick={handleClick}>
          <ClearIcon />
        </IconButton>
      </Tooltip>
    </React.Fragment>
  );
};

export default ClearSelection;
