
import { IconButton, Tooltip } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import {useMapVM} from "@/components/map/models/MapVMContext.tsx";

const RefreshMap = () => {
  const mapVM = useMapVM();

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
        <IconButton sx={{ padding: "3px" }} onClick={handleClick}>
          <AutorenewIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default RefreshMap;
