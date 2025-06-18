
import { IconButton, Tooltip } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import {useMapVM} from "@/hooks/MapVMContext";

const RefreshMap = () => {
  const mapVM = useMapVM();
  const theme = mapVM.getTheme();
  const handleClick = () => {
    const map = mapVM.getMap();
    map?.render();
    map?.setSize(map.getSize());
    map?.updateSize();
    mapVM.refreshMap();
  };
  return (
    <>
      <Tooltip title={"Refresh Map"}>
        <IconButton sx={{ padding: "3px" }} style={{width: 30, height: 30,
          backgroundColor: theme?.palette.secondary.main,
          color:theme?.palette.secondary.contrastText}}
                    onClick={handleClick}>
          <AutorenewIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default RefreshMap;
