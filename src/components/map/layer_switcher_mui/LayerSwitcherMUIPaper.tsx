import * as React from "react";
import {
  Box,
  Paper,
  Stack,
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import PolylineIcon from "@mui/icons-material/Polyline";
import LayersIcon from "@mui/icons-material/Layers";
import GroupLayer from "ol/layer/Group";
import BaseLayer from "ol/layer/Base";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import MapVM from "@/components/map/models/MapVM";
import LayerSwitcherLayerCard from "@/components/map/layer_switcher_mui/LayerSwitcherLayerCard";
import LayerSwitcherLayerMenu from "@/components/map/layer_switcher_mui/LayerSwitcherLayerMenu";
import { LayerItem, LayerMenuState } from "@/components/map/layer_switcher_mui/types";
import LayerSwitcherBaseLayerCard from "@/components/map/layer_switcher_mui/LayerSwitcherBaseLayerCard";
import WMSLayer from "@/components/map/layers/overlay_layers/WMSLayer";

interface LayerSwitcherMuiProps {
  mapVM: MapVM;
}

const isVisibleInSwitcher = (layer: BaseLayer, parentTitle?: string): boolean => {
  if (layer.get("displayInLayerSwitcher") === false) return false;
  if (parentTitle === "Base Layers") return true;
  return true;
};

const getLayerTitle = (layer: BaseLayer): string => {
  return layer.get("title") || layer.get("name") || "Untitled Layer";
};

const getLayerIcon = (layer: BaseLayer, isBaseLayer: boolean): React.ReactNode => {
  if (isBaseLayer) return <PublicIcon fontSize="small" />;
  const source = (layer as any).getSource?.();
  if (source?.getFeatures) return <PolylineIcon fontSize="small" />;
  return <LayersIcon fontSize="small" />;
};

const collectVisibleLayers = (mapVM: MapVM): LayerItem[] => {
  const map = mapVM.getMap();
  if (!map) return [];

  const layers = map.getLayers().getArray();
  const items: LayerItem[] = [];

  layers.forEach((layer, idx) => {
    if (layer instanceof GroupLayer) {
      const groupTitle = layer.get("title");
      const children = layer.getLayers().getArray();
      children.forEach((child, childIdx) => {
        if (!isVisibleInSwitcher(child, groupTitle)) return;
        const isBaseLayer = child.get("baseLayer") === true || groupTitle === "Base Layers";
        items.push({
          id: `group-${idx}-${childIdx}-${getLayerTitle(child)}`,
          layer: child,
          title: getLayerTitle(child),
          isBaseLayer,
          icon: getLayerIcon(child, isBaseLayer),
        });
      });
      return;
    }

    if (!isVisibleInSwitcher(layer)) return;
    const isBaseLayer = layer.get("baseLayer") === true;
    items.push({
      id: `layer-${idx}-${getLayerTitle(layer)}`,
      layer,
      title: getLayerTitle(layer),
      isBaseLayer,
      icon: getLayerIcon(layer, isBaseLayer),
    });
  });

  return items;
};

const LayerSwitcherMUIPaper = ({ mapVM }: LayerSwitcherMuiProps): React.ReactElement => {
  const [items, setItems] = React.useState<LayerItem[]>([]);
  const [menuState, setMenuState] = React.useState<LayerMenuState | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const map = mapVM.getMap();
    if (!map) return;

    const collection = map.getLayers();
    let propertyKeys: EventsKey[] = [];

    const bindLayerPropertyListeners = () => {
      unByKey(propertyKeys);
      propertyKeys = [];

      const currentItems = collectVisibleLayers(mapVM);
      currentItems.forEach((item) => {
        propertyKeys.push(item.layer.on("change:visible", refreshItems));
        propertyKeys.push(item.layer.on("change:opacity", refreshItems));
      });
    };

    const refreshItems = () => {
      setItems(collectVisibleLayers(mapVM));
      bindLayerPropertyListeners();
    };

    const addKey = collection.on("add", refreshItems);
    const removeKey = collection.on("remove", refreshItems);
    window.addEventListener("DALayerAdded", refreshItems as EventListener);

    refreshItems();

    return () => {
      unByKey([addKey, removeKey]);
      unByKey(propertyKeys);
      window.removeEventListener("DALayerAdded", refreshItems as EventListener);
    };
  }, [mapVM]);

  const setBaseLayerVisibility = React.useCallback(
    (targetLayer: BaseLayer, visible: boolean) => {
      const map = mapVM.getMap();
      const mapLayers = map.getLayers().getArray();
      const baseGroup = mapLayers.find(
        (layer) => layer instanceof GroupLayer && layer.get("title") === "Base Layers"
      ) as GroupLayer | undefined;

      if (!baseGroup) {
        targetLayer.setVisible(visible);
        return;
      }

      if (!visible) {
        targetLayer.setVisible(false);
        return;
      }

      baseGroup.getLayers().forEach((layer) => {
        layer.setVisible(layer === targetLayer);
      });
      baseGroup.setVisible(true);
    },
    [mapVM]
  );

  const handleToggleVisibility = (item: LayerItem) => {
    const nextVisible = !item.layer.getVisible();
    if (item.isBaseLayer) {
      setBaseLayerVisibility(item.layer, nextVisible);
      return;
    }
    item.layer.setVisible(nextVisible);
    setItems((prev) => [...prev]);
  };

  const handleOpacityChange = (item: LayerItem, value: number | number[]) => {
    const opacity = Number(Array.isArray(value) ? value[0] : value);
    item.layer.setOpacity(opacity);
    setItems((prev) => [...prev]);
  };

  const baseLayers = React.useMemo(
    () => items.filter((item) => item.isBaseLayer),
    [items]
  );
  const nonBaseLayers = React.useMemo(
    () => items.filter((item) => !item.isBaseLayer),
    [items]
  );
  const selectedBaseLayer = React.useMemo(() => {
    if (baseLayers.length === 0) return null;
    return baseLayers.find((item) => item.layer.getVisible()) || baseLayers[0];
  }, [baseLayers]);

  const handleSelectBaseLayer = (layerId: string) => {
    const target = baseLayers.find((layer) => layer.id === layerId);
    if (!target) return;
    setBaseLayerVisibility(target.layer, true);
    setItems((prev) => [...prev]);
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: LayerItem) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const top = rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setMenuState({ item, top, left });
  };

  const closeMenu = () => {
    setMenuState(null);
  };

  React.useEffect(() => {
    if (!menuState) return;

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
  }, [menuState]);

  const handleAboutLayer = (_item: LayerItem) => {
    const olLayer = _item.layer as any;

    const title = olLayer.get("title") ?? "Untitled Layer";
    const uuid = olLayer.get("name") ?? "unknown";

    const visible = olLayer.getVisible?.() ?? false;
    const opacity = olLayer.getOpacity?.() ?? 1;

    const source = olLayer.getSource?.();
    const params = source?.getParams?.() ?? {};

    const sourceUrl =
        source?.getUrl?.() ??
        source?.getUrls?.()?.[0] ??
        "N/A";

    const layerType =
        source?.getFeatureInfoUrl
            ? "WMS"
            : source?.getFeatures
                ? "Vector"
                : "Raster / Tile";

    mapVM.getDialogBoxRef().current?.openDialog({
      title: `Layer Information`,
      content: (
          <Box sx={{ p: 2, minWidth: 320 }}>
            <Stack spacing={1}>

              <Box><b>Title:</b> {title}</Box>
              <Box><b>UUID:</b> {uuid}</Box>
              <Box><b>Type:</b> {layerType}</Box>
              <Box><b>Visible:</b> {String(visible)}</Box>
              <Box><b>Opacity:</b> {opacity}</Box>

              <Box sx={{ mt: 1 }}>
                <b>Source URL</b>
              </Box>

              <Box
                  sx={{
                    fontSize: 12,
                    wordBreak: "break-all",
                    bgcolor: "grey.100",
                    p: 1,
                    borderRadius: 1,
                  }}
              >
                {sourceUrl}
              </Box>

              {params && Object.keys(params).length > 0 && (
                  <>
                    <Box sx={{ mt: 1 }}>
                      <b>WMS Parameters</b>
                    </Box>

                    <Box
                        sx={{
                          fontSize: 12,
                          bgcolor: "grey.100",
                          p: 1,
                          borderRadius: 1,
                        }}
                    >
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(params, null, 2)}
                </pre>
                    </Box>
                  </>
              )}

            </Stack>
          </Box>
      ),
    });
  };
  const handleAttributeTable = (_item: LayerItem) => {
    const olLayer = _item.layer as any;
    const uuid = olLayer.get("name");
    try {
      mapVM.setLayerOfInterest(uuid);
      setTimeout(() => mapVM?.openAttributeTable?.(), 1000);
    } catch {
      mapVM.showSnackbar("Attribute table is not available");
    }

  };

  const handleZoomToLayer = async (item: LayerItem) => {
    const olLayer = item.layer as any;
    let extent =
        olLayer.get("dataExtent") ??
        olLayer.getExtent?.() ??
        olLayer.getSource?.()?.getExtent?.();
    // console.log("extent", extent, olLayer.get("dataExtent"));
    // If this is your custom WMSLayer wrapper, optionally trigger loading here too
    if (!extent) {
      const overlay = mapVM.getOverlayLayer(olLayer.get("name"));
      if (overlay instanceof  WMSLayer && overlay?.loadExtentFromCapabilities) {
        extent = await overlay.loadExtentFromCapabilities();
      }
    }

    if (extent && extent.length === 4) {
      mapVM.zoomToExtent(extent);
    } else {
      mapVM.showSnackbar("Layer extent is not available");
    }
  };

  const handleDeleteLayer = (_item: LayerItem) => {};

  const handleOpenLegend = (item: LayerItem) => {
    const legend = (item.layer as any)?.legend;
    if (!legend) return;

    let src: string | null = null;
    if (legend?.sType === "src" && typeof legend?.graphic === "string") {
      src = legend.graphic;
    } else if (legend?.sType === "canvas" && legend?.graphic?.toDataURL) {
      src = legend.graphic.toDataURL();
    } else if (legend?.sType === "sld" && legend?.graphic?.renderAsImage) {
      legend.graphic
        .renderAsImage("svg")
        .then((svgEl: Element) => {
          const svgString = svgEl.outerHTML;
          const svgSrc =
            "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
          mapVM.getDialogBoxRef().current?.openDialog({
            title: `${item.title} Legend`,
            content: (
              <Box sx={{ p: 1 }}>
                <img src={svgSrc} alt={`${item.title} legend`} style={{ maxWidth: "100%" }} />
              </Box>
            ),
          });
        })
        .catch(() => {});
      return;
    }

    if (!src) return;

    mapVM.getDialogBoxRef().current?.openDialog({
      title: `${item.title} Legend`,
      content: (
        <Box sx={{ p: 1 }}>
          <img src={src} alt={`${item.title} legend`} style={{ maxWidth: "100%" }} />
        </Box>
      ),
    });
  };

  return (
    <Paper elevation={2} sx={{ height: "100%", width: "100%", p: 1.5, overflowY: "auto" }}>
      <Stack spacing={1.25}>
        {selectedBaseLayer && (
          <LayerSwitcherBaseLayerCard
            baseLayers={baseLayers}
            selectedBaseLayer={selectedBaseLayer}
            onSelectBaseLayer={handleSelectBaseLayer}
            onToggleVisibility={handleToggleVisibility}
            onOpacityChange={handleOpacityChange}
            onOpenMenu={openMenu}
          />
        )}
        {nonBaseLayers.map((item) => (
          <LayerSwitcherLayerCard
            key={item.id}
            item={item}
            onToggleVisibility={handleToggleVisibility}
            onOpacityChange={handleOpacityChange}
            onOpenMenu={openMenu}
            onOpenLegend={handleOpenLegend}
          />
        ))}
      </Stack>
      <LayerSwitcherLayerMenu
        menuRef={menuRef}
        menuState={menuState}
        onAboutLayer={handleAboutLayer}
        onAttributeTable={handleAttributeTable}
        onZoomToLayer={handleZoomToLayer}
        onDeleteLayer={handleDeleteLayer}
      />
    </Paper>
  );
};

export default LayerSwitcherMUIPaper;
