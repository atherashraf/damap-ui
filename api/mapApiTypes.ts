export interface LayerPKColsResponse {
    pkCols: string[]; // The actual list of primary key column names
    meta: {
        uuid: string;
        count: number;
    };
}

export interface UpdateFeatureResponse {
    "status": string,
    "message": string,
    "rows_affected": number
}


export interface DeleteFeaturesResponse {
    "status": string;
    "rows_affected": number;
    "cache_cleared": boolean;
}

export interface BulkUpdateLayerAttributeRequest {
    pk_objects: Record<string, any>[];
    column: string;
    value: any;
}

export interface BulkUpdateLayerAttributeResponse {
    status: "success" | "error";
    message: string;
    rows_affected: number;
    pk_count: number;
    cache_cleared: boolean;
    cleared_tiles?: number;
}
