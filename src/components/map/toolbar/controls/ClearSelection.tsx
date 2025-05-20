import { IconButton, Tooltip } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import * as React from "react";
import {useMapVM} from "@/components/map/models/MapVMContext";

const ClearSelection = () => {
  const mapVM = useMapVM();
  const theme = mapVM.getTheme();
  const handleClick = () => {

    mapVM?.getSelectionLayer()?.clearSelection();
  };
  return (
    <React.Fragment>
      <Tooltip title={"Clear Selection"}>
        <IconButton sx={{ padding: "3px" }}
                    style={{width: 30, height: 30,
                      backgroundColor: theme?.palette.secondary.main,
                      color:theme?.palette.secondary.contrastText}}
                    onClick={handleClick}>
          <ClearIcon />
        </IconButton>
      </Tooltip>
    </React.Fragment>
  );
};

export default ClearSelection;
