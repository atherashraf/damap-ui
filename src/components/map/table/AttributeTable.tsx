import React, {useRef, useState, useMemo, useEffect} from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
    Toolbar, Typography,  TextField, Tooltip, alpha
} from "@mui/material";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import TableChartIcon from '@mui/icons-material/TableChart';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { WKT } from "ol/format";
import DAFullScreenDialog, { DAFullScreenDialogHandle } from "@/components/base/DAFullScreenDialog";
import { MapAPIs } from "@/api/MapApi";
import PivotTable from "@/components/map/table/PivotTable";
import {Column, Row} from "@/types/gridTypeDeclaration";
import {getMapVM} from "@/hooks/MapVMContext";




interface IDataGridProps {
    columns: Column[];
    data: Row[];
    tableHeight: number;
    pkCols: string[];
    pivotTableSrc?: string;
}



const AttributeTable: React.FC<IDataGridProps> = ({
                                                      columns, data, tableHeight, pkCols,
                                                  }: IDataGridProps) => {


    const mapVM =getMapVM();
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedRowKey, scrollTop } = mapVM.getAttributeTableState();
    const selectedRowKeyRef = useRef<string | null>(selectedRowKey);
    const [, forceUpdate] = useState(0); // dummy state to trigger re-render
    const [searchText, setSearchText] = useState('');
    const dialogRef = useRef<DAFullScreenDialogHandle>(null);
    // const [isZoomEnabled, setIsZoomEnabled] = useState(false);

    const theme = mapVM.getTheme()


    const getSelectedRowPKValue = (row: Row) =>
        pkCols.map(col => row[col]).join('__');

    const isSelected = (row: Row) =>
        selectedRowKeyRef.current === getSelectedRowPKValue(row);


    const handleRowClick = (row: Row) => {
        const key = getSelectedRowPKValue(row);
        selectedRowKeyRef.current = key;
        mapVM.setAttributeTableState({ selectedRowKey: key });
        handleRowSelect(row);
        forceUpdate(n => n + 1);
    };

    // For scroll tracking
    useEffect(() => {
        const node = containerRef.current;
        if (node) {
            node.scrollTop = scrollTop || 0;
            const onScroll = () => mapVM.setAttributeTableState({ scrollTop: node.scrollTop });
            node.addEventListener('scroll', onScroll);
            return () => node.removeEventListener('scroll', onScroll);
        }
        return () => {};
    }, []);

    const handleRowDoubleClick = (row: Row) => {
        const bottomDrawer = mapVM.getBottomDrawerRef();
        bottomDrawer.current?.handleHide();
        handleRowSelect(row);
        mapVM.getSelectionLayer()?.zoomToSelection();
    };

    const handleRowSelect = (row: Row) => {
        const uuid = mapVM.getLayerOfInterest();

        if (!row['geom'] && mapVM.isDALayerExists(uuid)) {
            const pkVal = getSelectedRowPKValue(row);
            mapVM.getMapLoadingRef().current?.openIsLoading()
            mapVM.getApi().get(MapAPIs.DCH_GET_FEATURE_GEOMETRY, { uuid, pk_values: pkVal }).then((payload: any) => {
                mapVM.getSelectionLayer()?.addWKT2Selection(payload);
                row['geom'] = payload;

            }).finally(()=>{
                mapVM.getMapLoadingRef().current?.closeIsLoading()
            })
        } else if (mapVM.isOverlayLayerExist(uuid)) {
            const wkt = new WKT().writeGeometry(row['geometry']);
            mapVM.getSelectionLayer()?.addWKT2Selection(wkt,true);
        } else {
            mapVM.getSelectionLayer()?.addWKT2Selection(row['geom']);
            // mapVM.getSnackbarRef().current?.show("Geometry not available for this layer. Please select a different layer.", "error")
        }
    };

    const handleZoom = () => {
        const bottomDrawer = mapVM.getBottomDrawerRef();
        bottomDrawer.current?.handleHide?.();
        mapVM.getSelectionLayer()?.zoomToSelection();
    };

    const handleClear = () => {
        mapVM.getSelectionLayer()?.clearSelection();
        mapVM.zoomToFullExtent();
        selectedRowKeyRef.current = null;
        forceUpdate(n => n + 1); // clear highlight
    };

    const handlePivot = async () => {
        dialogRef.current?.handleClickOpen();
        // dialogRef.current?.setContent('Pivot Table',
        //     <PivotTable columns={columns} data={data} />);
        dialogRef.current?.setContent('Pivot Table',
            <div style={{ height: '100%', overflow: 'auto' }}>
                <PivotTable columns={columns} data={data} />
            </div>
        );
        // if (pivotTableData.length > 0) {
        //     dialogRef.current?.setContent('Pivot Table', <PivotTable data={pivotTableData} />);
        // } else if (pivotTableSrc) {
        //     const payload = await mapVM.getApi().get(pivotTableSrc);
        //     setPivotTableData(payload);
        //     dialogRef.current?.setContent('Pivot Table', <PivotTable data={payload} />);
        // }
    };

    const handleExport = () => {
        // Prepare CSV header
        const header = columns.map(col => `"${col.label}"`).join(",") + "\n";

        // Prepare CSV rows
        const rows = filteredData.map(row =>
            columns.map(col => {
                const cell = row[col.id];
                // Escape quotes in cell values
                const escaped = typeof cell === "string" ? cell.replace(/"/g, '""') : cell;
                return `"${escaped}"`;
            }).join(",")
        ).join("\n");

        // Combine header and rows
        const csvContent = header + rows;

        // Create blob and trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href =  URL.createObjectURL(blob);
        link.setAttribute("download", "attribute_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const filteredData = useMemo(() => {
        if (!searchText) return data;
        const lowerSearch = searchText.toLowerCase();
        return data.filter(row =>
            columns.some(col => {
                const val = row[col.id];
                return val !== undefined && val !== null && val.toString().toLowerCase().includes(lowerSearch);
            })
        );
    }, [data, columns, searchText]);

    const headCellStyle = {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
        color: '#333',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        border: 'none',
    };
    const rowCellStyle = {
        padding: '6px 12px',
        border: 'none',
    };
    const rowStyle = {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        borderRadius: 6,
        backgroundColor: '#fff',
    };
    return (
        <>
            <Toolbar sx={{
                backgroundColor: theme?.palette.secondary.main,
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                borderRadius: '6px',
                minHeight: '36px !important',
                px: 1.5,
                py: 0.5,
                gap: 1,
                flexWrap: 'wrap'
            }} >
                <IconButton key="zoom-btn" title="Zoom to Selection" onClick={handleZoom}>
                    <ZoomInIcon sx={{ color: theme?.palette.secondary.contrastText }} />
                </IconButton>
                <IconButton key="clear-btn" title="Clear Selection" onClick={handleClear}>
                    <CloseIcon sx={{ color: theme?.palette.secondary.contrastText }} />
                </IconButton>
                <IconButton key="pivot-btn" title="Pivot Table" onClick={handlePivot}>
                    <TableChartIcon sx={{ color: theme?.palette.secondary.contrastText }} />
                </IconButton>
                <Tooltip title="Export to CSV" key="export-btn">
                    <IconButton onClick={handleExport}>
                        <FileDownloadIcon sx={{ color: theme?.palette.secondary.contrastText }} />
                    </IconButton>
                </Tooltip>

                <TextField
                    key="search-input"
                    size="small"
                    placeholder="Search..."
                    variant="outlined"
                    sx={{
                        ml: 2,
                        width: 220,
                        backgroundColor: '#fff',
                        borderRadius: 1,
                        '& input': { color: theme?.palette.secondary.main },
                    }}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />

                <Typography
                    key="row-count"
                    variant="subtitle2"
                    sx={{ ml: 2, color: theme?.palette.secondary.contrastText }}
                >
                    Rows: {filteredData.length}
                </Typography>
            </Toolbar>

            <TableContainer
                ref={containerRef}
                component={Paper}
                elevation={0}
                sx={{
                    maxHeight: tableHeight,
                    overflowY: 'auto',
                    borderRadius: 0,
                    boxShadow: 'none',
                    border: 'none',
                }}
            >
                <Table
                    size="small"
                    stickyHeader
                    sx={{
                        borderCollapse: 'separate',
                        borderSpacing: '0 8px',
                        border: 'none',
                    }}
                >
                    <TableHead>
                        <TableRow sx={rowStyle} key="head-row">
                            <TableCell sx={headCellStyle} key="head-srno">Sr. No.</TableCell>
                            {columns.map((col) => (
                                <TableCell sx={headCellStyle} key={`head-${col.id}`}>{col.label}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.map((row, index) => (
                            <TableRow
                                key={`row-${index}`}
                                hover
                                selected={isSelected(row)}
                                onClick={() => handleRowClick(row)}
                                onDoubleClick={() => handleRowDoubleClick(row)}
                                sx={{
                                    ...rowStyle,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                    },
                                    ...(isSelected(row) && {
                                        bgcolor: `${theme && alpha(theme?.palette?.secondary.light, 0.9)} !important`,
                                        boxShadow: `0 3px 10px ${theme && alpha(theme?.palette.secondary.main, 0.6)}`,
                                        color: theme?.palette.secondary.contrastText,
                                        '& td': {
                                            color: theme?.palette.secondary.contrastText,
                                            fontWeight: 500,
                                        },
                                    }),
                                }}
                            >
                                <TableCell sx={rowCellStyle} key={`cell-index-${index}`}>{index + 1}</TableCell>
                                {columns.map((col) => {
                                    const value = row[col.id];
                                    let displayValue = '';

                                    if (value !== undefined && value !== null) {
                                        if (typeof value === 'object') {
                                            // Optional: further check for OpenLayers geometry
                                            if (typeof value.getCoordinates === 'function') {
                                                displayValue = '[geometry]';
                                            } else {
                                                displayValue = JSON.stringify(value);
                                            }
                                        } else {
                                            displayValue = value.toString();
                                        }
                                    }

                                    return (
                                        <TableCell key={`cell-${index}-${col.id}`} sx={rowCellStyle}>
                                            {displayValue}
                                        </TableCell>
                                    );
                                })}

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <DAFullScreenDialog ref={dialogRef} />
        </>
    );

};

export default AttributeTable;
