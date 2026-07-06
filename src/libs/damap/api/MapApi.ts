/***
 await api.get(MapAPIs.DCH_LAYER_INFO, { uuid });

 await api.post(MapAPIs.DCH_SAVE_MAP, mapData);

 await api.put(MapAPIs.DCH_UPDATE_MAP, mapData, { uuid: mapUUID });

 await api.patch(MapAPIs.DCH_EDIT_MODEL_ROW, partialData, { modelName: "LayerInfo" });

 await api.delete(MapAPIs.DCH_DELETE_LAYER_INFO, null, { uuid });

 await api.postFormData(MapAPIs.DCH_UPLOAD_SHP_FILE, formData);
 ***/
import { RefObject } from "react";
import { DASnackbarHandle } from "@damap/components/base/DASnackbar";
import { AuthServices } from "@damap/damap";
import pako from "pako";
import { getDamapConfig } from "@damap/config";



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
    DCH_SAVE_SLD: "api/dch/upload_sld_style/{uuid}/{map_uuid}/",
    DCH_GET_STYLE: "api/dch/get_style/{uuid}/{map_uuid}/",
    DCH_LAYER_VISIBILITY_ZOOM: "api/dch/update_layer_visibility_zoom/{uuid}/",
    DCH_LAYER_FIELDS: "api/dch/layer_fields/{uuid}/",
    DCH_LAYER_ATTRIBUTES: "api/dch/layer_attributes/{uuid}/",
    DCH_LAYER_SELECT: "api/dch/spatial_select/{uuid}/",
    DCH_LAYER_PKCOLS: "api/dch/layer_pk_cols/{uuid}/",

    DCH_GEE_LAYER: "api/gee/gee_layer/{layer_type}/",
    DCH_GEE_LAYER_LEGEND: "api/gee/gee_layer_legend/{layer_type}/",
    DCH_GEE_FORECAST_LAYER: "api/gee/gfs_forecast_layer/",

    DCH_LAYER_FIELD_DISTINCT_VALUE: "api/dch/layer_field_distinct_values/{uuid}/{field_name}/{field_type}/",
    DCH_MAP_INFO: "api/dch/get_map_info/{uuid}/",
    DCH_MAP_UUID: "api/dch/get_map_info/{layer_title}/",
    DCH_ALL_MAP_INFO: "api/dch/all_map_info/",
    DCH_LAYER_PIXEL_VALUE: "api/dch/get_pixel_value/{uuid}/{long}/{lat}/",
    DCH_FEATURE_DETAIL: "api/dch/get_feature_detail/{uuid}/{col_name}/{col_val}/",
    DCH_RASTER_AREA: "api/dch/get_raster_area/{uuid}/{geojson_str}/",
    DCH_GET_ALL_LAYERS: "api/dch/get_all_layers/",
    DCH_GET_APPLICATION_URL: "api/dch/get_application_url/{url_type}/",

    DCH_RASTER_DETAIL: "api/dch/get_raster_info/{uuid}/",
    DCH_RASTER_PIXEL_VALUE: "api/dch/raster_pixel/{uuid}",

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


    DCH_DOWNLOAD_ROWS_GEOMETRY: "api/dch/admin/download_geometry/{uuid}/",
    DCH_UPLOAD_ROW_GEOMETRY: "api/dch/admin/upload_geometry/{uuid}/",

    DCH_UPLOAD_SHP_FILE: "api/dch/admin/upload_shp_file/",
    DCH_PREVIEW_APPEND_SHP: "api/dch/admin/preview_append_shp/",
    DCH_COMMIT_APPEND_SHP: "api/dch/admin/commit_append_shp/",
    DCH_SAVE_DB_LAYER_INFO: "api/dch/admin/save_db_layer_info/{db_id}/{table_name}/{layer_category_id}/",
    DCH_COLUMN_VALUE: "api/dch/column_value/{uuid}/{pk_val}/{col_name}/",
    DCH_NAVIGATION_LIST: "api/dch/navigation_list/{map_uuid}/",
    DCH_NAVIGATION_GEOMETRY: "api/dch/navigation_geometry/{map_uuid}/{selected_key}/{node_id}/",
    DCH_UPDATE_LAYER_ATTRIBUTE: "api/dch/admin/update_layer_attributes/{uuid}/",
    DCH_BULK_UPDATE_LAYER_FIELD_VALUE: "api/dch/bulk/bulk_update_layer_field_value/{uuid}/",
    DCH_DELETE_LAYER_FEATURES: "api/dch/admin/delete_layer_features/{uuid}/",

    DCH_ADMIN_LAYER_INFO_EDIT: "admin/layer-info/edit/{id}/",


    DCH_ADD_URL_LAYER_INFO: "/api/dch/admin/add_layer_url_info/",
        // "api/dch/admin/add_layer_url_info/{layer_title}/{layer_category_id}/{layer_url}/{url_type}/",
    DCH_ADD_MODEL_ROW: "api/dch/admin/add_model_row/",
    DCH_DB_CONNECTION: "api/dch/admin/get_db_connection/",
    DCH_DB_TABLE_LIST: "api/dch/admin/db_table_list/{db_id}/",
    DCH_ADD_DB_CONNECTION:"api/dch/admin/add-db-connection/",
    DCH_TEST_DB_CONNECTION:"api/dch/admin/test-db-connection/",
    DCH_SAVE_MODEL_DATA: "api/dch/admin/save_model_data/",
    DCH_SAVE_LAYER_INFO: "api/dch/admin/save_layer_info/",
    DCH_SAVE_MAP_INFO: "api/dch/admin/save_map_info/",


    // =========================
    // layer_query router
    // =========================

    /**
     * Get all categories
     *
     * Endpoint:
     * api/dch/layer-query/categories
     *
     * Usage:
     * await api.get(MapAPIs.LAYER_QUERY_CATEGORIES);
     */
    LAYER_QUERY_CATEGORIES: "api/dch/layer-query/categories",

    /**
     * Get flat list of layers with optional filters
     *
     * Endpoint:
     * api/dch/layer-query/layers
     *
     * Query params:
     * - app_label?: string
     * - category_id?: number
     * - data_model?: string
     * - model_type?: string
     * - title?: string
     *
     * Usage:
     * await api.get(MapAPIs.LAYER_QUERY_LAYERS, {
     *   app_label: "dch",
     *   category_id: 1,
     *   data_model: "V",
     *   model_type: "DB",
     *   title: "canal",
     * });
     */
    LAYER_QUERY_LAYERS: "api/dch/layer-query/layers",

    /**
     * Get layer tree
     *
     * Endpoint:
     * api/dch/layer-query/tree
     *
     * Query params:
     * - app_label?: string
     *
     * Usage:
     * await api.get(MapAPIs.LAYER_QUERY_TREE, {
     *   app_label: "dch",
     * });
     */
    LAYER_QUERY_TREE: "api/dch/layer-query/tree",

    /**
     * Get layer metadata by identifier
     *
     * Endpoint:
     * api/dch/layer-query/{identifier}/meta
     *
     * `by` can be:
     * - "uuid"
     * - "layer_name"
     * - "table_name"
     *
     * Usage by uuid:
     * await api.get(MapAPIs.LAYER_QUERY_META, {
     *   identifier: uuid,
     *   by: "uuid",
     * });
     *
     * Usage by layer_name:
     * await api.get(MapAPIs.LAYER_QUERY_META, {
     *   identifier: "canal_layer",
     *   by: "layer_name",
     * });
     *
     * Usage by table_name:
     * await api.get(MapAPIs.LAYER_QUERY_META, {
     *   identifier: "public.canal_layer",
     *   by: "table_name",
     * });
     */
    LAYER_QUERY_META: "api/dch/layer-query/{identifier}/meta",

    /**
     * Get layer fields by identifier
     *
     * Endpoint:
     * api/dch/layer-query/{identifier}/fields
     *
     * `by` can be:
     * - "uuid"
     * - "layer_name"
     * - "table_name"
     *
     * Usage by uuid:
     * await api.get(MapAPIs.LAYER_QUERY_FIELDS, {
     *   identifier: uuid,
     *   by: "uuid",
     * });
     *
     * Usage by layer_name:
     * await api.get(MapAPIs.LAYER_QUERY_FIELDS, {
     *   identifier: "canal_layer",
     *   by: "layer_name",
     * });
     *
     * Usage by table_name:
     * await api.get(MapAPIs.LAYER_QUERY_FIELDS, {
     *   identifier: "public.canal_layer",
     *   by: "table_name",
     * });
     */
    LAYER_QUERY_FIELDS: "api/dch/layer-query/{identifier}/fields",

    /**
     * Get feature detail by PK values
     *
     * Endpoint:
     * api/dch/layer-query/{identifier}/feature-detail
     *
     * Request body:
     * {
     *   pk_values: string[]
     * }
     *
     * `by` can be:
     * - "uuid"
     * - "layer_name"
     * - "table_name"
     *
     * Usage by uuid:
     * await api.post(
     *   MapAPIs.LAYER_QUERY_FEATURE_DETAIL,
     *   { pk_values: ["1"] },
     *   {
     *     identifier: uuid,
     *     by: "uuid",
     *   }
     * );
     *
     * Usage by layer_name:
     * await api.post(
     *   MapAPIs.LAYER_QUERY_FEATURE_DETAIL,
     *   { pk_values: ["1"] },
     *   {
     *     identifier: "canal_layer",
     *     by: "layer_name",
     *   }
     * );
     *
     * Usage by table_name:
     * await api.post(
     *   MapAPIs.LAYER_QUERY_FEATURE_DETAIL,
     *   { pk_values: ["1"] },
     *   {
     *     identifier: "public.canal_layer",
     *     by: "table_name",
     *   }
     * );
     */
    LAYER_QUERY_FEATURE_DETAIL: "api/dch/layer-query/{identifier}/feature-detail",

    /**
     * Get one column value from a row
     *
     * Endpoint:
     * api/dch/layer-query/{identifier}/column-value
     *
     * Request body:
     * {
     *   pk_values: string[],
     *   col_name: string
     * }
     *
     * `by` can be:
     * - "uuid"
     * - "layer_name"
     * - "table_name"
     *
     * Usage by uuid:
     * await api.post(
     *   MapAPIs.LAYER_QUERY_COLUMN_VALUE,
     *   {
     *     pk_values: ["1"],
     *     col_name: "name",
     *   },
     *   {
     *     identifier: uuid,
     *     by: "uuid",
     *   }
     * );
     *
     * Usage by table_name:
     * await api.post(
     *   MapAPIs.LAYER_QUERY_COLUMN_VALUE,
     *   {
     *     pk_values: ["1"],
     *     col_name: "name",
     *   },
     *   {
     *     identifier: "public.canal_layer",
     *     by: "table_name",
     *   }
     * );
     */
    LAYER_QUERY_COLUMN_VALUE: "api/dch/layer-query/{identifier}/column-value",

    /**
     * Update one column value in a row
     *
     * Endpoint:
     * api/dch/layer-query/{identifier}/update-column-value
     *
     * Request body:
     * {
     *   pk_values: string[],
     *   col_name: string,
     *   value: any
     * }
     *
     * `by` can be:
     * - "uuid"
     * - "layer_name"
     * - "table_name"
     *
     * Usage by uuid:
     * await api.post(
     *   MapAPIs.LAYER_QUERY_UPDATE_COLUMN_VALUE,
     *   {
     *     pk_values: ["1"],
     *     col_name: "name",
     *     value: "Updated Name",
     *   },
     *   {
     *     identifier: uuid,
     *     by: "uuid",
     *   }
     * );
     *
     * Usage by layer_name:
     * await api.post(
     *   MapAPIs.LAYER_QUERY_UPDATE_COLUMN_VALUE,
     *   {
     *     pk_values: ["1"],
     *     col_name: "name",
     *     value: "Updated Name",
     *   },
     *   {
     *     identifier: "canal_layer",
     *     by: "layer_name",
     *   }
     * );
     *
     * Usage by table_name:
     * await api.post(
     *   MapAPIs.LAYER_QUERY_UPDATE_COLUMN_VALUE,
     *   {
     *     pk_values: ["1"],
     *     col_name: "name",
     *     value: "Updated Name",
     *   },
     *   {
     *     identifier: "public.canal_layer",
     *     by: "table_name",
     *   }
     * );
     */
    LAYER_QUERY_UPDATE_COLUMN_VALUE: "api/dch/layer-query/{identifier}/update-column-value",

    /**
     * Get distinct values for dropdowns / filters
     *
     * Endpoint:
     * api/dch/layer-query/{identifier}/distinct-values
     *
     * Query params:
     * - by?: "uuid" | "layer_name" | "table_name"
     * - col_name: string
     * - where_clause?: string
     * - limit?: number
     *
     * Notes:
     * - `where_clause` can be used for dependent dropdowns
     *   e.g. tehsil filtered by district:
     *   where_clause: "dist_id = 1"
     * - `limit` defaults to 500
     *
     * Usage by uuid:
     * await api.get(MapAPIs.LAYER_QUERY_DISTINCT_VALUES, {
     *   identifier: uuid,
     *   by: "uuid",
     *   col_name: "status",
     * });
     *
     * Usage by layer_name:
     * await api.get(MapAPIs.LAYER_QUERY_DISTINCT_VALUES, {
     *   identifier: "canal_layer",
     *   by: "layer_name",
     *   col_name: "status",
     *   limit: 1000,
     * });
     *
     * Usage by table_name:
     * await api.get(MapAPIs.LAYER_QUERY_DISTINCT_VALUES, {
     *   identifier: "public.canal_layer",
     *   by: "table_name",
     *   col_name: "status",
     * });
     *
     * Usage with dependent filter:
     * await api.get(MapAPIs.LAYER_QUERY_DISTINCT_VALUES, {
     *   identifier: "tehsil",
     *   by: "layer_name",
     *   col_name: "tehsil_name",
     *   where_clause: "dist_id = 1",
     * });
     */
    LAYER_QUERY_DISTINCT_VALUES: "api/dch/layer-query/{identifier}/distinct-values",

    /**
     * Get attribute rows for a layer
     *
     * Endpoint:
     * api/dch/layer-query/{identifier}/attributes
     *
     * Query params:
     * - by?: "uuid" | "layer_name" | "table_name"
     * - cols?: string[]        // repeat param, e.g. cols=id&cols=name
     * - where_clause?: string
     * - limit?: number
     * - offset?: number
     *
     * Notes:
     * - `limit = -1` means return all matching rows
     * - `where_clause` can be used for dependent filtering
     * - `offset` defaults to 0
     *
     * Usage by uuid:
     * await api.get(MapAPIs.LAYER_QUERY_ATTRIBUTES, {
     *   identifier: uuid,
     *   by: "uuid",
     *   limit: -1,
     * });
     *
     * Usage by layer_name:
     * await api.get(MapAPIs.LAYER_QUERY_ATTRIBUTES, {
     *   identifier: "tehsil",
     *   by: "layer_name",
     *   where_clause: "dist_id = 1",
     *   limit: -1,
     * });
     *
     * Usage by table_name with selected columns:
     * await api.get(MapAPIs.LAYER_QUERY_ATTRIBUTES, {
     *   identifier: "public.tehsil",
     *   by: "table_name",
     *   cols: ["id", "tehsil_name"],
     *   where_clause: "dist_id = 1",
     *   limit: 100,
     *   offset: 0,
     * });
     */
    LAYER_QUERY_ATTRIBUTES: "api/dch/layer-query/{identifier}/attributes",

    LAYER_QUERY_FEATURE_EXTENT: "api/dch/layer-query/{identifier}/feature-extent",
    LAYER_QUERY_FEATURE_GEOJSON: "api/dch/layer-query/{identifier}/feature-geojson",
    // WATER_QUALITY_DATA: "api/lbdc/water_quality_data/",
    /** test apis **/
    // LBDC_AOI: "api/lbdc/lbdc_aoi/",
    // FF_FLOW_NETWORK_GRAPH: "api/ff/flow_network_graph/",

    // LBDC_DISCHARGE:"https://irrigation.punjab.gov.pk/admin/api/fetch_LBDC_Discharge.php?"

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

    static getBaseURL(api: string): string {
        const isAbsoluteUrl = /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(api);
        const { mapUrl, mapPort } = getDamapConfig();

        let API_URL = mapUrl || import.meta.env.VITE_MAP_URL || import.meta.env.VITE_API_URL;
        const API_PORT = mapPort || import.meta.env.VITE_MAP_PORT;
        const API_ENDPOINT = "";

        if (!isAbsoluteUrl) {
            const hostname = window.location.hostname;
            const isDNS = !/^[0-9.]+$/.test(hostname);

            if (!API_URL) {
                API_URL = `${window.location.protocol}//${hostname}`;

                if ((!isDNS || hostname === "localhost") && API_PORT) {
                    API_URL += `:${API_PORT}`;
                }
            }
        }

        return isAbsoluteUrl
            ? api
            : `${API_URL?.endsWith("/") ? API_URL.slice(0, -1) : API_URL}${API_ENDPOINT}/${api.startsWith("/") ? api.slice(1) : api}`;
    }

    static applyParamsToURL(urlBase: string, params: Record<string, unknown> = {}): string {
        let url = urlBase;

        if (!params || Object.keys(params).length === 0) {
            return url;
        }

        const queryParams: string[] = [];

        for (const key in params) {
            const value = params[key];

            if (value === undefined || value === null) continue;

            if (url.includes(`{${key}}`)) {
                url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
                continue;
            }

            if (Array.isArray(value)) {
                for (const item of value) {
                    if (item === undefined || item === null) continue;

                    queryParams.push(
                        `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`
                    );
                }
                continue;
            }

            queryParams.push(
                `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
            );
        }

        if (queryParams.length > 0) {
            url += `${url.includes("?") ? "&" : "?"}${queryParams.join("&")}`;
        }

        return url;
    }

    static getURL(api: string, params: Record<string, unknown> = {}): string {
        const urlBase = this.getBaseURL(api);
        return this.applyParamsToURL(urlBase, params);
    }

    // static getURL(api: string, params: Record<string, unknown> = {}): string {
    //     const isAbsoluteUrl = /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(api);
    //     const { mapUrl, mapPort } = getDamapConfig();
    //
    //     let API_URL = mapUrl || import.meta.env.VITE_MAP_URL || import.meta.env.VITE_API_URL;
    //     const API_PORT = mapPort || import.meta.env.VITE_MAP_PORT;
    //     const API_ENDPOINT = "";
    //
    //     if (!isAbsoluteUrl) {
    //         const hostname = window.location.hostname;
    //         const isDNS = !/^[0-9.]+$/.test(hostname);
    //
    //         if (!API_URL) {
    //             API_URL = `${window.location.protocol}//${hostname}`;
    //             if ((!isDNS || hostname === "localhost") && API_PORT) {
    //                 API_URL += `:${API_PORT}`;
    //             }
    //         }
    //     }
    //
    //     const urlBase = isAbsoluteUrl
    //         ? api
    //         : `${API_URL?.endsWith("/") ? API_URL.slice(0, -1) : API_URL}${API_ENDPOINT}/${api.startsWith("/") ? api.slice(1) : api}`;
    //     let url = urlBase;
    //
    //     if (params && Object.keys(params).length > 0) {
    //         const queryParams: string[] = [];
    //
    //         for (const key in params) {
    //             const value = params[key];
    //
    //             if (value === undefined || value === null) continue;
    //
    //             if (url.includes(`{${key}}`)) {
    //                 url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    //                 continue;
    //             }
    //
    //             if (Array.isArray(value)) {
    //                 for (const item of value) {
    //                     if (item === undefined || item === null) continue;
    //
    //                     queryParams.push(
    //                         `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`
    //                     );
    //                 }
    //                 continue;
    //             }
    //
    //             queryParams.push(
    //                 `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    //             );
    //         }
    //
    //         if (queryParams.length > 0) {
    //             url += `${url.includes("?") ? "&" : "?"}${queryParams.join("&")}`;
    //         }
    //     }
    //
    //     return url;
    // }


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
        let message ;

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
                window.location.href = "/login";
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
        console.error("DA Error Message", response.status, message, new Error().stack);
    }
}
