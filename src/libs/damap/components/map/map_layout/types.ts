export type Orientation = "portrait" | "landscape";
export type PageSize = "A4" | "A3" | "A2" | "Letter";
export type MarginOption = "none" | "small" | "medium" | "large";
export type ScaleOption = "" | "500" | "1000" | "2500" | "5000" | "10000" | "25000" | "50000";

export type LegendPosition = "inside-map" | "right-side" | "none";

export interface PrintLayoutSettings {
    orientation: Orientation;
    pageSize: PageSize;
    margin: MarginOption;
    scale: ScaleOption;
    northArrow: boolean;
    graticule: boolean;
    showTitle: boolean;
    title: string;
    legendPosition: LegendPosition;
}