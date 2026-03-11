/***
 await api.get(MapAPIs.DCH_LAYER_INFO, { uuid });

 await api.post(MapAPIs.DCH_SAVE_MAP, mapData);

 await api.put(MapAPIs.DCH_UPDATE_MAP, mapData, { uuid: mapUUID });

 await api.patch(MapAPIs.DCH_EDIT_MODEL_ROW, partialData, { modelName: "LayerInfo" });

 await api.delete(MapAPIs.DCH_DELETE_LAYER_INFO, null, { uuid });

 await api.postFormData(MapAPIs.DCH_UPLOAD_SHP_FILE, formData);
 ***/
import { RefObject } from "react";
import { DASnackbarHandle } from "@/components/base/DASnackbar";
import { AuthServices } from "@/damap";
import pako from "pako";
import { getDamapConfig } from "@/config";

// API endpoint constants
export const MapAPIs = Object.freeze({
    API_OAUTH_LOGIN: "api/jwt/oauth/login/{type}/",
    API_TOKEN: "api/auth/jwt/token/",
    API_REFRESH_ACCESS_TOKEN: "api/auth/jwt/refresh_access_token/",
    API_LOGIN_JSON: "api/auth/jwt/login/json",
    API_VERIFY_TOKEN: "api/auth/jwt/token/verify",

    DCH_LAYER_INFO: "api/dch/layer_info/{uuid}/",
    DCH_ALL_LAYER_INFO: "api/dch/all_layer_info/",
    DCH_LAYER_EXTENT: "api/dch/layer_extent/{uuid}/",
    DCH_LAYER_MVT: "api/dch/layer_mvt/{uuid}/",
    DCH_LAYER_WFS: "api/dch/wfs/{uuid}/{format}/",
    DCH_LAYER_RASTER: "api/dch/raster_tile/{uuid}",
    DCH_SAVE_STYLE: "api/dch/save_style/{uuid}/{map_uuid}/",
    DCH_SAVE_SLD: "api/dch/upload_sld_style/{uuid}/",
    DCH_GET_STYLE: "api/dch/get_style/{uuid}/{map_uuid}/",
    DCH_LAYER_FIELDS: "api/dch/layer_fields/{uuid}/",
    DCH_GEE_LAYER: "api/gee/gee_layer/{layer_type}/",
    DCH_GEE_LAYER_LEGEND: "api/gee/gee_layer_legend/{layer_type}/",
    DCH_LAYER_ATTRIBUTES: "api/dch/layer_attributes/{uuid}/",
    DCH_LAYER_FIELD_DISTINCT_VALUE: "api/dch/layer_field_distinct_values/{uuid}/{field_name}/{field_type}/",
    DCH_MAP_INFO: "api/dch/get_map_info/{uuid}/",
    DCH_ALL_MAP_INFO: "api/dch/all_map_info/",
    DCH_LAYER_PIXEL_VALUE: "api/dch/get_pixel_value/{uuid}/{long}/{lat}/",
    DCH_FEATURE_DETAIL: "api/dch/get_feature_detail/{uuid}/{col_name}/{col_val}/",
    DCH_RASTER_AREA: "api/dch/get_raster_area/{uuid}/{geojson_str}/",
    DCH_GET_ALL_LAYERS: "api/dch/get_all_layers/",
    DCH_RASTER_DETAIL: "api/dch/get_raster_info/{uuid}/",
    DCH_PREDEFINED_LIST: "api/dch/get_predefined_style_list/",
    DCH_LEGEND_GRAPHIC: "api/dch/get_legend_graphic/{uuid}/",
    DCH_SAVE_MAP: "api/dch/save_map/",
    DCH_DELETE_MAP: "api/dch/delete_map/{uuid}/",
    DCH_UPDATE_MAP: "api/dch/update_map/{uuid}/",
    DCH_LAYER_CATEGORIES: "api/dch/layer_categories/",
    DCH_ADD_RASTER_INFO: "api/dch/add_raster_layer_info/",
    DCH_DATA_MODEL_TYPES: "api/dch/raster_data_model_types/",
    DCH_GET_FEATURE_GEOMETRY: "api/dch/get_feature_geometry/{uuid}/{pk_values}/",

    DCH_DELETE_MODEL_ROW: "api/dch/delete_model_row/",
    DCH_EDIT_MODEL_ROW: "api/dch/edit_model_row/{modelName}/",
    DCH_DELETE_LAYER_INFO: "api/dch/delete_layerinfo_row/{uuid}/",
    DCH_DOWNLOAD_SLD: "api/dch/download_sld_style/{uuid}/",
    DCH_DOWNLOAD_DA_STYLE: "api/dch/download_da_style/{uuid}/",

    DCH_UPLOAD_SHP_FILE: "api/dch/admin/upload_shp_file/",
    DCH_PREVIEW_APPEND_SHP: "api/dch/admin/preview_append_shp/",
    DCH_COMMIT_APPEND_SHP: "api/dch/admin/commit_append_shp/",
    DCH_SAVE_DB_LAYER_INFO: "api/dch/admin/save_db_layer_info/{db_id}/{table_name}/{layer_category_id}/",
    DCH_COLUMN_VALUE: "api/dch/column_value/{uuid}/{pk_val}/{col_name}/",
    DCH_NAVIGATION_LIST: "api/dch/navigation_list/{map_uuid}/",
    DCH_NAVIGATION_GEOMETRY: "api/dch/navigation_geometry/{map_uuid}/{selected_key}/{node_id}/",

    DCH_ADMIN_LAYER_INFO_EDIT: "admin/layer-info/edit/{id}/",
    DCH_SAVE_MAP_INFO: "api/dch/save_map_info/",

    DCH_ADD_URL_LAYER_INFO: "/api/dch/admin/add_layer_url_info/",
        // "api/dch/admin/add_layer_url_info/{layer_title}/{layer_category_id}/{layer_url}/{url_type}/",
    DCH_ADD_MODEL_ROW: "api/dch/admin/add_model_row/",
    DCH_DB_CONNECTION: "api/dch/admin/get_db_connection/",
    DCH_DB_TABLE_LIST: "api/dch/admin/db_table_list/{db_id}/",
    DCH_ADD_DB_CONNECTION:"api/dch/admin/add-db-connection/",
    DCH_TEST_DB_CONNECTION:"api/dch/admin/test-db-connection/",
    DCH_SAVE_MODEL_DATA: "api/dch/admin/save_model_data/",
    DCH_SAVE_LAYER_INFO: "api/dch/admin/save_layer_info/",

    // WATER_QUALITY_DATA: "api/lbdc/water_quality_data/",
    /** test apis **/
    // LBDC_AOI: "api/lbdc/lbdc_aoi/",
    // FF_FLOW_NETWORK_GRAPH: "api/ff/flow_network_graph/",

    // LBDC_DISCHARGE:"https://irrigation.punjab.gov.pk/admin/api/fetch_LBDC_Discharge.php?"

    // PDMA_DCH_UPLOAD_RASTER:"api/layers/rasters/upload_raster/",
    // PDMA_DCH_RASTER_TMS: "api/layers/raster_tms/{uuid}",
});

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
    isJSON?: boolean;
    isGzip?: boolean;
};

