import Toolbar from "@mui/material/Toolbar";
import {IconButton} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {type ChangeEvent, useEffect, useState} from "react";
import {useMapVM} from "@/hooks/MapVMContext";
import MapVM from "@/components/map/models/MapVM";



interface IGWLayerList {
    title: string,
    uuid: string
}
const AppAPIs = {
    LBDC_AOI: "api/lbdc/lbdc_aoi/",
    WATER_QUALITY_DATA: "api/lbdc/water_quality_data/",
    WATER_LEVEL_DATA: "api/lbdc/water_level_data/",
}

const GroundWaterToolbar = () => {
    const mapVM: MapVM = useMapVM();
    const api = mapVM.getApi();
    const [gwLayerList, setGWLayerList] = useState<IGWLayerList[]>([]);
    const [aoi, setAOI] = useState(null);
    const [waterQualityData, setWaterQualityData] = useState(null);
    //@ts-ignore
    const [waterLevelData, setWaterLevelData] = useState(null);
    // const [idwUUID, setIDWUUID] = useState(MapVM.generateUUID())
    //@ts-ignore
    const [idwLayer, setIDWLayer] = useState<IDWLayer | null>(null)

    // const idwUUID = MapVM.generateUUID()
    // const title = 'Water Quality Surface'
    //@ts-ignore
    const getGWData = async () => {
        try {
            if (!aoi) {
                const boundary = await api.get(AppAPIs.LBDC_AOI);
                setAOI(boundary)
            }
            if (!waterQualityData) {
                const geojson = await api.get(AppAPIs.WATER_QUALITY_DATA);
                setWaterQualityData(geojson);
                const levelGeojson = await api.get(AppAPIs.WATER_LEVEL_DATA);
                setWaterLevelData(levelGeojson);
            }
            // return {aoi, waterQualityData}
        } catch (error) {
            throw Error(error instanceof Error ? error.message : String(error));
        }
    }
    const wqHandler = (event: ChangeEvent<HTMLSelectElement>) => {
        var wqType = event.target.value;
        console.log("value", wqType);
        if (wqType == "level") {
            var gwLevelList = [
                {title: "LBDC_GWL_PRE2022", uuid: 'fc057048-dea8-11ed-b291-601895253350'},
                {title: "LBDC_GWL_PRE2021", uuid: 'f73a0c3f-dea8-11ed-82b4-601895253350'},
                {title: "LBDC_GWL_POST2021", uuid: 'ed747c07-dea8-11ed-aaff-601895253350'},
                {title: "LBDC_GWL_PRE2020", uuid: 'f26978a9-dea8-11ed-b2c0-601895253350'},
                {title: "LBDC_GWL_POST2020", uuid: 'e7ab933e-dea8-11ed-8001-601895253350'},
                {title: "LBDC_GWL_PRE2019", uuid: '4b0843a2-ddda-11ed-97ff-601895253350'},
                {title: "LBDC_GWL_POST2019", uuid: '06c6a750-ddda-11ed-84e9-601895253350'},
                {title: "LBDC_GWL_PRE2018", uuid: '40ae7d56-ddda-11ed-a92e-601895253350'},
                {title: "LBDC_GWL_POST2018", uuid: 'fee2e88d-ddd9-11ed-8081-601895253350'},
                {title: "LBDC_GWL_PRE2013", uuid: '0f6d011e-ddda-11ed-94d9-601895253350'},
                {title: "LBDC_GWL_POST2013", uuid: 'f7ea4cd3-ddd9-11ed-8690-601895253350'},
            ];
            setGWLayerList(gwLevelList);
        } else if (wqType == "quality") {
            var gwQualityList = [
                {title: "LBDC_GWq_EC_2020", uuid: 'd567510e-de81-11ed-be2e-601895253350'},
                {title: "LBDC_GWq_SAR_2020", uuid: '06971fc5-de7f-11ed-86b1-601895253350'},
                {title: "LBDC_GWq_RSC_2020", uuid: 'ffc68bd9-de7e-11ed-b954-601895253350'}
            ];
            setGWLayerList(gwQualityList);
        } else {
            mapVM.showSnackbar("Please select ground water type...");
        }
    };

    const wqTypeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
        var wqType = event.target.value;
        console.log("value", wqType);
        // if (wqType == "") {
        //     SnackbarUtils.showSnackbar("Please select surface before adding it...");
        // } else {
        //     const mapVM = MapViewRef.current?.getMapVM();
        //     mapVM.addDALayer({uuid: wqType});
        //     console.log(wqType);
        // }


        // if (wqType !== "" && idwLayer) {
        //     if (wqType == "pre_19" || wqType == "post_19" ||  wqType == "elevation_meters" ) {
        //         const mapVM = MapViewRef.current?.getMapVM();
        //         const info = {uuid: idwUUID, title}
        //         const layer = new IDWLayer(mapVM, info, waterLevelData, wqType, aoi)
        //         layer.updateIDWLayer(wqType)
        //     } else {
        //         idwLayer.updateIDWLayer(wqType)
        //
        //     }
        //
        // }

    };

    const handelAddButton = async () => {
        // @ts-ignore
        const value = document.getElementById("selectLayer")?.value as string;
        console.log("value", value);
        if (value == "") {
            mapVM.showSnackbar("Please select surface before adding it...");
        } else {
            mapVM.addDALayer({uuid: value});
            // console.log(value);
            // mapVM.getRightDrawerRef().current?.addContents("Layer Switcher", <LayerSwitcherPaper mapVM={mapVM}/>)
            // mapVM.getRightDrawerRef().current?.openDrawer()
            // mapVM.refreshMap();

        }
    };

    useEffect(() => {
        // getGWData().then(() => {
        //     if (aoi && waterQualityData) {
        //         const info = {uuid: idwUUID, title}
        //         if (!mapVM.isOverlayLayerExist(idwUUID)) {
        //             const layer = new IDWLayer(mapVM, info, waterQualityData, "electric_conductivity", aoi)
        //             setIDWLayer(layer)
        //             layer.addIDWLayer()
        //         }
        //     }
        // }).catch((_) => {
        //     // console.error("error", e)
        //     mapVM.showSnackbar(`Failed to create the IDW surface...`)
        // })
    }, [aoi, waterQualityData])


    return (
        <>
            <Toolbar sx={{justifyContent: "flex-end"}}>
                <select
                    onChange={wqHandler}
                    id={"selectLayerType"}
                    style={{
                        backgroundColor: "transparent",
                        width: "200px",
                        color: "white",
                        textAlignLast: "center",
                        borderColor: "white",
                    }}>
                    <option value={"-1"}>...GW type...</option>
                    <option value={"level"} style={{color: "black"}}>GW level</option>
                    <option value={"quality"} style={{color: "black"}}>GW quality</option>
                </select>
                &nbsp; &nbsp;
                <select
                    onChange={wqTypeHandler}
                    id={"selectLayer"}
                    style={{
                        backgroundColor: "transparent",
                        width: "250px",
                        color: "white",
                        textAlignLast: "center",
                        borderColor: "white",
                    }}
                >
                    <option value={""}>...Select GW Layer...</option>
                    {gwLayerList.map((gw: IGWLayerList) => (
                        <option
                            style={{color: "black"}}
                            value={gw.uuid}
                        >
                            {gw.title}
                        </option>
                    ))}
                    {/*<option value={"fc057048-dea8-11ed-b291-601895253350"}>LBDC_GWL_PRE2022</option>*/}
                    {/*<option value={"ed747c07-dea8-11ed-aaff-601895253350"}>LBDC_GWL_POST2021</option>*/}
                    {/*<option value={"f73a0c3f-dea8-11ed-82b4-601895253350"}>LBDC_GWL_PRE2021</option>*/}
                    {/*<option value={"e7ab933e-dea8-11ed-8001-601895253350"}>LBDC_GWL_POST2020</option>*/}
                    {/*<option value={"f26978a9-dea8-11ed-b2c0-601895253350"}>LBDC_GWL_PRE2020</option>*/}
                    {/*<option value={"06c6a750-ddda-11ed-84e9-601895253350"}>LBDC_GWL_POST2019</option>*/}
                    {/*<option value={"4b0843a2-ddda-11ed-97ff-601895253350"}>LBDC_GWL_PRE2019</option>*/}
                    {/*<option value={"fee2e88d-ddd9-11ed-8081-601895253350"}>LBDC_GWL_POST2018</option>*/}
                    {/*<option value={"40ae7d56-ddda-11ed-a92e-601895253350"}>LBDC_GWL_PRE2018</option>*/}
                    {/*<option value={"f7ea4cd3-ddd9-11ed-8690-601895253350"}>LBDC_GWL_POST2013</option>*/}
                    {/*<option value={"0f6d011e-ddda-11ed-94d9-601895253350"}>LBDC_GWL_PRE2013</option>*/}
                    {/*<option value={"d567510e-de81-11ed-be2e-601895253350"}>LBDC_GWq_EC_2020</option>*/}
                    {/*<option value={"06971fc5-de7f-11ed-86b1-601895253350"}>LBDC_GWq_SAR_2020</option>*/}
                    {/*<option value={"ffc68bd9-de7e-11ed-b954-601895253350"}>LBDC_GWq_RSC_2020</option>*/}
                    {/*<option value={"electric_conductivity"} selected>Electric Conductivity Surface</option>*/}
                    {/*<option value={"residual_sodium_carbonate"}>Residual Sodium Carbonate Surface</option>*/}
                    {/*<option value={"pre_19"}>Water Level Pre-19</option>*/}
                    {/*<option value={"post_19"}>Water Level Post-19</option>*/}
                    {/*<option value={"elevation_meters"}>Elevation</option>*/}
                    {/*<option value={"chlorides"}>Chlorides Surface</option>*/}
                    {/*<option value={"sulphates"}>Sulphates Surface</option>*/}
                    {/*<option value={"sodium"}>Sodium Surface</option>*/}
                    {/*<option value={"potassium"}>Potassium Surface</option>*/}
                    {/*<option value={"calcium_magnesium"}>Calcium Magnesium Surface</option>*/}
                </select>

                &nbsp; &nbsp;
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{mr: 2}}
                    onClick={handelAddButton}
                >
                    <AddIcon/>
                </IconButton>

            </Toolbar>

        </>
    )
}
export default GroundWaterToolbar