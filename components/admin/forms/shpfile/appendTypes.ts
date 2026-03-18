export interface IGroupedShapeRow {
    name: string;
    files: File[];
    shp?: number;
    shx?: number;
    dbf?: number;
    prj?: number;
}

export interface IPreviewAppendPayload {
    upload_id: string;
    source: {
        columns: string[];
        geometry_column: string;
        geometry_type?: string;
        crs?: string | null;
        epsg?: number | null;
    };
    target: {
        schema: string;
        table: string;
        columns: Array<{
            name: string;
            type: string;
            nullable: boolean;
            default: string | null;
        }>;
        column_names: string[];
        geometry_column?: string | null;
        geometry_type?: string | null;
        srid?: number | null;
    };
    auto_mapping: Record<string, string>;
    unmatched_source_columns: string[];
    missing_target_columns: string[];
    missing_required_target_columns: string[];
    droppable_source_columns: string[];
    crs_match: boolean;
    can_reproject: boolean;
    geometry_compatible: boolean;
    geometry_promotion_needed: boolean;
    append_possible_after_mapping: boolean;
    warnings: string[];
}

export interface ICommitAppendPayload {
    msg: string;
    upload_id: string;
    target_table: string;
    appended_rows: number;
    mapping_used: Record<string, string>;
    dropped_source_columns: string[];
}