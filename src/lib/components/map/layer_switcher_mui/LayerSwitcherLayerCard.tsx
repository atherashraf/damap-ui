import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Paper,
  Slider,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { alpha } from "@mui/material/styles";
import { LayerItem } from "./types";

interface LayerSwitcherLayerCardProps {
  item: LayerItem;
  onToggleVisibility: (item: LayerItem) => void;
  onOpacityChange: (item: LayerItem, value: number | number[]) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, item: LayerItem) => void;
  onOpenLegend: (item: LayerItem) => void;
}

const LayerSwitcherLayerCard = ({
  item,
  onToggleVisibility,
  onOpacityChange,
  onOpenMenu,
  onOpenLegend,
}: LayerSwitcherLayerCardProps): React.ReactElement => {
  const legend = (item.layer as any)?.legend;
  const legendType = legend?.sType;
  const [sldPreviewSrc, setSldPreviewSrc] = React.useState<string | null>(null);
  const [legendExpanded, setLegendExpanded] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    if (legendType === "sld" && legend?.graphic?.renderAsImage) {
      legend.graphic
        .renderAsImage("svg")
        .then((svgEl: Element) => {
          if (cancelled) return;
          const svgString = svgEl.outerHTML;
          const src =
            "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
          setSldPreviewSrc(src);
        })
        .catch(() => {
          if (!cancelled) setSldPreviewSrc(null);
        });
    } else {
      setSldPreviewSrc(null);
    }
    return () => {
      cancelled = true;
    };
  }, [legendType, legend]);

  const hasLegendPreview = legendType === "src" || legendType === "canvas" || legendType === "sld";
  const previewSrc =
    legendType === "src"
      ? legend?.graphic
      : legendType === "canvas" && legend?.graphic?.toDataURL
        ? legend.graphic.toDataURL()
        : legendType === "sld"
          ? sldPreviewSrc || undefined
          : undefined;

  return (
    <Card
      variant="outlined"
      sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3), position: "relative" }}
    >
      <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>
            {item.icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Tooltip title={item.title} placement="top">
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {item.title}
              </Typography>
            </Tooltip>
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.01}
              value={item.layer.getOpacity()}
              onChange={(_, value) => onOpacityChange(item, value)}
            />
          </Box>
          <Tooltip title={item.layer.getVisible() ? "Hide Layer" : "Show Layer"}>
            <IconButton size="small" onClick={() => onToggleVisibility(item)}>
              {item.layer.getVisible() ? (
                <VisibilityIcon fontSize="small" />
              ) : (
                <VisibilityOffIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          {hasLegendPreview && previewSrc && (
            <Tooltip title={legendExpanded ? "Collapse legend" : "Expand legend"}>
              <IconButton size="small" onClick={() => setLegendExpanded((prev) => !prev)}>
                {legendExpanded ? (
                  <KeyboardArrowUpIcon fontSize="small" />
                ) : (
                  <KeyboardArrowDownIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="More">
            <IconButton
              size="small"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => onOpenMenu(event, item)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
      {hasLegendPreview && previewSrc && (
        <Collapse in={legendExpanded} timeout="auto" unmountOnExit>
          <Tooltip title="Open full legend">
            <Paper
              elevation={0}
              onClick={() => onOpenLegend(item)}
              sx={{
                mx: 1.25,
                mb: 1.25,
                p: 0.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.7),
                maxHeight: 220,
                overflow: "hidden",
              }}
            >
              <img
                src={previewSrc}
                alt={`${item.title} legend`}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  objectFit: "contain",
                  objectPosition: "top center",
                  display: "block",
                }}
              />
            </Paper>
          </Tooltip>
        </Collapse>
      )}
    </Card>
  );
};

export default LayerSwitcherLayerCard;
