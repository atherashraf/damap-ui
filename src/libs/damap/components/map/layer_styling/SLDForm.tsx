
import { MapAPIs } from "@damap/api/MapApi";
import MapVM from "@damap/components/map/models/MapVM";
import Button from "@mui/material/Button";

interface IProps {
  mapVM: MapVM;
}

const SLDForm = (props: IProps) => {
  const handleFilesChange = (e: any) => {
    uploadFile(e.target.files[0]);
  };

  const uploadFile = (file: any) => {
    // Create a form and post it to server
    const formData = new FormData();
    // fileToUpload.forEach((file) => formData.append("files", file))
    formData.append("file", file);
    const layerId = props.mapVM.getLayerOfInterest();
    if (!layerId) {
      props.mapVM.showSnackbar("Please select a layer first");
      return;
    }
    const mapUUID = props.mapVM.isMapEditor ? (props.mapVM.getMapUUID() ?? "-1") : "-1";
    props.mapVM
      .getApi()
      .postFormData(MapAPIs.DCH_SAVE_SLD, formData, { uuid: layerId , map_uuid: mapUUID })
      .then((payload) => {
        if (payload) {
          props.mapVM.showSnackbar("SLD uploaded successfully");
          const daLayer = props.mapVM.getDALayer(layerId);
          daLayer?.updateStyle();
        }
      });
  };

  return (
    <>
      <Button variant="outlined" component="label" fullWidth={true}>
        Upload File
        <input
          type="file"
          accept=".json, .sld, .xml"
          onChange={handleFilesChange}
          hidden
        />
      </Button>
    </>
  );
};

export default SLDForm;
