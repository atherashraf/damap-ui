import MapApi, { MapAPIs } from "@damap/api/MapApi";
import MapVM from "../models/MapVM";
import {
    BulkUpdateLayerAttributeRequest, BulkUpdateLayerAttributeResponse,
    DeleteFeaturesResponse,
    LayerPKColsResponse, UpdateFeatureResponse
} from "@damap/api/mapApiTypes";


class DMLManager {
    private mapVM: MapVM;
    private api: MapApi;

    constructor(mapVM: MapVM) {
        this.mapVM = mapVM;
        this.api = mapVM.getApi();
    }

    get isEditingAllowed(): boolean {
        return this.mapVM.isLayerDesigner();
    }

    async getLayerPkCols(layerUUID?: string): Promise<LayerPKColsResponse | null> {
        const uuid = layerUUID || this.mapVM.getLayerOfInterest();
        if (!uuid) return null;

        return await this.api.get(MapAPIs.DCH_LAYER_PKCOLS, { uuid });
    }

    async updateAttributes(
        layerUuid: string,
        pkObject: Record<string, any>,
        column: string,
        value: any
    ): Promise<boolean> {
        if (!this.isEditingAllowed) return false;

        try {
            const res: UpdateFeatureResponse | null = await this.api.post(
                MapAPIs.DCH_UPDATE_LAYER_ATTRIBUTE,
                {
                    pk_object: pkObject,
                    column,
                    value
                },
                { uuid: layerUuid }
            );

            console.log("updateAttribute response", res);

            if (res?.rows_affected && res.rows_affected >= 1) {
                await this.mapVM.refreshAttributeTable();
                this.mapVM.showSnackbar(res.message || "Attribute updated", "success", 2000);
                return true;
            } else {
                this.mapVM.showSnackbar("Attribute not updated", "warning", 2000);
                return false;
            }
        } catch (err: any) {
            const errorMsg =
                err?.response?.data?.detail || "Update failed";
            this.mapVM.showSnackbar(errorMsg, "error");
            console.error(err);
            return false;
        }
    }

    async deleteFeatures(
        layerUuid: string,
        pkObjects: Record<string, any>[]
    ): Promise<boolean> {
        if (!this.isEditingAllowed || !pkObjects || pkObjects.length === 0) {
            return false;
        }

        try {
            this.mapVM.getMapLoadingRef().current?.openIsLoading();

            const result: DeleteFeaturesResponse | null = await this.api.post(
                MapAPIs.DCH_DELETE_LAYER_FEATURES,
                { pk_objects: pkObjects },
                { uuid: layerUuid }
            );

            if (result?.status === "success") {
                const rowCount = result.rows_affected || pkObjects.length;

                this.mapVM.showSnackbar(
                    `Successfully deleted ${rowCount} feature(s)`,
                    "success",
                    1000
                );

                await this.mapVM.refreshAttributeTable();

                setTimeout(() => {
                    this.mapVM.refreshMap()
                    this.mapVM.showSnackbar("🔄 If the map is not refreshed, please try refreshing it again after a few seconds from the toolbar.");
                    this.mapVM.getSelectionLayer()?.clearSelection();
                }, 2000);

                return true;
            } else {
                this.mapVM.showSnackbar(
                    "Failed to delete features. Please try again.",
                    "error"
                );
                return false;
            }
        } catch (err: any) {
            console.error("Delete Operation Error:", err);
            const errorMsg =
                err?.response?.data?.detail ||
                "An error occurred during deletion.";
            this.mapVM.showSnackbar(errorMsg, "error");
            return false;
        } finally {
            this.mapVM.getMapLoadingRef().current?.closeIsLoading();
        }
    }

    async updateAttributesForMany(
        layerUuid: string,
        pkObjects: Record<string, any>[],
        column: string,
        value: any
    ): Promise<boolean> {
        if (!this.isEditingAllowed || !layerUuid || !pkObjects?.length) {
            return false;
        }

        try {
            this.mapVM.getMapLoadingRef().current?.openIsLoading();

            const data: BulkUpdateLayerAttributeRequest = {
                pk_objects: pkObjects,
                column,
                value
            };

            const res: BulkUpdateLayerAttributeResponse | null =
                await this.api.post(
                    MapAPIs.DCH_BULK_UPDATE_LAYER_FIELD_VALUE,
                    data,
                    { uuid: layerUuid }
                );

            if (res?.rows_affected && res.rows_affected > 0) {
                await this.mapVM.refreshAttributeTable();
                this.mapVM.refreshMap();

                this.mapVM.showSnackbar(
                    res.message || `${res.rows_affected} feature(s) updated`,
                    "success",
                    2000
                );

                return true;
            }

            this.mapVM.showSnackbar(
                res?.message || "No records were updated",
                "warning",
                2000
            );

            return false;

        } catch (err: any) {
            const errorMsg =
                err?.response?.data?.detail || "Bulk update failed";

            this.mapVM.showSnackbar(errorMsg, "error");
            console.error(err);
            return false;

        } finally {
            this.mapVM.getMapLoadingRef().current?.closeIsLoading();
        }
    }

}

export default DMLManager;