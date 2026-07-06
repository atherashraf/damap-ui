import * as React from "react";
import { Box } from "@mui/material";
import OLMap from "ol/Map";
import OLView from "ol/View";
import { defaults as defaultControls } from "ol/control";
import LayerGroup from "ol/layer/Group";
import Graticule from "ol/layer/Graticule";
import { Fill, Stroke, Text } from "ol/style";
import type { PrintLayoutSettings } from "@damap/components/map/map_layout/types";
import { useMapVM } from "@damap/hooks/MapVMContext";

interface PrintMapPreviewProps {
    settings: PrintLayoutSettings;
}

function cloneLayerTree(layer: any): any {
    if (layer instanceof LayerGroup) {
        const children = layer
            .getLayers()
            .getArray()
            .filter((child: any) => child.getVisible?.())
            .map((child: any) => cloneLayerTree(child));

        const clonedGroup = new LayerGroup({
            layers: children,
            visible: layer.getVisible(),
            opacity: layer.getOpacity(),
        });

        const props = layer.getProperties();
        Object.keys(props).forEach((key) => {
            if (key !== "layers") clonedGroup.set(key, props[key]);
        });

        return clonedGroup;
    }

    const Ctor = layer.constructor as any;
    const source = layer.getSource?.();

    const cloned = new Ctor({
        source,
        visible: layer.getVisible(),
        opacity: layer.getOpacity(),
        zIndex: layer.getZIndex(),
    });

    const props = layer.getProperties();
    Object.keys(props).forEach((key) => {
        if (key !== "source") cloned.set(key, props[key]);
    });

    if (layer.getStyle && cloned.setStyle) {
        cloned.setStyle(layer.getStyle());
    }

    if (layer.getExtent && cloned.setExtent) {
        cloned.setExtent(layer.getExtent());
    }

    return cloned;
}

const PrintMapPreview = ({ settings }: PrintMapPreviewProps): React.ReactElement => {
    const mapVM = useMapVM();
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const previewMapRef = React.useRef<OLMap | null>(null);
    const graticuleRef = React.useRef<Graticule | null>(null);
    const [mapReady, setMapReady] = React.useState(false);

    React.useEffect(() => {
        const mainMap = mapVM.getMap();
        const target = containerRef.current;

        if (!mainMap || !target) return;

        const mainView = mainMap.getView();

        const clonedLayers = mainMap
            .getLayers()
            .getArray()
            .filter((layer: any) => layer.getVisible?.())
            .map((layer: any) => cloneLayerTree(layer));

        const previewMap = new OLMap({
            target,
            controls: defaultControls({
                zoom: false,
                rotate: false,
                attribution: false,
            }),
            interactions: [],
            layers: clonedLayers,
            view: new OLView({
                center: mainView.getCenter() ?? [0, 0],
                zoom: mainView.getZoom() ?? 5,
                rotation: mainView.getRotation() ?? 0,
                projection: mainView.getProjection(),
                resolution: mainView.getResolution() ?? undefined,
            }),
        });

        previewMapRef.current = previewMap;
        setMapReady(true);

        const syncFromMain = () => {
            const pv = previewMap.getView();
            const mv = mainMap.getView();

            const center = mv.getCenter();
            if (center) pv.setCenter(center);

            const resolution = mv.getResolution();
            if (typeof resolution === "number") pv.setResolution(resolution);

            const rotation = mv.getRotation();
            if (typeof rotation === "number") pv.setRotation(rotation);

            previewMap.updateSize();
            previewMap.renderSync();
        };

        mainView.on("change:center", syncFromMain);
        mainView.on("change:resolution", syncFromMain);
        mainView.on("change:rotation", syncFromMain);

        const resizeObserver = new ResizeObserver(() => {
            previewMap.updateSize();
            previewMap.renderSync();
        });

        resizeObserver.observe(target);

        setTimeout(() => {
            previewMap.updateSize();
            previewMap.renderSync();
        }, 200);

        return () => {
            resizeObserver.disconnect();

            mainView.un("change:center", syncFromMain);
            mainView.un("change:resolution", syncFromMain);
            mainView.un("change:rotation", syncFromMain);

            if (graticuleRef.current) {
                previewMap.removeLayer(graticuleRef.current);
                graticuleRef.current = null;
            }

            previewMap.setTarget(undefined);
            previewMapRef.current = null;
            setMapReady(false);
        };
    }, [mapVM]);

    React.useEffect(() => {
        const previewMap = previewMapRef.current;
        if (!previewMap || !mapReady) return;

        if (graticuleRef.current) {
            previewMap.removeLayer(graticuleRef.current);
            graticuleRef.current = null;
        }

        if (!settings.graticule) {
            previewMap.renderSync();
            return;
        }

        const labelStyle = new Text({
            font: "12px Arial, sans-serif",
            fill: new Fill({
                color: "rgba(0,0,0,0.9)",
            }),
            stroke: new Stroke({
                color: "rgba(255,255,255,0.95)",
                width: 3,
            }),
        });

        const graticule = new Graticule({
            showLabels: true,
            wrapX: false,
            targetSize: 120,
            strokeStyle: new Stroke({
                color: "rgba(0,0,0,0.75)",
                width: 1.5,
                lineDash: [6, 4],
            }),
            lonLabelStyle: labelStyle,
            latLabelStyle: labelStyle,
            lonLabelPosition: 0.02,
            latLabelPosition: 0.98,
        });

        graticule.setZIndex(999999);
        previewMap.addLayer(graticule);
        graticuleRef.current = graticule;

        setTimeout(() => {
            previewMap.updateSize();
            previewMap.renderSync();
        }, 100);
    }, [settings.graticule, mapReady]);

    return (
        <Box
            ref={containerRef}
            sx={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                zIndex: 1,
                "& .ol-control": {
                    display: "none",
                },
                "& .ol-viewport": {
                    width: "100% !important",
                    height: "100% !important",
                },
            }}
        />
    );
};

export default PrintMapPreview;