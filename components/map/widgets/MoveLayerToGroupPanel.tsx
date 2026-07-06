import * as React from "react";
import {
    Box,
    Button,
    // Dialog,
    // DialogActions,
    // DialogContent,
    // DialogTitle,
    FormControlLabel,
    MenuItem,
    Radio,
    RadioGroup,
    TextField,
} from "@mui/material";
import {MapVM} from "@/libs/damap";
import {LayerItem} from "@damap/components/map/layer_switcher_mui/types";

export interface LayerGroupOption {
    key: string;
    title: string;
    collapsed?: boolean;
}

interface MoveLayerToGroupDialogProps {
    open: boolean;
    // groups: LayerGroupOption[];
    // onClose: () => void;
    // onMove: (group: LayerGroupOption) => void;
    mapVM: MapVM;
    layerItem: LayerItem;
}

const makeGroupKey = (title: string) =>
    title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w]/g, "");

const MoveLayerToGroupPanel = ({
                                   open,
                                   mapVM,
                                   layerItem
                               }: MoveLayerToGroupDialogProps) => {

    const groups = React.useMemo(
        () =>
            mapVM.layerSwitcherManager.getLayerGroups().map((g) => ({
                key: g.get("groupKey") || g.get("title"),
                title: g.get("title"),
                collapsed: g.get("fold") === "close",
            })),
        [mapVM]
    );

    const [mode, setMode] = React.useState<"existing" | "new">(
        groups.length ? "existing" : "new"
    );

    const [selectedGroupKey, setSelectedGroupKey] = React.useState("");
    const [newGroupTitle, setNewGroupTitle] = React.useState("");

    const onClose = () => {
        mapVM.getRightDrawerRef().current?.closeDrawer();
        mapVM.layerSwitcherManager.closeContextMenu();
    }
    // const onMove = (group: LayerGroupOption) => {
    //     mapVM.layerSwitcherManager.moveMenuItemToGroup(layerItem, group);
    //     mapVM.getRightDrawerRef().current?.closeDrawer();
    //     mapVM.layerSwitcherManager.closeContextMenu();
    // };
    const onMove = (group: LayerGroupOption) => {
        // Explicitly uses LayerSwitcherManager safely, bypassing structural resolution errors
        mapVM.layerSwitcherManager.moveMenuItemToGroup(layerItem, group);
        mapVM.getRightDrawerRef().current?.closeDrawer();
    };
    React.useEffect(() => {
        if (open) {
            setMode(groups.length ? "existing" : "new");
            setSelectedGroupKey(groups[0]?.key || "");
            setNewGroupTitle("");
        }
    }, [open, groups]);

    const handleMove = () => {
        if (mode === "existing") {
            const group = groups.find((g) => g.key === selectedGroupKey);
            if (!group) return;

            onMove({
                key: group.key,
                title: group.title,
                collapsed: false,
            });

            return;
        }

        const title = newGroupTitle.trim();
        if (!title) return;

        onMove({
            key: makeGroupKey(title),
            title,
            collapsed: false,
        });
    };

    const canMove =
        mode === "existing"
            ? Boolean(selectedGroupKey)
            : Boolean(newGroupTitle.trim());

    return (
        <Box
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
                bgcolor: "background.paper",
            }}
        >

            <RadioGroup
                value={mode}
                onChange={(e) => setMode(e.target.value as "existing" | "new")}
            >
                <Box sx={{mb: 2}}>
                    <FormControlLabel
                        value="existing"
                        control={<Radio size="small"/>}
                        label="Existing Group"
                        disabled={!groups.length}
                    />

                    {mode === "existing" && (
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Select Group"
                            value={selectedGroupKey}
                            onChange={(e) => setSelectedGroupKey(e.target.value)}
                            sx={{mt: 1}}
                        >
                            {groups.map((group) => (
                                <MenuItem key={group.key} value={group.key}>
                                    {group.title}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                </Box>

                <Box>
                    <FormControlLabel
                        value="new"
                        control={<Radio size="small"/>}
                        label="New Group"
                    />

                    {mode === "new" && (
                        <TextField
                            fullWidth
                            autoFocus
                            size="small"
                            label="Group Name"
                            value={newGroupTitle}
                            onChange={(e) => setNewGroupTitle(e.target.value)}
                            sx={{mt: 1}}
                        />
                    )}
                </Box>
            </RadioGroup>


            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                    mt: 3,
                    pt: 2,
                    borderTop: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Button size="small" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    disabled={!canMove}
                    onClick={handleMove}
                >
                    Move
                </Button>
            </Box>
        </Box>
    );
};

export default MoveLayerToGroupPanel;