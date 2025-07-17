import * as React from "react";
import { useState, useMemo } from "react";
import PivotTableUI from "react-pivottable/PivotTableUI";
import TableRenderers from "react-pivottable/TableRenderers";
// @ts-ignore
import Plotly from "plotly.js/dist/plotly-cartesian";
// @ts-ignore
import createPlotlyComponent from "react-plotlyjs";
import createPlotlyRenderers from "react-pivottable/PlotlyRenderers";

import { Column, Row } from "@/types/gridTypeDeclaration";
import 'react-pivottable/pivottable.css';

const Plot = createPlotlyComponent(Plotly);
const PlotlyRenderers = createPlotlyRenderers(Plot);

interface IProps {
    columns: Column[];
    data: Row[];
}

const PivotTable: React.FC<IProps> = ({ columns, data }) => {
    const [pivotState, setPivotState] = useState({});

    const pivotTableData = useMemo(() => {
        return data.map(row => {
            const cleaned: Record<string, any> = {};
            columns.forEach(col => {
                cleaned[col.label] = row[col.id];
            });
            return cleaned;
        });
    }, [columns, data]);

    return (
        <PivotTableUI
            data={pivotTableData}
            onChange={s => setPivotState(s)}
            renderers={Object.assign({}, TableRenderers, PlotlyRenderers)}
            {...pivotState}
        />
    );
};

export default PivotTable;
