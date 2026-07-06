export interface Column {
    disablePadding: boolean;
    id: string;
    label: string;
    // isNumeric: boolean;
    type: "string" | "number" | "date";
}
export interface Filter {
    key: string;
    value: string | number[] | Date[];
}

export interface Row {
    rowId: number;
    [key: string]: any;
}

export interface AttributeTableData {
    columns: Column[];
    rows: Row[];
    pkCols: string[];
    tableHeight?: number;
    isEditable?: boolean;
}