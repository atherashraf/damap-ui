import {useState, useMemo, forwardRef, useImperativeHandle, useEffect} from "react";
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import {getMapVM, MapAPIs, MapVM} from "@/libs/damap";

interface WMSLayer {
    name: string;
    title: string;
    abstract?: string;
}

interface ApplicationUrlItem {
    uuid: string;
    title: string;
    layer_name: string;
    url: string;
    url_type: string;
}

interface AddWMSFormProps {
    defaultUrl?: string;
}

export interface AddWMSFormHandle {
    addSelectedLayers: () => void;
}

const AddWMSForm = forwardRef<AddWMSFormHandle, AddWMSFormProps>(
    ({ defaultUrl = "" }, ref) => {
        const mapVM = getMapVM();

        const [url, setUrl] = useState(defaultUrl || "");
        const [savedUrls, setSavedUrls] = useState<ApplicationUrlItem[]>([]);
        const [selectedSavedUrl, setSelectedSavedUrl] = useState("");
        const [layers, setLayers] = useState<WMSLayer[]>([]);
        const [selectedLayerNames, setSelectedLayerNames] = useState<string[]>([]);
        const [searchQuery, setSearchQuery] = useState("");
        const [loading, setLoading] = useState(false);
        const [loadingSavedUrls, setLoadingSavedUrls] = useState(false);
        const [error, setError] = useState("");
        const [wmsVersion, setWmsVersion] = useState("1.3.0");

        const filteredLayers = useMemo(() => {
            return layers.filter((layer) =>
                layer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                layer.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }, [layers, searchQuery]);

        useEffect(() => {
            let mounted = true;

            const loadApplicationUrls = async () => {
                try {
                    setLoadingSavedUrls(true);

                    const res = await mapVM.api.get(
                        MapAPIs.DCH_GET_APPLICATION_URL,
                        { url_type: "geoserver" }
                    );

                    const payload = res && Array.isArray(res) ? res : [];

                    if (!mounted) return;
                    setSavedUrls(payload);
                } catch (err) {
                    console.error("Failed to load application URLs", err);
                } finally {
                    if (mounted) setLoadingSavedUrls(false);
                }
            };

            loadApplicationUrls();

            return () => {
                mounted = false;
            };
        }, [mapVM.api]);

        const buildCapabilitiesUrl = (rawUrl: string) => {
            const u = new URL(rawUrl.trim());
            u.searchParams.set("service", "WMS");
            u.searchParams.set("request", "GetCapabilities");
            return u.toString();
        };

        useImperativeHandle(ref, () => ({
            addSelectedLayers: () => {
                if (selectedLayerNames.length === 0) {
                    mapVM.showSnackbar("No layers selected", "warning");
                    return;
                }

                selectedLayerNames.forEach((layerName) => {
                    const layerObj = layers.find((l) => l.name === layerName);
                    const title = layerObj?.title ?? layerName;

                    mapVM.createWMSLayer({
                        uuid: MapVM.generateUUID(),
                        title,
                        url: url.trim(),
                        layers: layerName,
                        tiled: true,
                        format: "image/png",
                        transparent: true,
                        //@ts-ignore
                        version: wmsVersion,
                        zIndex: 600,
                        visible: true,
                        opacity: 1,
                    });
                });

                mapVM.showSnackbar(
                    `${selectedLayerNames.length} layer(s) added successfully`,
                    "success"
                );
            },
        }));

        const fetchCapabilities = async () => {
            if (!url.trim()) {
                setError("Please enter a WMS server URL.");
                return;
            }

            setLoading(true);
            setError("");
            setSearchQuery("");
            setLayers([]);
            setSelectedLayerNames([]);

            try {
                const response = await fetch(buildCapabilitiesUrl(url));

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");

                const detectedVersion =
                    xmlDoc.documentElement.getAttribute("version") || "1.3.0";
                setWmsVersion(detectedVersion);

                const serviceException = xmlDoc.getElementsByTagName("ServiceException")[0];
                if (serviceException) {
                    throw new Error(serviceException.textContent || "Invalid WMS response");
                }

                const layerNodes = Array.from(xmlDoc.getElementsByTagName("Layer")).filter(
                    (node) => node.getElementsByTagName("Name")[0]
                );

                const parsedLayers: WMSLayer[] = layerNodes.map((node) => ({
                    name: node.getElementsByTagName("Name")[0]?.textContent ?? "",
                    title:
                        node.getElementsByTagName("Title")[0]?.textContent ??
                        node.getElementsByTagName("Name")[0]?.textContent ??
                        "Untitled",
                    abstract: node.getElementsByTagName("Abstract")[0]?.textContent ?? "",
                }));

                setLayers(parsedLayers);
                mapVM.showSnackbar(`${parsedLayers.length} layer(s) found`, "success");
            } catch (err) {
                setError("Failed to fetch capabilities. Check URL, WMS service, or CORS.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const toggleLayer = (name: string) => {
            setSelectedLayerNames((prev) =>
                prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
            );
        };

        const handleSavedUrlChange = (selectedUrl: string) => {
            setSelectedSavedUrl(selectedUrl);
            setUrl(selectedUrl);
            setError("");
            setLayers([]);
            setSelectedLayerNames([]);
            setSearchQuery("");
        };

        const handleUrlChange = (value: string) => {
            setUrl(value);
            setError("");

            const matched = savedUrls.find((item) => item.url === value);
            setSelectedSavedUrl(matched ? matched.url : "");
        };

        const clearUrlField = () => {
            setUrl("");
            setSelectedSavedUrl("");
            setError("");
            setLayers([]);
            setSelectedLayerNames([]);
            setSearchQuery("");
        };

        return (
            <Box
                sx={{
                    p: 1,
                    width: "100%",
                    boxSizing: "border-box",
                    overflowX: "hidden",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        mb: 2,
                        width: "100%",
                    }}
                >
                    <TextField
                        fullWidth
                        label="WMS Server URL"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        error={Boolean(error)}
                        helperText={error || "Enter your own URL or choose one from the dropdown below"}
                        size="small"
                        InputProps={{
                            endAdornment: url ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={clearUrlField}
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                    />

                    <FormControl fullWidth size="small" disabled={loadingSavedUrls}>
                        <InputLabel id="saved-geoserver-label">
                            Saved Geoserver URLs
                        </InputLabel>
                        <Select
                            labelId="saved-geoserver-label"
                            value={selectedSavedUrl}
                            label="Saved Geoserver URLs"
                            onChange={(e) => handleSavedUrlChange(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>Select existing URL</em>
                            </MenuItem>

                            {savedUrls.map((item) => (
                                <MenuItem key={item.uuid} value={item.url}>
                                    {item.title}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        fullWidth
                        variant="contained"
                        onClick={fetchCapabilities}
                        disabled={loading}
                    >
                        Connect
                    </Button>
                </Box>

                {loading && (
                    <CircularProgress size={24} sx={{ display: "block", m: "10px auto" }} />
                )}

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

                {layers.length > 0 && (
                    <List
                        sx={{
                            width: "100%",
                            maxHeight: 250,
                            overflow: "auto",
                            border: "1px solid #ddd",
                            borderRadius: 1,
                            boxSizing: "border-box",
                        }}
                    >
                        {filteredLayers.map((layer) => (
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
                                sx={{ alignItems: "flex-start" }}
                            >
                                <ListItemButton
                                    onClick={() => toggleLayer(layer.name)}
                                    sx={{ pr: 6 }}
                                >
                                    <ListItemText
                                        primary={layer.title}
                                        secondary={layer.name}
                                        primaryTypographyProps={{
                                            sx: {
                                                wordBreak: "break-word",
                                                whiteSpace: "normal",
                                            },
                                        }}
                                        secondaryTypographyProps={{
                                            sx: {
                                                wordBreak: "break-word",
                                                whiteSpace: "normal",
                                            },
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        );
    }
);

AddWMSForm.displayName = "AddWMSForm";
export default AddWMSForm;