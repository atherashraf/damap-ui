import {IconButton, Tooltip} from "@mui/material";
import TextFieldsIcon from '@mui/icons-material/TextFields';
import MapVM from "@damap/components/map/models/MapVM";
import {ILabelableLayer, ITextStyle} from "@damap/types/typeDeclarations";

import {getMapVM, TextSymbolizer} from "@damap/damap";



interface IProps {
    mapVM?: MapVM
}

const AddTextStyle = ({ mapVM: propMapVM }: IProps) => {
    const mapVM = propMapVM ?? getMapVM();

    const onApply = (textStyle: ITextStyle, selectedLabel: string): void => {
        const uuid = mapVM.getLayerOfInterest();
        if (!uuid) {
            mapVM.showSnackbar("Please select a vector layer to add text style");
            return;
        }

        const layer =
            (mapVM.getOverlayLayer(uuid) as ILabelableLayer) ??
            (mapVM.getDALayer(uuid) as ILabelableLayer);

        if (!layer) {
            mapVM.showSnackbar("Please select a vector layer to add text style");
            return;
        }

        layer.updateLabelOptions(selectedLabel, textStyle, true);
    };

    const handleClick = async () => {
        const uuid = mapVM.getLayerOfInterest();
        if (!uuid) {
            mapVM.showSnackbar("Please select a vector layer to add text style");
            return;
        }

        const layer =
            (mapVM.getOverlayLayer(uuid) as ILabelableLayer) ??
            (mapVM.getDALayer(uuid) as ILabelableLayer);

        if (!layer) {
            mapVM.showSnackbar("Please select a vector layer to add text style");
            return;
        }

        if (!layer.layerInfo.showLabel) {
            layer.setShowLabel(true);
            console.log("getting attribute list")
            const keys = await layer.getAttributeList();
            console.log(keys);

            mapVM.getRightDrawerRef()?.current?.setContent(
                "Add Text Style",
                <TextSymbolizer
                    initialStyle={layer.getTextStyle()}
                    onApply={onApply}
                    labelField={layer.getLabelProperty()}
                    labels={keys}
                />
            );

            mapVM.getRightDrawerRef()?.current?.openDrawer();
        } else {
            if (mapVM.getRightDrawerRef()?.current?.isOpen()) {
                mapVM.getRightDrawerRef()?.current?.closeDrawer();
            } else {
                layer.setShowLabel(false);
            }
        }
    };

    return (
        <Tooltip title="Toggle Text Style">
            <IconButton sx={{ padding: "3px" }} onClick={handleClick}>
                <TextFieldsIcon />
            </IconButton>
        </Tooltip>
    );
};
export default AddTextStyle;
