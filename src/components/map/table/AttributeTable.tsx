import React, {useRef, useState} from "react";
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Toolbar,
    Typography,
    Checkbox,
    styled,
    tableCellClasses, useTheme
} from "@mui/material";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import TableChartIcon from '@mui/icons-material/TableChart';
import CloseIcon from '@mui/icons-material/Close';
import {WKT} from "ol/format";
import PivotTable from "react-pivottable/PivotTable";
import {DAFullScreenDialogHandle} from "@/components/base/DAFullScreenDialog.tsx";

interface Column {
    id: string;
    label: string;
    type: 'string' | 'number';
}

interface Row {
    [key: string]: any;
}

interface IDataGridProps {
    columns: Column[];
    data: Row[];
    tableHeight: number;
    pkCols: string[];
    mapVM: any;
    pivotTableSrc?: string;
    onCloseDrawer: () => void;
}

const StyledTableCell = styled(TableCell)(() => ({
    padding: '4px 8px', // Less padding for dense layout
    backgroundColor: '#fff',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    border: 'none', // No borders
    borderRadius: '4px',
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: '#e0e0e0',
        color: '#3e0505',
        fontWeight: 600,
        position: 'sticky',
        top: 0,
        zIndex: 1,
    },
}));



const StyledTableRow = styled(TableRow)(() => ({
    '&': {
        backgroundColor: 'transparent',
    },
    '&:hover': {
        backgroundColor: '#f9f9f9',
    },
}));


const AttributeTable: React.FC<IDataGridProps> = ({
                                                      columns,
                                                      data,
                                                      tableHeight,
                                                      pkCols,
                                                      mapVM,
                                                      pivotTableSrc,
                                                      onCloseDrawer,
                                                  }: IDataGridProps) => {
    // const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
    const [pivotTableData, setPivotTableData] = useState<Row[]>(pivotTableSrc ? [] : data);
    const dialogRef = useRef<DAFullScreenDialogHandle>(null);

    const isSelected = (index: number) => selectedRowIds.has(index);

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allSelected = new Set<number>(data.map((_, index) => index));
            setSelectedRowIds(allSelected);
        } else {
            setSelectedRowIds(new Set());
        }
    };

    const handleCheckboxClick = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        event.stopPropagation();
        const newSelected = new Set(selectedRowIds);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedRowIds(newSelected);
    };

    const handleRowClick = (row: Row, _: number) => {
        // setSelectedRowIndex(index);
        handleRowSelect(row);
    };

    const handleRowSelect = (row: Row) => {
        const uuid = mapVM.getLayerOfInterest();
        if (!row['geom'] && mapVM.isDALayerExists(uuid)) {
            const pkVal = getSelectedRowPKValue(row);
            mapVM.getApi().get('DCH_GET_FEATURE_GEOMETRY', {
                uuid,
                pk_values: pkVal,
            }).then((payload: any) => {
                mapVM.selectionLayer.addWKT2Selection(payload);
                row['geom'] = payload;
            });
        } else if (mapVM.isOverlayLayerExist(uuid)) {
            const wkt = new WKT().writeGeometry(row['geometry']);
            mapVM.selectionLayer.addWKT2Selection(wkt);
        } else {
            mapVM.selectionLayer.addWKT2Selection(row['geom']);
        }
    };

    const getSelectedRowPKValue = (row: Row) => pkCols.map(col => row[col]).join('');

    const handleZoom = () => mapVM.selectionLayer.zoomToSelection();

    const handleClear = () => {
        mapVM.selectionLayer.clearSelection();
        mapVM.zoomToFullExtent();
        setSelectedRowIds(new Set());
    };

    const handlePivot = async () => {
        dialogRef.current?.handleClickOpen();
        if (pivotTableData.length > 0) {
            dialogRef.current?.setContent('Pivot Table', <PivotTable data={pivotTableData} />);
        } else if (pivotTableSrc) {
            const payload = await mapVM.getApi().getFetch(pivotTableSrc);
            setPivotTableData(payload);
            dialogRef.current?.setContent('Pivot Table', <PivotTable data={payload} />);
        }
    };
    const theme = useTheme()
    return (
        <Box>
            <Toolbar
                sx={{
                    backgroundColor: theme.palette.secondary.light,
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    minHeight: '36px !important',
                    px: 1.5,
                    py: 0.5,
                    gap: 1,
                }}
            >
                <IconButton title="Zoom to Selection" onClick={handleZoom}>
                    <ZoomInIcon sx={{ color: theme.palette.secondary.contrastText }} />
                </IconButton>
                <IconButton title="Clear Selection" onClick={handleClear}>
                    <ClearAllIcon sx={{ color: theme.palette.secondary.contrastText }} />
                </IconButton>
                <IconButton title="Pivot Table" onClick={handlePivot}>
                    <TableChartIcon sx={{ color: theme.palette.secondary.contrastText }} />
                </IconButton>
                <IconButton title="Close Drawer" onClick={onCloseDrawer}>
                    <CloseIcon sx={{ color: theme.palette.secondary.contrastText }} />
                </IconButton>
                <Typography variant="subtitle2" sx={{ ml: 2, color: theme.palette.secondary.contrastText }}>
                    Rows: {data.length}
                </Typography>
            </Toolbar>



            <TableContainer
                component={Paper}
                sx={{
                    maxHeight: tableHeight,
                    overflowY: 'auto',
                }}
            >
                <Table
                    size="small"
                    stickyHeader
                    sx={{
                        borderCollapse: 'separate',
                        borderSpacing: '0 6px', // vertical spacing between rows
                        padding: 0,
                    }}
                >

                <TableHead>
                        <StyledTableRow>
                            <StyledTableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={selectedRowIds.size > 0 && selectedRowIds.size < data.length}
                                    checked={data.length > 0 && selectedRowIds.size === data.length}
                                    onChange={handleSelectAllClick}
                                />
                            </StyledTableCell>
                            <StyledTableCell>Sr. No.</StyledTableCell>
                            {columns.map((col) => (
                                <StyledTableCell key={col.id}>{col.label}</StyledTableCell>
                            ))}
                        </StyledTableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row, index) => (
                            <StyledTableRow
                                key={index}
                                onClick={() => handleRowClick(row, index)}
                                hover
                                selected={isSelected(index)}
                                sx={{ cursor: "pointer" }}
                            >
                                <StyledTableCell padding="checkbox">
                                    <Checkbox
                                        checked={isSelected(index)}
                                        onChange={(e) => handleCheckboxClick(e, index)}
                                    />
                                </StyledTableCell>
                                <StyledTableCell>{index + 1}</StyledTableCell>
                                {columns.map((col) => (
                                    <StyledTableCell key={col.id}>
                                        {row[col.id]}
                                    </StyledTableCell>
                                ))}
                            </StyledTableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AttributeTable;
