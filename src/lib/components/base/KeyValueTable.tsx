import {  Table, TableBody, TableCell, TableContainer, TableRow,  Paper } from "@mui/material";

interface IKeyValueTableProps {
    data: Record<string, any>;
}

const KeyValueTable = ({ data }: IKeyValueTableProps) => {
    return (
        <TableContainer component={Paper} variant="outlined">
            <Table size="small">
                <TableBody>
                    {Object.entries(data).map(([key, value]) => (
                        <TableRow key={key}>
                            <TableCell sx={{ fontWeight: 'bold', width: '30%', color: "#5b0808", fontSize:'18px' }}>
                                <strong>{key}</strong>
                            </TableCell>
                            <TableCell>
                                {
                                    // Check if it's a plain object (not null, not an array, not a specialized object like an OL geometry)
                                    typeof value === 'object' && value !== null && !Array.isArray(value) && Object.prototype.toString.call(value) === '[object Object]' ? (
                                        // Recursively render another KeyValueTable for nested plain objects
                                        <KeyValueTable data={value} />
                                    ) : Array.isArray(value) ? (
                                        // Handle arrays: display count or list items if simple
                                        value.length > 0
                                            ? `[Array with ${value.length} items]` // Or map simple array elements if desired: value.map(item => String(item)).join(', ')
                                            : '[Empty Array]'
                                    ) : (
                                        // Check for specific OpenLayers-like object (using a heuristic based on your error)
                                        value && typeof value === 'object' && 'ol_uid' in value && 'flatCoordinates' in value
                                            ? `OpenLayers Object (UID: ${value.ol_uid || 'N/A'})` // Display a concise representation
                                            : value ?? "-" // Render primitive values or '-' for null/undefined
                                    )
                                }
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default KeyValueTable;
