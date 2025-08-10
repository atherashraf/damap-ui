import {Autocomplete, FormGroup, IconButton, TextField, Toolbar} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FunctionsIcon from '@mui/icons-material/Functions';
// import AttributeGrid from "damap/lib/widgets/grid/AttributeGrid";
import Typography from "@mui/material/Typography";
import {type RefObject, useEffect, useState} from "react";
import {BottomDrawerHandle} from "@/components/map/drawers/BottomDrawer";
import MapVM from "@/components/map/models/MapVM";
import {useMapVM} from "@/hooks/MapVMContext";
import AttributeTable from "@/components/map/table/AttributeTable";


interface ISurfaceName {
    title: string;
    uuid: string;
}

const LBDC_CROP_SURFACE_LIST = "/api/lbdc/crop_surface_list"
const LBDC_CROP_STATS = "/api/lbdc/crop_stats/{crop_layer_uuid}"

// const cropDAGridRef: RefObject<AttributeGrid> = React.createRef<AttributeGrid>()
const CropToolbar = () => {
    const [surfaceNames, setSurfaceNames] = useState<readonly ISurfaceName[]>([]);
    const [selectedSurface, setSelectSurface] = useState<ISurfaceName>()
    // const [selectedCanalCommand, setSelectedCanalCommand] = React.useState<ICanalCommandData>()
    // const api = useAppApi()
    const mapVM: MapVM = useMapVM()

    useEffect(() => {
        const api = mapVM.getApi()
        api.get(LBDC_CROP_SURFACE_LIST).then((payload: readonly ISurfaceName[]) => {
            if (payload) {
                setSurfaceNames(payload);
            }
        });
    }, []);
    const handleAddButton = async () => {
        if (!selectedSurface) {
            mapVM.showSnackbar("Please select surface before adding it...", "error");
            return;
        } else {
            await mapVM.addDALayer({uuid: selectedSurface.uuid});
        }
    };
    const handleStatsButton = () => {
        // mapVM?.getMapPanelRef()?.current?.closeBottomDrawer();
        const bottomDrawerRef: RefObject<BottomDrawerHandle> = mapVM.getBottomDrawerRef()
        bottomDrawerRef.current.closeDrawer()
        if (!selectedSurface) {
            mapVM?.showSnackbar("Please select surface")
        } else {

            const tableHeight = 300
            bottomDrawerRef.current.openDrawer(tableHeight)
            // console.log("new table height", tableHeight)
            const api = mapVM.getApi()
            api.get(LBDC_CROP_STATS, {
                crop_layer_uuid: selectedSurface.uuid
            }).then((payload: any) => {
                if (payload) {
                    console.log("payload", payload)
                    mapVM?.setLayerOfInterest(payload.cc_uuid, false)
                    // const ptSrc = api.get(AppAPIs.LBDC_CROP_STATS_PT, {crop_layer_uuid: selectedSurface.uuid})
                    // mapVM?.openAttributeTable(payload.columns, payload.rows, payload.pkCols, tableHeight, cropDAGridRef, ptSrc)
                    // setTimeout(() => {
                    //     cropDAGridRef?.current?.pinColumns(["id", "canal"])
                    // }, 2000)

                    const attributeTable = <AttributeTable columns={payload.columns} data={payload.rows}
                                                          pkCols={payload.pkCols} />
                    bottomDrawerRef.current.setContent(attributeTable)
                }
            });
        }
    }
    return (
        <Toolbar sx={{justifyContent: "flex-end"}}>

            <Typography>Area in 000_acre</Typography>
            &nbsp; &nbsp;

            <FormGroup row={true} sx={{m: 0, p: 0, border: "1px solid white"}}>
                <Autocomplete
                    disablePortal
                    options={surfaceNames} autoComplete={true} autoHighlight={true}
                    onChange={(_, option) => setSelectSurface(option || undefined)}
                    getOptionLabel={(option: ISurfaceName) => option['title']}
                    sx={{width: "250px", backgroundColor: "white"}}
                    ListboxProps={{style: {maxHeight: 150}}}
                    renderInput={(params) => <TextField {...params}
                                                        fullWidth={true} size={"small"}
                                                        label={"Select Surface"}/>}
                />

                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{mx: 1}}
                    onClick={handleAddButton}
                >
                    <AddIcon/>
                </IconButton>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{mx: 1}}
                    onClick={handleStatsButton}
                >
                    <FunctionsIcon/>
                </IconButton>
            </FormGroup>
        </Toolbar>
    );
};

export default CropToolbar;
