import React from "react";
import {
    MapMessageAction,
    mapMessageChipRef,
    type SeverityType,
} from "@/components/map/widgets/MapMessageChip";

export default class MapMessageChipManager {
    static show(
        text: string | React.ReactNode,
        severity: SeverityType = "info",
        actions?: MapMessageAction[]
    ) {
        mapMessageChipRef.current?.show({ text, severity, actions });
    }

    static text(text: string | React.ReactNode) {
        mapMessageChipRef.current?.setText(text);
    }

    static severity(s: SeverityType) {
        mapMessageChipRef.current?.setSeverity(s);
    }

    static actions(actions: MapMessageAction[]) {
        mapMessageChipRef.current?.setActions(actions);
    }

    static clearActions() {
        mapMessageChipRef.current?.clearActions();
    }

    static setVisibility(visible: boolean) {
        mapMessageChipRef.current?.setVisibility(visible);
    }

    static hide() {
        mapMessageChipRef.current?.hide();
    }

    static isVisible() {
        return !!mapMessageChipRef.current?.isVisible?.();
    }

    static toggle(force?: boolean) {
        const next =
            typeof force === "boolean" ? force : !MapMessageChipManager.isVisible();
        mapMessageChipRef.current?.setVisibility(next);
    }
}
