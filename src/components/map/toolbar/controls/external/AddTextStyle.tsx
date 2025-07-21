import {IconButton, Tooltip} from "@mui/material";
import TextFieldsIcon from '@mui/icons-material/TextFields';
import {ITextStyle, MapVM} from "damap";
import TextSymbolizer from "@/components/map/layer_styling/vector/symbolizer/TextSymbolizer";
import OverlayVectorLayer from "../../../layers/overlay_layers/OverlayVectorLayer";

interface IProps {
    mapVM: MapVM
}

const AddTextStyle = ({mapVM}: IProps) => {

    const onApply = (textStyle: ITextStyle, selectedLabel): void => {

        console.log("apply style", textStyle, selectedLabel)
        const uuid=  mapVM.getLayerOfInterest()
        const layer: OverlayVectorLayer =  mapVM.getOverlayLayer(uuid) as OverlayVectorLayer
        layer.updateLabelOptions(selectedLabel, textStyle, true)


    }
    const handleClick = () => {
        const uuid=  mapVM.getLayerOfInterest()
        const layer: OverlayVectorLayer =  mapVM.getOverlayLayer(uuid) as OverlayVectorLayer
        if(!layer){
            mapVM?.showSnackbar("Please select a layer to add text style")
            return
        }
        const properties = layer.getFeatures()[0].getProperties();
        const { geometry, ...restProps } = properties;
        const keys = Object.keys(restProps)
        console.log("properties", properties)

        console.log("layer", layer)
        // alert("Working..")
        mapVM?.getRightDrawerRef()?.current?.setContent("Add Text Style", <TextSymbolizer onApply={onApply} labels={keys} />)
        mapVM?.getRightDrawerRef()?.current?.openDrawer();
    }
    return (
        <Tooltip title="Add Layer">
            <IconButton sx={{ padding: "3px" }} onClick={handleClick}>
                <TextFieldsIcon />
            </IconButton>
        </Tooltip>
    )
}
export default AddTextStyle;