import * as React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { LayerItem } from "./types";

interface BaseMapSelectProps {
  baseLayers: LayerItem[];
  selectedBaseLayer: LayerItem;
  onSelectBaseLayer: (layerId: string) => void;
}

const BaseMapSelect = ({
  baseLayers,
  selectedBaseLayer,
  onSelectBaseLayer,
}: BaseMapSelectProps): React.ReactElement => {
  const [open, setOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
    setOpen(true);
  };
  const openMenuFromKeyboard = (event: React.KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
  };

  const handleSelect = (layerId: string) => {
    onSelectBaseLayer(layerId);
    closeMenu();
  };

  React.useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        closeMenu();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <Box>
      <Tooltip title={selectedBaseLayer.title} placement="top">
        <Box
          role="button"
          tabIndex={0}
          onClick={openMenu}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openMenuFromKeyboard(event);
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.5,
            minHeight: 32,
            px: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            cursor: "pointer",
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 16,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {selectedBaseLayer.title}
          </Typography>
          <ExpandMoreIcon fontSize="small" />
        </Box>
      </Tooltip>
      {open && menuPosition && (
        <Paper
          ref={menuRef}
          elevation={8}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            zIndex: 3200,
          }}
        >
          <List dense>
            {baseLayers.map((layer) => (
              <ListItemButton
                key={layer.id}
                selected={layer.id === selectedBaseLayer.id}
                onClick={() => handleSelect(layer.id)}
              >
                <Tooltip title={layer.title} placement="right">
                  <ListItemText
                    primary={layer.title}
                    primaryTypographyProps={{
                      noWrap: true,
                    }}
                  />
                </Tooltip>
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default BaseMapSelect;
