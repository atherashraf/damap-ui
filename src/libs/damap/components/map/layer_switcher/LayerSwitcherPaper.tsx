import { Box, Paper } from "@mui/material";
import * as React from "react";
import "@damap/assets/css/LayerSwitcher.css";
import { Group } from "ol/layer";
import LayerSwitcher from "ol-ext/control/LayerSwitcher";
import { useEffect, useState, useRef } from "react";
import MapVM from "@damap/components/map/models/MapVM";
import LayerSwitcherLayerMenu, { ContextMenuHandle } from "@damap/components/map/layer_switcher_mui/LayerSwitcherLayerMenu";
import { LayerMenuState } from "@damap/components/map/layer_switcher_mui/types";

interface LayerSwitcherPaperProps {
  mapVM: MapVM;
}

const LayerSwitcherPaper = ({ mapVM }: LayerSwitcherPaperProps) => {
  const [menuState, setMenuState] = useState<LayerMenuState | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  // const switcherRef = useRef<LayerSwitcher | null>(null); // 🌟 Prevents duplicate instantiation loops
  const switcherRef = useRef<any>(null);
  const mouseCoordinatesRef = useRef({ x: 0, y: 0 });
  const localMenuRef = useRef<ContextMenuHandle | null>(null); // 🌟 Use a secure local component ref

  const mouseMoveHandler = React.useCallback((event: MouseEvent) => {
    mouseCoordinatesRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  }, []);

  // Handle closing menu if clicking outside of it
  useEffect(() => {
    if (!menuState) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuState(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuState(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuState]);

  const addLayerSwitcher = React.useCallback(
      (target: HTMLElement) => {
        const mapInstance = mapVM.getMap();
        if (!mapInstance) return;

        // Clean up any existing stale control before creating a new one
        if (switcherRef.current) {
          mapInstance.removeControl(switcherRef.current);
        }

        const switcher = new LayerSwitcher({
          target,
          show_progress: true,
          extent: mapVM.mapExtent,
          trash: true,
          oninfo: function (l: any) {
            const x = mouseCoordinatesRef.current.x;
            const y = mouseCoordinatesRef.current.y;

            // 1. Safely call your local menu ref API
            localMenuRef.current?.openAt(l, { mouseX: x, mouseY: y });

            // 2. Drive the state positioning securely
            setMenuState({
              item: l,
              top: y,
              left: x
            });
          },
        });

        // @ts-ignore
        switcher.on("drawlist", function (e: any) {
          const layer = e.layer;

          if (
              layer &&
              !(layer instanceof Group) &&
              !layer.get("baseLayer") &&
              Object.prototype.hasOwnProperty.call(layer, "legend") &&
              layer?.legend?.graphic != null
          ) {
            const elem = document.getElementById("div-layer-switcher");
            const divElem = document.createElement("div");
            divElem.style.padding = "10px";

            divElem.addEventListener("click", (evt: any) => {
              const dialogRef = mapVM.getDialogBoxRef();
              dialogRef?.current?.openDialog({
                title: "Legend",
                content: (
                    <React.Fragment>
                      <Box sx={{ flexGrow: 1, p: 1 }}>
                        <img src={evt.target.src} alt="Legend" />
                      </Box>
                    </React.Fragment>
                ),
              });
            });

            let image: HTMLImageElement;

            switch (layer.legend["sType"]) {
              case "sld":
                layer.legend["graphic"].render(e.li);
                break;

              case "src":
                image = new Image();
                image.src = layer.legend["graphic"];
                if (layer.legend.width) image.style.width = layer.legend.width;
                if (layer.legend.height) image.style.height = layer.legend.height;
                divElem.appendChild(image);
                e?.li?.appendChild(divElem);
                break;

              case "canvas": {
                const graphic = layer.legend["graphic"];
                const desiredWidth = (elem?.clientWidth || 0) / 1.5;

                image = new Image();
                image.src = graphic.toDataURL();
                image.width =
                    graphic.width < desiredWidth ? graphic.width : desiredWidth;

                divElem.appendChild(image);
                e.li?.appendChild(divElem);
                break;
              }

              default:
                break;
            }
          }
        });

        mapInstance.addControl(switcher);
        switcherRef.current = switcher; // Store instance reference
      },
      [mapVM]
  );

  useEffect(() => {
    window.addEventListener("mousedown", mouseMoveHandler);

    const elem = document.getElementById("div-layer-switcher");
    if (elem && !switcherRef.current) {
      elem.innerHTML = "";
      addLayerSwitcher(elem);
    }

    return () => {
      window.removeEventListener("mousedown", mouseMoveHandler);
      // Clean up the OpenLayers control context when the component unmounts
      if (switcherRef.current && mapVM.getMap()) {
        mapVM.getMap().removeControl(switcherRef.current);
        switcherRef.current = null;
      }
    };
  }, [addLayerSwitcher, mouseMoveHandler, mapVM]);

  return (
      <>
        <Paper elevation={2} sx={{ height: "100%", width: "100%", m: 0, p: 0 }}>
          <div
              id="div-layer-switcher"
              style={{ width: "auto", height: "auto" }}
          />
        </Paper>

        <LayerSwitcherLayerMenu
            ref={localMenuRef} // 🌟 Connected to the secure local reference
            menuRef={menuRef}
            menuState={menuState}
            onCloseState={() => setMenuState(null)}
        />
      </>
  );
};

export default LayerSwitcherPaper;