export default class MapApi {
    public snackbarRef: RefObject<DASnackbarHandle | null>;

    constructor(snackbarRef: RefObject<DASnackbarHandle | null>) {
        this.snackbarRef = snackbarRef;
    }

    static getURL(api: string, params: Record<string, unknown> = {}): string {
        const { mapUrl, mapPort } = getDamapConfig();

        let API_URL = mapUrl || import.meta.env.VITE_MAP_URL;
        const API_PORT = mapPort || import.meta.env.VITE_MAP_PORT;
        const API_ENDPOINT = "";

        const hostname = window.location.hostname;
        const isDNS = !/^[0-9.]+$/.test(hostname);

        if (!API_URL) {
            API_URL = `${window.location.protocol}//${hostname}`;
            if ((!isDNS || hostname === "localhost") && API_PORT) {
                API_URL += `:${API_PORT}`;
            }
        }

        API_URL = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
        api = api.startsWith("/") ? api.slice(1) : api;

        let url = `${API_URL}${API_ENDPOINT}/${api}`;

        if (params && Object.keys(params).length > 0) {
            const queryParams: string[] = [];

            for (const key in params) {
                const value = params[key];

                if (value === undefined || value === null) continue;

                if (url.includes(`{${key}}`)) {
                    url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
                } else {
                    queryParams.push(
                        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
                    );
                }
            }

            if (queryParams.length > 0) {
                url += `?${queryParams.join("&")}`;
            }
        }

        return url;
    }

    private async getHeaders(isJson = true): Promise<Headers> {
        const token = AuthServices.getAccessToken();
        const headers = new Headers();

        if (isJson) {
            headers.append("Content-Type", "application/json");
        }

        if (token) {
            headers.append("Authorization", `Bearer ${token}`);
        }

        return headers;
    }

