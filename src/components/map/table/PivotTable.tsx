import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import PivotTableUI from "react-pivottable/PivotTableUI";
import TableRenderers from "react-pivottable/TableRenderers";
// @ts-ignore
import Plotly from "plotly.js/dist/plotly-cartesian";
// @ts-ignore
import createPlotlyComponent from "react-plotlyjs";
import createPlotlyRenderers from "react-pivottable/PlotlyRenderers";

import { Column, Row } from "@/types/gridTypeDeclaration";
import "react-pivottable/pivottable.css";
import { Box } from "@mui/material";

const Plot = createPlotlyComponent(Plotly);
const PlotlyRenderers = createPlotlyRenderers(Plot);

interface IProps {
    columns: Column[];
    data: Row[];

    /** Preferred: pass defaults by LABEL */
    defaultRowLabels?: string[];       // e.g., ["Province", "City"]
    defaultColLabels?: string[];       // e.g., ["Year"]
    defaultValLabel?: string;          // e.g., "Population"
    defaultAggregatorName?: string;    // e.g., "Sum" | "Average" | "Count" ...

    /** Legacy (optional): still works if you only have IDs */
    defaultRowIds?: string[];
    defaultColIds?: string[];
    defaultValId?: string;
}

type PivotState = Partial<{
    rows: string[];
    cols: string[];
    aggregatorName: string;
    rendererName: string;
    vals: string[];
    valueFilter: Record<string, Record<string, boolean>>;
    hiddenFromDragDrop: string[];
    hiddenFromAggregators: string[];
}>;

const PivotTable: React.FC<IProps> = ({
                                          columns,
                                          data,
                                          defaultRowLabels,
                                          defaultColLabels,
                                          defaultValLabel,
                                          defaultAggregatorName,
                                          defaultRowIds,
                                          defaultColIds,
                                          defaultValId,
                                      }) => {
    const [pivotState, setPivotState] = useState<PivotState>({});

    const renderers = useMemo(
        () => Object.assign({}, TableRenderers, PlotlyRenderers),
        []
    );

    // Build label list and id->label map (PivotTableUI works with labels)
    const labels = useMemo(
        () => columns.map((c, i) => c?.label ?? c?.id ?? `col_${i}`),
        [columns]
    );

    const idToLabel = useMemo(() => {
        const map = new Map<string, string>();
        columns.forEach((c, i) => {
            const label = c?.label ?? c?.id ?? `col_${i}`;
            map.set(c.id, label);
        });
        return map;
    }, [columns]);

    // Numeric labels for hiding from drag-drop (so users don’t put measures as dimensions)
    const numericLabels = useMemo(
        () => columns.filter(c => c.type === "number").map(c => c.label ?? c.id),
        [columns]
    );

    // Non-numeric OR label/id contains "id" (case-insensitive): useful for dimensions & hiddenFromAggregators
    const nonNumericOrIdLikeLabels = useMemo(() => {
        return columns
            .filter(c => {
                const labelLower = (c.label ?? "").toLowerCase();
                const idLower = (c.id ?? "").toLowerCase();
                return c.type !== "number" || labelLower.includes("id") || idLower.includes("id");
            })
            .map(c => c.label ?? c.id);
    }, [columns]);

    // Pivot-friendly data rows: keys must be labels
    const pivotTableData = useMemo(() => {
        return data.map(row => {
            const cleaned: Record<string, any> = {};
            columns.forEach((col, idx) => {
                const key = labels[idx]; // label key
                let val = (row as any)[col.id];
                if (val instanceof Date) val = val.toISOString();
                else if (typeof val === "object" && val !== null) val = JSON.stringify(val);
                cleaned[key] = val;
            });
            return cleaned;
        });
    }, [columns, data, labels]);

    // Helpers to choose defaults (labels first, fall back to ids -> labels, then sensible fallback)
    const pickRows = (): string[] => {
        if (defaultRowLabels?.length) return defaultRowLabels;
        if (defaultRowIds?.length) {
            return defaultRowIds.map(id => idToLabel.get(id)).filter(Boolean) as string[];
        }
        return [];
    };

    const pickCols = (): string[] => {
        if (defaultColLabels?.length) return defaultColLabels;
        if (defaultColIds?.length) {
            return defaultColIds.map(id => idToLabel.get(id)).filter(Boolean) as string[];
        }
        return [];
    };

    const pickVal = (): string | undefined => {
        if (defaultValLabel) return defaultValLabel;
        if (defaultValId) return idToLabel.get(defaultValId);
        return columns.find(c => c.type === "number")?.label ?? labels[0];
    };

    // Apply initial defaults once (don’t override user changes later)
    useEffect(() => {
        setPivotState(prev => {
            const alreadySet = !!(prev.rows || prev.cols || prev.vals || prev.aggregatorName);
            if (alreadySet) return prev;

            const rows = pickRows();
            const cols = pickCols();
            const valLabel = pickVal();

            return {
                rendererName: prev.rendererName ?? "Table",
                aggregatorName: defaultAggregatorName ?? "Sum",
                rows,
                cols,
                vals: valLabel ? [valLabel] : [],
                ...prev,
            };
        });
        // We only want to initialize once per inputs set
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        columns,
        labels,
        idToLabel,
        defaultRowLabels,
        defaultColLabels,
        defaultValLabel,
        defaultRowIds,
        defaultColIds,
        defaultValId,
        defaultAggregatorName,
    ]);

    const handleChange = (s: PivotState) => setPivotState(s);

    return (
        <Box sx={{ width: "100%", overflowX: "auto", minHeight: "400px" }}>
            <PivotTableUI
                data={pivotTableData}
                onChange={handleChange}
                renderers={renderers}
                // Hide non-dimensions from rows/cols, and hide non-numeric/id-like from aggregators
                hiddenFromDragDrop={numericLabels}
                hiddenFromAggregators={nonNumericOrIdLikeLabels}
                {...pivotState}
            />
        </Box>
    );
};

export default PivotTable;
