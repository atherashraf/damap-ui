import {IconButton, Tooltip} from "@mui/material";
import TextFieldsIcon from '@mui/icons-material/TextFields';
import MapVM from "@/components/map/models/MapVM";
import {ITextStyle} from "@/types/typeDeclarations";
import {OverlayVectorLayer} from "@/components/map/layers/overlay_layers";
import {TextSymbolizer} from "@/damap";



interface IProps {
    mapVM: MapVM
}

const AddTextStyle = ({mapVM}: IProps) => {

    const onApply = (textStyle: ITextStyle, selectedLabel: string): void => {
        // console.log("apply style", textStyle, selectedLabel)
        const uuid = mapVM.getLayerOfInterest()
        const layer: OverlayVectorLayer = mapVM.getOverlayLayer(uuid) as OverlayVectorLayer
        layer.updateLabelOptions(selectedLabel, textStyle, true)
    }
    const handleClick = () => {
        const uuid = mapVM.getLayerOfInterest()
        const layer: OverlayVectorLayer = mapVM.getOverlayLayer(uuid) as OverlayVectorLayer
        if (!layer) {
            mapVM?.showSnackbar("Please select a layer to add text style")
            return
        }
        if (!layer.layerInfo.showLabel) {
            layer.setShowLabel(true)
            const properties = layer.getFeatures()[0].getProperties();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars

            const {geometry, ...restProps} = properties;
            const keys = Object.keys(restProps)

            // alert("Working..")
            mapVM?.getRightDrawerRef()?.current?.setContent("Add Text Style",
                <TextSymbolizer initialStyle={layer.getTextStyle()} onApply={onApply}
                                labelField={layer.getLabelProperty()}
                                labels={keys}/>)
            mapVM?.getRightDrawerRef()?.current?.openDrawer();
        } else {
            if(mapVM?.getRightDrawerRef()?.current?.isOpen()) {
                mapVM?.getRightDrawerRef()?.current?.closeDrawer();
            }else {
                layer.setShowLabel(false)
            }
        }
    }
    return (
        <Tooltip title="Toogle Text Style">
            <IconButton sx={{padding: "3px"}} onClick={handleClick}>
                <TextFieldsIcon/>
            </IconButton>
        </Tooltip>
    )
}
export default AddTextStyle;