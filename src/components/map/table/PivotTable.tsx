import * as React from "react";
import {useState, useMemo, useEffect} from "react";
import PivotTableUI from "react-pivottable/PivotTableUI";
import TableRenderers from "react-pivottable/TableRenderers";
// @ts-ignore
import Plotly from "plotly.js/dist/plotly-cartesian";
// @ts-ignore
import createPlotlyComponent from "react-plotlyjs";
import createPlotlyRenderers from "react-pivottable/PlotlyRenderers";

import {Column, Row} from "@/types/gridTypeDeclaration";
import 'react-pivottable/pivottable.css';
import {Box} from "@mui/material";

const Plot = createPlotlyComponent(Plotly);
const PlotlyRenderers = createPlotlyRenderers(Plot);

interface IProps {
    columns: Column[];
    data: Row[];
}
type PivotState = Partial<{
    rows: string[];
    cols: string[];
    aggregatorName: string;
    rendererName: string;
    vals: string[];
    valueFilter: Record<string, Record<string, boolean>>;
    hiddenFromDragDrop: string[];
}>;

const PivotTable: React.FC<IProps> = ({ columns, data }) => {
    const [pivotState, setPivotState] = useState<PivotState>({});
    const renderers = useMemo(
        () => Object.assign({}, TableRenderers, PlotlyRenderers),
        []
    );

    // 1) Identify numeric fields and first numeric label
    const numericLabels = useMemo(
        () => columns.filter(c => c.type === "number").map(c => c.label),
        [columns]
    );
    const firstNumeric = numericLabels[0];

    // 2) Build pivot data
    const pivotTableData = useMemo(() => {
        const labels = columns.map((c, i) => c?.label ?? c?.id ?? `col_${i}`);
        return data.map(row => {
            const cleaned: Record<string, any> = {};
            columns.forEach((col, idx) => {
                let val = (row as any)[col.id];
                if (val instanceof Date) val = val.toISOString();
                else if (typeof val === "object" && val !== null) val = JSON.stringify(val);
                cleaned[labels[idx]] = val;
            });
            return cleaned;
        });
    }, [columns, data]);

    // 3) Set defaults ONCE (or when there was no value yet) to Sum + first numeric
    useEffect(() => {
        if (firstNumeric && (!pivotState.vals || pivotState.vals.length === 0)) {
            setPivotState(prev => ({
                rendererName: prev.rendererName ?? "Table",
                aggregatorName: "Sum",
                vals: [firstNumeric],
                // keep any existing state
                ...prev
            }));
        }
    }, [firstNumeric]); // don’t include pivotState here, we only want to set when firstNumeric becomes available

    const handleChange = (s: PivotState) => setPivotState(s);

    return (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
            <PivotTableUI
                data={pivotTableData}
                onChange={handleChange}
                renderers={renderers}
                // 4) Hide numeric fields from Rows/Columns drag lists, but keep them in Filters
                hiddenFromDragDrop={numericLabels}
                {...pivotState}
            />
        </Box>
    );
};

export default PivotTable;