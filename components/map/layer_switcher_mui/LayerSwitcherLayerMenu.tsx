import * as React from "react";
import { Divider, List, ListItemButton, ListItemText, Paper } from "@mui/material";
import { LayerItem, LayerMenuState } from "./types";

interface LayerSwitcherLayerMenuProps {
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuState: LayerMenuState | null;
  onAboutLayer: (item: LayerItem) => void;
  onAttributeTable: (item: LayerItem) => void;
  onZoomToLayer: (item: LayerItem) => void;
  onDeleteLayer: (item: LayerItem) => void;
}

const LayerSwitcherLayerMenu = ({
  menuRef,
  menuState,
  onAboutLayer,
  onAttributeTable,
  onZoomToLayer,
  onDeleteLayer,
}: LayerSwitcherLayerMenuProps): React.ReactElement | null => {
  if (!menuState) return null;

  return (
    <Paper
      ref={menuRef}
      elevation={8}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: "fixed",
        top: menuState.top,
        left: menuState.left,
        zIndex: 3000,
        minWidth: 220,
      }}
    >
      <List dense>
        <ListItemButton onClick={() => onAboutLayer(menuState.item)}>
          <ListItemText primary="About Layer" />
        </ListItemButton>
        <ListItemButton onClick={() => onAttributeTable(menuState.item)}>
          <ListItemText primary="Attribute Table" />
        </ListItemButton>
        <ListItemButton onClick={() => onZoomToLayer(menuState.item)}>
          <ListItemText primary="Zoom To Layer" />
        </ListItemButton>
      </List>
      <Divider />
      <List dense>
        <ListItemButton onClick={() => onDeleteLayer(menuState.item)}>
          <ListItemText primary="Delete Layer" />
        </ListItemButton>
      </List>
    </Paper>
  );
};

export default LayerSwitcherLayerMenu;
