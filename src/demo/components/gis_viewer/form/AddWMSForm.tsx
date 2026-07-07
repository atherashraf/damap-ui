import { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import {
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    CircularProgress,
    Box,
    ListItemButton,
    InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { getMapVM, MapVM } from "@damap/damap";

// Types
interface WMSLayer {
    name: string;
    title: string;
    abstract?: string;
}

export interface AddWMSFormHandle {
    addSelectedLayers: () => void;
}

const AddWMSForm = forwardRef<AddWMSFormHandle, any>((_, ref) => {
    const mapVM = getMapVM();

    const [url, setUrl] = useState("https://gis.wasalhr.pk:82/geoserver/cite/wms");
    const [layers, setLayers] = useState<WMSLayer[]>([]);
    const [selectedLayerNames, setSelectedLayerNames] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Filter logic for search
    const filteredLayers = useMemo(() => {
        return layers.filter((layer) =>
            layer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            layer.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [layers, searchQuery]);

    // Expose the internal method to the Parent via Ref
    useImperativeHandle(ref, () => ({
        addSelectedLayers: () => {
            if (selectedLayerNames.length === 0) {
                mapVM.showSnackbar("No layers selected", "warning");
                return;
            }

            selectedLayerNames.forEach(layerName => {
                const layerObj = layers.find(l => l.name === layerName);
                const title = layerObj?.title ?? layerName;
                const uuid = MapVM.generateUUID();
                mapVM.createWMSLayer({
                    uuid: uuid,
                    name: uuid,
                    title,
                    url,
                    layers: layerName,
                    tiled: true,
                    format: "image/png",
                    transparent: true,
                    version: "1.1.1",
                    zIndex: 600,
                    visible: true,
                    opacity: 1,
                });
            });

            mapVM.showSnackbar(`${selectedLayerNames.length} layer(s) added successfully`, "success");
        }
    }));

    const fetchCapabilities = async () => {
        setLoading(true);
        setError("");
        setSearchQuery("");
        try {
            const u = new URL(url);
            u.searchParams.set("service", "WMS");
            u.searchParams.set("request", "GetCapabilities");

            const response = await fetch(u.toString());
            const xmlText = await response.text();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");

            const layerNodes = Array.from(xmlDoc.getElementsByTagName("Layer")).filter(
                node => node.getElementsByTagName("Name")[0]
            );

            const parsedLayers: WMSLayer[] = layerNodes.map(node => ({
                name: node.getElementsByTagName("Name")[0]?.textContent ?? "",
                title: node.getElementsByTagName("Title")[0]?.textContent ??
                    node.getElementsByTagName("Name")[0]?.textContent ?? "Untitled",
                abstract: node.getElementsByTagName("Abstract")[0]?.textContent ?? "",
            }));

            setLayers(parsedLayers);
        } catch (err) {
            setError("Failed to fetch capabilities. Check URL or CORS settings.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleLayer = (name: string) => {
        setSelectedLayerNames(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    return (
        <Box sx={{ p: 1 }}>
            {/* Connection Bar */}
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                    fullWidth
                    label="WMS Server URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    error={Boolean(error)}
                    helperText={error || "Enter GeoServer WMS endpoint"}
                    size="small"
                />
                <Button variant="contained" onClick={fetchCapabilities} disabled={loading} sx={{ height: 40 }}>
                    Connect
                </Button>
            </Box>

            {loading && <CircularProgress size={24} sx={{ display: "block", m: "10px auto" }} />}

            {/* Search Input */}
            {layers.length > 0 && (
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search layers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ mb: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            )}

            {/* Layer List */}
            {layers.length > 0 && (
                <List sx={{ maxHeight: 250, overflow: "auto", border: '1px solid #ddd', borderRadius: 1 }}>
                    {filteredLayers.map(layer => (
                        <ListItem
                            key={layer.name}
                            disablePadding
                            secondaryAction={
                                <Checkbox
                                    edge="end"
                                    checked={selectedLayerNames.includes(layer.name)}
                                    onChange={() => toggleLayer(layer.name)}
                                />
                            }
                        >
                            <ListItemButton onClick={() => toggleLayer(layer.name)}>
                                <ListItemText primary={layer.title} secondary={layer.name} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
});

AddWMSForm.displayName = "AddWMSForm"; // Good practice for forwardRef
export default AddWMSForm;