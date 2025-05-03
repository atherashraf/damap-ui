
import { IconButton, Tooltip } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import NavigationTree from "@/components/map/widgets/NavigationTree";
import {useMapVM} from "@/components/map/toolbar/MapToolbarVMContext.tsx";

/**
 * NavigationTreeControl is a map control button that opens the map navigation tree
 * in the application's side drawer. It uses the `useMapVM` hook to access the map state.
 *
 * @component
 * @example
 * <NavigationTreeControl drawerRef={drawerRef} />
 *
 * @returns {JSX.Element} A control button that opens the map navigation tree.
 */
const NavigationTreeControl = (): JSX.Element => {
  const mapVM = useMapVM();
  const drawerRef = mapVM.getRightDrawerRef();
  const handleClick = () => {
    drawerRef?.current?.setContent("Map Navigation", <NavigationTree mapVM={mapVM} />);
    drawerRef?.current?.openDrawer();
  };

  return (
      <Tooltip title="Map Navigation">
        <IconButton sx={{ padding: "3px" }} onClick={handleClick}>
          <AccountTreeIcon />
        </IconButton>
      </Tooltip>
  );
};

export default NavigationTreeControl;
