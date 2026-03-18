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
import { getMapVM, MapVM } from "@/damap";

interface WFSFeatureType {
    name: string; // The typeName (e.g., workspace:layer)
    title: string;
    abstract?: string;
    defaultSRS?: string;
}

export interface AddWFSFormHandle {
    addSelectedLayers: () => void;
}

const AddWFSForm = forwardRef<AddWFSFormHandle, any>((_, ref) => {
    const mapVM = getMapVM();

    const [processing, setProcessing] = useState(false);
    const [url, setUrl] = useState("https://gis.wasalhr.pk:82/geoserver/cite/ows");
    const [featureTypes, setFeatureTypes] = useState<WFSFeatureType[]>([]);
    const [selectedTypeNames, setSelectedTypeNames] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const filteredFeatures = useMemo(() => {
        return featureTypes.filter((ft) =>
            ft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ft.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [featureTypes, searchQuery]);

    useImperativeHandle(ref, () => ({
        addSelectedLayers: async () => {
            if (selectedTypeNames.length === 0) {
                mapVM.showSnackbar("No WFS layers selected", "warning");
                return;
            }

            setProcessing(true); // Start loading
            try {
                for (const typeName of selectedTypeNames) {
                    const ft = featureTypes.find(f => f.name === typeName);
                    const title = ft?.title ?? typeName;

                    const wfsLayer = mapVM.createWFSLayer({
                        uuid: MapVM.generateUUID(),
                        title: `${title} (WFS)`,
                        url: url,
                        typeName: typeName,
                        outputFormat: "application/json",
                        srsName: mapVM.getViewProjectionCode(),
                        maxFeatures: 5000,
                    });

                    if (wfsLayer) {
                        // This 'await' is crucial. It waits for the network
                        // request to finish before the loop continues.
                        await wfsLayer.reload(true);
                    }
                }
                mapVM.showSnackbar(`${selectedTypeNames.length} WFS layer(s) loaded`, "success");
            } catch (err) {
                mapVM.showSnackbar("Error loading one or more layers", "error");
            } finally {
                setProcessing(false); // Stop loading
            }
        }
    }));

    const fetchCapabilities = async () => {
        setLoading(true);
        setError("");
        try {
            const u = new URL(url);
            u.searchParams.set("service", "WFS");
            u.searchParams.set("version", "1.1.0");
            u.searchParams.set("request", "GetCapabilities");

            const response = await fetch(u.toString());
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");

            // WFS uses <FeatureType> instead of <Layer>
            const ftNodes = Array.from(xmlDoc.getElementsByTagName("FeatureType"));

            const parsedFeatures: WFSFeatureType[] = ftNodes.map(node => ({
                name: node.getElementsByTagName("Name")[0]?.textContent ?? "",
                title: node.getElementsByTagName("Title")[0]?.textContent ??
                    node.getElementsByTagName("Name")[0]?.textContent ?? "Untitled",
                abstract: node.getElementsByTagName("Abstract")[0]?.textContent ?? "",
                defaultSRS: node.getElementsByTagName("DefaultSRS")[0]?.textContent ??
                    node.getElementsByTagName("SRS")[0]?.textContent ?? "EPSG:4326"
            })).filter(ft => ft.name !== "");

            setFeatureTypes(parsedFeatures);
        } catch (err) {
            setError("Failed to fetch WFS capabilities.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleLayer = (name: string) => {
        setSelectedTypeNames(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                    fullWidth
                    label="WFS Server URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    error={Boolean(error)}
                    helperText={error || "GeoServer OWS/WFS endpoint"}
                    size="small"
                />
                <Button variant="contained" onClick={fetchCapabilities} disabled={loading}>
                    Connect
                </Button>
            </Box>

            {loading && <CircularProgress size={24} sx={{ display: "block", m: "10px auto" }} />}

            {featureTypes.length > 0 && (
                <>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search WFS features..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ mb: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                            ),
                        }}
                    />
                    <List sx={{ maxHeight: 250, overflow: "auto", border: '1px solid #ddd', borderRadius: 1 }}>
                        {filteredFeatures.map(ft => (
                            <ListItem
                                key={ft.name}
                                disablePadding
                                secondaryAction={
                                    <Checkbox
                                        edge="end"
                                        checked={selectedTypeNames.includes(ft.name)}
                                        onChange={() => toggleLayer(ft.name)}
                                    />
                                }
                            >
                                <ListItemButton onClick={() => toggleLayer(ft.name)}>
                                    <ListItemText primary={ft.title} secondary={ft.name} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            {processing && <CircularProgress size={20} sx={{ mt: 1 }} />}
        </Box>

    );
});

AddWFSForm.displayName = "AddWFSForm";
export default AddWFSForm;