    private buildRequestBody(method: HttpMethod, data: unknown): BodyInit | undefined {
        if (method === "GET" || data === null || data === undefined) {
            return undefined;
        }

        if (data instanceof FormData) {
            return data;
        }

        if (
            typeof data === "string" ||
            data instanceof Blob ||
            data instanceof ArrayBuffer ||
            data instanceof URLSearchParams
        ) {
            return data as BodyInit;
        }

        return JSON.stringify(data);
    }

    private async doFetch(
        url: string,
        method: HttpMethod,
        headers: Headers,
        data: unknown
    ): Promise<Response> {
        return await fetch(url, {
            method,
            headers,
            credentials: "same-origin",
            body: this.buildRequestBody(method, data),
        });
    }

    async get<T = any>(
        api: string,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        const { isJSON = true, isGzip = false } = options;
        return await this.request<T>("GET", api, null, params, isJSON, true, isGzip);
    }

    async post<T = any>(
        api: string,
        data: unknown,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        const { isJSON = true, isGzip = false } = options;
        return await this.request<T>("POST", api, data, params, isJSON, true, isGzip);
    }

    async postFormData<T = any>(
        api: string,
        formData: FormData,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        const { isJSON = true, isGzip = false } = options;
        return await this.request<T>("POST", api, formData, params, isJSON, false, isGzip);
    }

    async put<T = any>(
        api: string,
        data: unknown,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        const { isJSON = true, isGzip = false } = options;
        return await this.request<T>("PUT", api, data, params, isJSON, true, isGzip);
    }

    async patch<T = any>(
        api: string,
        data: unknown,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        const { isJSON = true, isGzip = false } = options;
        return await this.request<T>("PATCH", api, data, params, isJSON, true, isGzip);
    }

    async delete<T = any>(
        api: string,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        const { isJSON = true, isGzip = false } = options;
        return await this.request<T>("DELETE", api, null, params, isJSON, true, isGzip);
    }

    async deleteWithBody<T = any>(
        api: string,
        data: unknown = null,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        const { isJSON = true, isGzip = false } = options;
        return await this.request<T>("DELETE", api, data, params, isJSON, true, isGzip);
    }

    private async request<T = any>(
        method: HttpMethod,
        api: string,
        data: unknown = null,
        params: Record<string, unknown> = {},
        isJSON = true,
        useJsonHeader = true,
        isGzip = false
    ): Promise<T | null> {
        const url = MapApi.getURL(api, params);
        let headers = await this.getHeaders(useJsonHeader);

        let response = await this.doFetch(url, method, headers, data);

        if (response.status === 401) {
            const newToken = await AuthServices.refreshAccessToken();

            if (newToken) {
                headers = await this.getHeaders(useJsonHeader);
                response = await this.doFetch(url, method, headers, data);
            }
        }

        if (!response.ok) {
            await this.handleError(response);
            return null;
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType) {
            return null;
        }

        if (isGzip || contentType.includes("application/gzip")) {
            const buffer = await response.arrayBuffer();

            try {
                const decompressed = pako.ungzip(new Uint8Array(buffer), { to: "string" });
                const parsed = JSON.parse(decompressed);
                return (isJSON ? parsed?.payload ?? parsed : parsed) as T;
            } catch (err) {
                console.error("Failed to decompress or parse GZIP response:", err);
                this.snackbarRef.current?.show("Failed to parse compressed server response.", "error");
                return null;
            }
        }

        if (isJSON && contentType.includes("application/json")) {
            const res = await response.json();
            return (res?.payload ?? res) as T;
        }

        const text = await response.text();
        return text as T;
    }

    private async handleError(response: Response): Promise<void> {
        const ref = this.snackbarRef.current;
        let message = "";

        try {
            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                const errorData = await response.json();
                message =
                    errorData?.message ||
                    errorData?.detail ||
                    errorData?.error ||
                    errorData?.payload?.message ||
                    "";
            } else {
                message = await response.text();
            }
        } catch {
            message = "";
        }

        switch (response.status) {
            case 400:
                ref?.show(message || "Bad Request. Please check your input.", "error");
                break;
            case 401:
                ref?.show(message || "Unauthorized. Please login again.", "error");
                break;
            case 403:
                ref?.show(message || "Forbidden. You do not have permission.", "error");
                break;
            case 404:
                ref?.show(message || "Requested resource not found.", "error");
                break;
            case 405:
                ref?.show(message || "Method not allowed for this endpoint.", "error");
                break;
            case 500:
                ref?.show(message || "Server error. Please contact admin.", "error");
                break;
            default:
                ref?.show(message || `Unexpected error: ${response.status}`, "error");
                break;
        }
    }
}