import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Slider,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { alpha } from "@mui/material/styles";
import { LayerItem } from "./types";
import BaseMapSelect from "./BaseMapSelect";

interface LayerSwitcherBaseLayerCardProps {
  baseLayers: LayerItem[];
  selectedBaseLayer: LayerItem;
  onSelectBaseLayer: (layerId: string) => void;
  onToggleVisibility: (item: LayerItem) => void;
  onOpacityChange: (item: LayerItem, value: number | number[]) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, item: LayerItem) => void;
}

const LayerSwitcherBaseLayerCard = ({
  baseLayers,
  selectedBaseLayer,
  onSelectBaseLayer,
  onToggleVisibility,
  onOpacityChange,
  onOpenMenu,
}: LayerSwitcherBaseLayerCardProps): React.ReactElement => {
  return (
    <Card
      variant="outlined"
      sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3), position: "relative" }}
    >
      <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>
            {selectedBaseLayer.icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <BaseMapSelect
              baseLayers={baseLayers}
              selectedBaseLayer={selectedBaseLayer}
              onSelectBaseLayer={onSelectBaseLayer}
            />
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.01}
              value={selectedBaseLayer.layer.getOpacity()}
              onChange={(_, value) => onOpacityChange(selectedBaseLayer, value)}
            />
          </Box>
          <Tooltip title={selectedBaseLayer.layer.getVisible() ? "Hide Layer" : "Show Layer"}>
            <IconButton size="small" onClick={() => onToggleVisibility(selectedBaseLayer)}>
              {selectedBaseLayer.layer.getVisible() ? (
                <VisibilityIcon fontSize="small" />
              ) : (
                <VisibilityOffIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="More">
            <IconButton
              size="small"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => onOpenMenu(event, selectedBaseLayer)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LayerSwitcherBaseLayerCard;
