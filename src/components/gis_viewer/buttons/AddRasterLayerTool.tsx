import {IconButton} from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import {getMapVM} from "@/damap";
import GeoTiffUploadForm from "@/components/gis_viewer/form/GeoTiffUploadForm";


const AddRasterLayerTool = () => {
    const handleAddRaster = () => {
        const mapVM = getMapVM();
        mapVM.getDialogBoxRef()?.current?.openDialog({
            title: "Add Raster Layer",
            content: <GeoTiffUploadForm />,
        });
    };
    return(
        <>
            <IconButton
                size="small"
                color="primary"
                title="Add Raster Layer"
                onClick={handleAddRaster}
            >
                <AddPhotoAlternateIcon />
            </IconButton>
        </>
    )
}
export default AddRasterLayerTool;