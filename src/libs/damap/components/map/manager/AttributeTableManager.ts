import * as React from "react";
import {WKT} from "ol/format";
import {Feature} from "ol";
import {Geometry} from "ol/geom";
import {MapAPIs} from "@damap/api/MapApi";
import {Column, Filter, Row} from "@damap/types/gridTypeDeclaration";
import WMSLayer from "@damap/components/map/layers/overlay_layers/WMSLayer";
import {
    AttributeTableToolbarHandle, AuthServices, MapApi,
    MapVM,
    ToolbarEntry,
    ToolbarSlot,
} from "@/libs/damap";
import {AttributeTableRequest} from "@damap/types/typeDeclarations";
import AttributeFieldSelectorForm from "@damap/components/map/table/forms/AttributeFieldSelectorForm";
import GeometryUploadForm from "@damap/components/map/table/forms/GeometryUploadForm";

type LayerAttributesPayload = {
    columns: Column[];
    rows: Row[];
    pkCols: string[];
};

type AttributeTableState = {
    selectedRowKeys: string[];
    scrollTop: number;
    visibleColumnIds?: string[] | null;
    isFieldSelectorOpen?: boolean;
};

export default class AttributeTableManager {
    private mapVM: MapVM;
    public tableHeight: number = 250;
    public toolbarHeight: number = 60;
    private tableRequest: AttributeTableRequest | undefined;
    private isCustomTable: boolean = false;
    private attributeTableSelectedRowKeys: string[] = [];
    private attributeTableScrollTop: number = 0;
    private tableLayerUUID?: string;

    private fieldSelectionListeners = new Set<
        (payload: { visibleColumnIds: string[] | null; isFieldSelectorOpen: boolean }) => void
    >();
    private visibleColumnIds: string[] | null = null; // null means show all
    private isFieldSelectorOpen: boolean = false;

    private selectionListeners = new Set<(keys: string[]) => void>();

    constructor(mapVM: MapVM) {
        this.mapVM = mapVM;
    }

    getMapVM(): MapVM {
        return this.mapVM;
    }
    getTableLayerUUID(): string | undefined {
        return this.tableLayerUUID;
    }

    setTableLayerUUID(uuid?: string) {
        this.tableLayerUUID = uuid;
    }

    clearTableContext() {
        this.tableRequest = undefined;
        this.tableLayerUUID = undefined;
        this.setSelectedRowKeys([]);
        this.attributeTableScrollTop = 0;
        this.visibleColumnIds = null;
        this.isFieldSelectorOpen = false;
    }

    get columns(): Column[] {
        return this.tableRequest?.columns || [];
    }

    get data(): Row[] {
        return this.tableRequest?.rows || [];
    }

    get pkCols(): string[] {
        return this.tableRequest?.pkCols || [];
    }

    get isEditable(): boolean {
        return this.mapVM.dmlManager.isEditingAllowed;
    }

    getAttributeTableToolbarHandle(): AttributeTableToolbarHandle | null {
        return this.mapVM.getAttributeTableToolbarRef().current;
    }

    getTableRequest(): AttributeTableRequest | undefined {
        return this.tableRequest;
    }

    setTableRequest(request: AttributeTableRequest | undefined) {
        this.tableRequest = request;
    }

    clearTableRequest() {
        this.clearTableContext();
    }

    hasTable(): boolean {
        return !!this.tableRequest;
    }

    setTableHeight(height: number) {
        this.tableHeight = height;
        if (this.tableRequest) {
            this.tableRequest = {
                ...this.tableRequest,
                tableHeight: height,
            };
        }
    }

    getTableHeight() {
        return this.tableHeight;
    }

    subscribeSelection(listener: (keys: string[]) => void) {
        this.selectionListeners.add(listener);
        listener([...this.attributeTableSelectedRowKeys]);

        return () => {
            this.selectionListeners.delete(listener);
        };
    }

    private emitSelectionChange() {
        const keys = [...this.attributeTableSelectedRowKeys];
        this.selectionListeners.forEach((listener) => listener(keys));
    }

    getRowPKKey(row: Row, pkCols?: string[]): string {
        const effectivePkCols = pkCols?.length
            ? pkCols
            : this.pkCols?.length
                ? this.pkCols
                : ["rowId"];

        return effectivePkCols.map((col) => String(row[col])).join("__");
    }

    getRowPKObject(row: Row, pkCols?: string[]): Record<string, any> {
        const effectivePkCols = pkCols?.length
            ? pkCols
            : this.pkCols?.length
                ? this.pkCols
                : ["rowId"];

        const pkObject: Record<string, any> = {};

        effectivePkCols.forEach((col) => {
            pkObject[col] = row[col];
        });

        return pkObject;
    }

    normalizeValue(value: any, type: Column["type"]) {
        if (value === "" || value === undefined || value === null) return null;

        switch (type) {
            case "number":
                return Number(value);
            case "date":
                return value instanceof Date ? value.toISOString() : value;
            case "string":
            default:
                return String(value);
        }
    }

    applyFilters(rows: Row[], filters: Filter[]): Row[] {
        if (!filters?.length) return rows;

        return rows.filter((row) =>
            filters.every((filter) => {
                const rowVal = row[filter.key];
                const filterVal = filter.value;

                if (typeof filterVal === "string") {
                    return String(rowVal ?? "")
                        .toLowerCase()
                        .includes(filterVal.toLowerCase());
                }

                if (Array.isArray(filterVal) && filterVal.length === 2) {
                    const [min, max] = filterVal as any[];

                    if (min instanceof Date || max instanceof Date) {
                        const rowTime = rowVal ? new Date(rowVal).getTime() : NaN;
                        const minTime = min
                            ? new Date(min).getTime()
                            : Number.NEGATIVE_INFINITY;
                        const maxTime = max
                            ? new Date(max).getTime()
                            : Number.POSITIVE_INFINITY;

                        return rowTime >= minTime && rowTime <= maxTime;
                    }

                    return rowVal >= min && rowVal <= max;
                }

                return true;
            })
        );
    }

    async open(tableHeight = this.tableHeight) {
        this.setTableHeight(tableHeight);

        const uuid = this.mapVM.getLayerOfInterest(); // ✅ FIX
        if (!uuid) {
            this.mapVM.showSnackbar("Please select a layer to view its attributes");
            return;
        }

        this.tableLayerUUID = uuid;

        const drawerRef = this.mapVM.getBottomDrawerRef().current;
        if (!drawerRef) return;

        if (drawerRef.isOpen()) {
            if (drawerRef.isHidden?.()) {
                drawerRef.unhideDrawer();
            }
            return;
        }

        if (this.mapVM.isDALayerExists(uuid)) {
            await this.openDALayerTable(uuid);
            return;
        }

        if (this.mapVM.isOverlayLayerExist(uuid)) {
            this.openOverlayLayerTable(uuid);
        }
    }

    async refresh() {
        if (this.isCustomTable) {
            this.mapVM.showSnackbar(
                "Refresh is not available for custom attribute tables",
                "info",
                2000
            );
            return;
        }

        const bottomDrawerRef = this.mapVM.getBottomDrawerRef().current;
        if (
            !bottomDrawerRef ||
            !bottomDrawerRef.isOpen() ||
            bottomDrawerRef.isHidden?.()
        ) {
            return;
        }

        const uuid = this.tableLayerUUID;
        if (!uuid) return;

        try {
            this.mapVM.getMapLoadingRef().current?.openIsLoading();

            if (this.mapVM.isDALayerExists(uuid)) {
                const request = await this.loadDALayerTableRequest(uuid);
                if (request) {
                    this.tableRequest = request;
                    this.presentAttributeTable();
                } else {
                    this.mapVM.showSnackbar("No attribute found", "error");
                }
                return;
            }

            if (this.mapVM.isOverlayLayerExist(uuid)) {
                this.openOverlayLayerTable(uuid);
                return;
            }
        } catch (err) {
            console.error("Refresh Table Error:", err);
            this.mapVM.showSnackbar("Failed to sync attribute table", "error");
        } finally {
            this.mapVM.getMapLoadingRef().current?.closeIsLoading();
        }
    }

    reopen() {
        this.presentAttributeTable();
    }

    getSelectedRows(): Row[] {
        if (!this.tableRequest?.rows?.length) return [];

        const selectedSet = new Set(this.attributeTableSelectedRowKeys);
        return this.tableRequest.rows.filter((row) =>
            selectedSet.has(this.getRowPKKey(row))
        );
    }

    async selectRow(row: Row, pkCols?: string[]) {
        const uuid = this.tableLayerUUID;
        const rowKey = this.getRowPKKey(row, pkCols);
        const selectionLayer = this.mapVM.getSelectionLayer();

        if (!row["geom"] && uuid && this.mapVM.isDALayerExists(uuid)) {
            try {
                this.mapVM.getMapLoadingRef().current?.openIsLoading();

                const payload = await this.mapVM.getApi().get(
                    MapAPIs.DCH_GET_FEATURE_GEOMETRY,
                    {uuid, pk_values: rowKey}
                );

                selectionLayer?.addWKT2Selection(payload);
                (row as any)["geom"] = payload;
            } finally {
                this.mapVM.getMapLoadingRef().current?.closeIsLoading();
            }
            return;
        }

        if (uuid && this.mapVM.isOverlayLayerExist(uuid)) {
            const geom = row["geometry"];
            if (geom) {
                selectionLayer?.addWKT2Selection(
                    new WKT().writeGeometry(geom),
                    true
                );
            }
            return;
        }

        if (row["geom"]) {
            selectionLayer?.addWKT2Selection(row["geom"]);
        }
    }

    zoomToSelection() {
        this.mapVM.getSelectionLayer()?.zoomToSelection();
    }

    clearSelection() {
        this.mapVM.getSelectionLayer()?.clearSelection();
        this.setSelectedRowKeys([]);
    }

    async saveRow(
        originalRow: Row,
        tempRowData: Row,
        columns: Column[],
        pkCols: string[]
    ): Promise<boolean> {
        const layerUuid = this.tableLayerUUID;
        if(!layerUuid) return false;
        const effectivePkCols = pkCols?.length ? pkCols : this.pkCols;
        const pkVal = this.getRowPKObject(originalRow, effectivePkCols);
        const editableCols = columns.filter(
            (col) => !effectivePkCols.includes(col.id)
        );

        let changed = false;
        const updatedRow: Row = {...originalRow};

        for (const col of editableCols) {
            const oldVal = this.normalizeValue(originalRow[col.id], col.type);
            const newVal = this.normalizeValue(tempRowData[col.id], col.type);

            if (newVal !== oldVal) {
                const success = await this.mapVM.dmlManager.updateAttributes(
                    layerUuid,
                    pkVal,
                    col.id,
                    newVal
                );

                if (success) {
                    updatedRow[col.id] = newVal;
                    changed = true;
                }
            }
        }

        if (changed) {
            this.syncLocalRow(updatedRow, effectivePkCols);
            this.mapVM.showSnackbar("Row updated", "success");
        }

        return changed;
    }

    async deleteRow(row: Row, pkCols: string[]): Promise<boolean> {
        const effectivePkCols = pkCols?.length ? pkCols : ["rowId"];
        const pkObject: Record<string, any> = {};

        effectivePkCols.forEach((col) => {
            pkObject[col] = row[col];
        });
        if (this.tableLayerUUID) {
            const success = await this.mapVM.dmlManager.deleteFeatures(
                this.tableLayerUUID,
                [pkObject]
            );


            if (success) {
                const deletedKey = this.getRowPKKey(row, effectivePkCols);
                this.setSelectedRowKeys(
                    this.getSelectedRowKeys().filter((key) => key !== deletedKey)
                );
                this.removeLocalRow(row, effectivePkCols);
                await this.syncSelectionLayerFromSelectedRows(effectivePkCols);
            }

            return success;
        }
        return false
    }

    exportCsv(columns: Column[], rows: Row[], fileName = "attribute_data.csv") {
        const header = columns.map((col) => `"${col.label}"`).join(",") + "\n";
        const body = rows
            .map((row) =>
                columns
                    .map((col) => {
                        const value = row[col.id] ?? "";
                        return `"${String(value).replace(/"/g, '""')}"`;
                    })
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([header + body], {type: "text/csv"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    openCustomAttributeTable(args: {
        columns: Column[];
        rows: Row[];
        pkCols?: string[];
        tableHeight?: number;
    }) {
        const {columns, rows, pkCols, tableHeight} = args;
        const effectivePkCols = pkCols?.length ? pkCols : ["rowId"];
        const effectiveTableHeight = tableHeight ?? this.tableHeight;

        const safeRows: Row[] = rows.map((row: any) => ({
            rowId: row.rowId ?? MapVM.generateUUID(),
            ...row,
        }));

        this.setTableHeight(effectiveTableHeight);
        this.isCustomTable = true;
        this.tableLayerUUID = undefined;
        this.setSelectedRowKeys([]);

        this.tableRequest = {
            columns,
            rows: safeRows,
            pkCols: effectivePkCols,
            tableHeight: effectiveTableHeight,
        };
        this.visibleColumnIds = null;
        this.isFieldSelectorOpen = false;
        this.presentAttributeTable();
    }

    private async loadDALayerTableRequest(
        uuid: string
    ): Promise<AttributeTableRequest | null> {
        const extent = this.mapVM.getExtentConstraint?.();

        const payload: LayerAttributesPayload | null = await this.mapVM
            .getApi()
            .get(MapAPIs.DCH_LAYER_ATTRIBUTES, {
                uuid,
                ...(extent ? { extent_3857: extent.join(",") } : {}),
            });

        if (!payload) return null;

        return {
            columns: payload.columns,
            rows: payload.rows,
            pkCols: payload.pkCols?.length ? payload.pkCols : ["rowId"],
            tableHeight: this.tableHeight,
        };
    }

    private presentAttributeTable = () => {
        const bottomDrawerRef = this.mapVM.getBottomDrawerRef().current;
        if (!bottomDrawerRef || !this.tableRequest) return;

        bottomDrawerRef.setAttributeTable(this.tableRequest, this.toolbarHeight);

        setTimeout(() => {
            window.dispatchEvent(
                new CustomEvent("attribute-table-opened", {
                    detail: {
                        mapVM: this.mapVM,
                        tableManager: this,
                    },
                })
            )
        }, 1000)
    };

    private syncLocalRow(updatedRow: Row, pkCols: string[]) {
        if (!this.tableRequest?.rows?.length) return;

        const targetKey = this.getRowPKKey(updatedRow, pkCols);
        const index = this.tableRequest.rows.findIndex(
            (row) => this.getRowPKKey(row, pkCols) === targetKey
        );

        if (index >= 0) {
            this.tableRequest.rows[index] = {
                ...this.tableRequest.rows[index],
                ...updatedRow,
            };
        }
    }

    private removeLocalRow(rowToRemove: Row, pkCols: string[]) {
        if (!this.tableRequest?.rows?.length) return;

        const targetKey = this.getRowPKKey(rowToRemove, pkCols);
        this.tableRequest.rows = this.tableRequest.rows.filter(
            (row) => this.getRowPKKey(row, pkCols) !== targetKey
        );
    }

    private async openDALayerTable(uuid: string) {
        try {
            this.mapVM.getMapLoadingRef().current?.openIsLoading();
            this.tableLayerUUID = uuid;
            const request = await this.loadDALayerTableRequest(uuid);
            if (request) {
                this.isCustomTable = false;
                this.tableRequest = request;
                this.setSelectedRowKeys([]);
                this.visibleColumnIds = null;
                this.isFieldSelectorOpen = false;
                this.presentAttributeTable();
            } else {
                this.mapVM.showSnackbar("No attribute found", "warning");
            }
        } catch (err: any) {
            console.error(err);
            this.mapVM.showSnackbar(err?.message || "No attribute found", "warning");
        } finally {
            this.mapVM.getMapLoadingRef().current?.closeIsLoading();
        }
    }

    private static OVERLAY_TABLE_EXCLUDED_KEYS = new Set(["geometry"]);
    private static OVERLAY_TABLE_LOCATION_KEYS = ["City", "Town", "Subdivision"];

    private orderOverlayColumnKeys(keys: string[]): string[] {
        const excluded = AttributeTableManager.OVERLAY_TABLE_EXCLUDED_KEYS;
        const locationKeys = AttributeTableManager.OVERLAY_TABLE_LOCATION_KEYS;
        const filtered = keys.filter((key) => !excluded.has(key));
        const presentLocationKeys = locationKeys.filter((key) => filtered.includes(key));
        const nonLocationKeys = filtered.filter((key) => !locationKeys.includes(key));

        if (!presentLocationKeys.length) {
            return nonLocationKeys;
        }

        const proposalIndex = nonLocationKeys.indexOf("proposal_id");
        if (proposalIndex >= 0) {
            return [
                ...nonLocationKeys.slice(0, proposalIndex + 1),
                ...presentLocationKeys,
                ...nonLocationKeys.slice(proposalIndex + 1),
            ];
        }

        return [...nonLocationKeys, ...presentLocationKeys];
    }

    private buildOverlayColumns(
        features: Feature<Geometry>[],
        orderedKeys: string[]
    ): Column[] {
        return orderedKeys.map((key) => {
            const sampleValue = features
                .map((feature) => feature.getProperties()?.[key])
                .find((value) => value !== undefined && value !== null);

            return {
                disablePadding: false,
                id: key,
                label: key,
                type: this.resolveColumnType(sampleValue),
            };
        });
    }

    private openOverlayLayerTable(uuid: string) {
        const overlayLayer = this.mapVM.getOverlayLayer(uuid);

        if (overlayLayer instanceof WMSLayer) {
            this.mapVM.showSnackbar(
                "Attribute Table is not supported for WMS layers. Use Identify instead.",
                "info",
                5000
            );
            return;
        }
        this.tableLayerUUID = uuid;
        const features = overlayLayer?.getFeatures?.() || [];
        const columnKeySet = new Set<string>();

        features.forEach((feature: Feature<Geometry>) => {
            Object.keys(feature.getProperties()).forEach((key) => {
                columnKeySet.add(key);
            });
        });

        const orderedKeys = this.orderOverlayColumnKeys([...columnKeySet]);
        const columns = this.buildOverlayColumns(features, orderedKeys);
        const rows: Row[] = [];

        features.forEach((feature: Feature<Geometry>, index: number) => {
            const properties = feature.getProperties();

            rows.push({
                rowId: Number(feature.getId() ?? index + 1),
                ...properties,
            });
        });

        this.isCustomTable = false;
        this.setSelectedRowKeys([]);
        const filteredRows = this.filterRowsByExtentConstraint(rows);

        this.tableRequest = {
            columns,
            rows: filteredRows,
            pkCols: ["rowId"],
            tableHeight: this.tableHeight,
        };
        this.visibleColumnIds = null;
        this.isFieldSelectorOpen = false;
        this.presentAttributeTable();
    }

    addAttributeToolbarButton(entry: ToolbarEntry) {
        const toolbar = this.getAttributeTableToolbarHandle();
        if (!toolbar) return;

        return toolbar.addAction(entry);
    }

    clearAttributeToolbarButtons(slot?: ToolbarSlot) {
        this.getAttributeTableToolbarHandle()?.clear(slot);
    }

    setAttributeTableState(state: {
        selectedRowKeys?: string[];
        scrollTop?: number;
        visibleColumnIds?: string[] | null;
        isFieldSelectorOpen?: boolean;
    }) {
        let shouldEmitFieldSelection = false;

        if ("selectedRowKeys" in state) {
            this.setSelectedRowKeys(state.selectedRowKeys || []);
        }

        if ("scrollTop" in state) {
            this.attributeTableScrollTop = state.scrollTop ?? 0;
        }

        if ("visibleColumnIds" in state) {
            this.visibleColumnIds = state.visibleColumnIds?.length
                ? [...state.visibleColumnIds]
                : null;
            shouldEmitFieldSelection = true;
        }

        if ("isFieldSelectorOpen" in state) {
            this.isFieldSelectorOpen = !!state.isFieldSelectorOpen;
            shouldEmitFieldSelection = true;
        }

        if (shouldEmitFieldSelection) {
            this.emitFieldSelectionChange();
        }
    }

    getAttributeTableState(): AttributeTableState {
        return {
            selectedRowKeys: this.attributeTableSelectedRowKeys,
            scrollTop: this.attributeTableScrollTop,
            visibleColumnIds: this.visibleColumnIds ? [...this.visibleColumnIds] : null,
            isFieldSelectorOpen: this.isFieldSelectorOpen,
        };
    }

    getSelectedRowKeys(): string[] {
        return [...this.attributeTableSelectedRowKeys];
    }

    setSelectedRowKeys(keys: string[]) {
        this.attributeTableSelectedRowKeys = [...keys];
        this.emitSelectionChange();
    }

    isRowSelected(row: Row, pkCols?: string[]): boolean {
        return this.attributeTableSelectedRowKeys.includes(
            this.getRowPKKey(row, pkCols)
        );
    }

    toggleRowSelection(row: Row, pkCols?: string[]) {
        const rowKey = this.getRowPKKey(row, pkCols);
        const current = new Set(this.attributeTableSelectedRowKeys);

        if (current.has(rowKey)) {
            current.delete(rowKey);
        } else {
            current.add(rowKey);
        }

        this.attributeTableSelectedRowKeys = Array.from(current);
        this.emitSelectionChange();
    }

    selectAllRows(rows?: Row[], pkCols?: string[]) {
        const sourceRows = rows ?? this.tableRequest?.rows ?? [];
        this.setSelectedRowKeys(
            sourceRows.map((row) => this.getRowPKKey(row, pkCols))
        );
    }

    async syncSelectionLayerFromSelectedRows(pkCols?: string[]) {
        const selectionLayer = this.mapVM.getSelectionLayer();
        const uuid = this.tableLayerUUID

        selectionLayer?.clearSelection();

        const selectedRows = this.getSelectedRows();
        if (!selectedRows.length) return;

        for (const row of selectedRows) {
            const rowKey = this.getRowPKKey(row, pkCols);

            if (!row["geom"] && uuid && this.mapVM.isDALayerExists(uuid)) {
                try {
                    const payload = await this.mapVM.getApi().get(
                        MapAPIs.DCH_GET_FEATURE_GEOMETRY,
                        {uuid, pk_values: rowKey}
                    );

                    if (payload) {
                        selectionLayer?.addWKT2Selection(payload, false);
                        (row as any)["geom"] = payload;
                    }
                } catch (err) {
                    console.error("Failed to load geometry for selection sync:", err);
                }
                continue;
            }

            if (uuid && this.mapVM.isOverlayLayerExist(uuid)) {
                const geom = row["geometry"];
                if (geom) {
                    selectionLayer?.addWKT2Selection(
                        new WKT().writeGeometry(geom),
                        false
                    );
                }
                continue;
            }

            if (row["geom"]) {
                selectionLayer?.addWKT2Selection(row["geom"], false);
            }
        }
    }

    async toggleRowSelectionAndFeature(row: Row, pkCols?: string[]) {
        this.toggleRowSelection(row, pkCols);
        await this.syncSelectionLayerFromSelectedRows(pkCols);
    }

    /**
     *
     * Field Selector
     */

    subscribeFieldSelection(
        listener: (payload: { visibleColumnIds: string[] | null; isFieldSelectorOpen: boolean }) => void
    ) {
        this.fieldSelectionListeners.add(listener);
        listener({
            visibleColumnIds: this.visibleColumnIds,
            isFieldSelectorOpen: this.isFieldSelectorOpen,
        });

        return () => {
            this.fieldSelectionListeners.delete(listener);
        };
    }

    private emitFieldSelectionChange() {
        const payload = {
            visibleColumnIds: this.visibleColumnIds ? [...this.visibleColumnIds] : null,
            isFieldSelectorOpen: this.isFieldSelectorOpen,
        };

        this.fieldSelectionListeners.forEach((listener) => listener(payload));
    }

    getVisibleColumnIds(): string[] | null {
        return this.visibleColumnIds ? [...this.visibleColumnIds] : null;
    }

    setVisibleColumnIds(columnIds: string[] | null) {
        this.visibleColumnIds = columnIds?.length ? [...columnIds] : null;
        this.emitFieldSelectionChange();
    }

    showAllColumns() {
        this.visibleColumnIds = null;
        this.emitFieldSelectionChange();
    }

    openFieldSelectorDialog() {
        this.isFieldSelectorOpen = true;
        this.emitFieldSelectionChange();

        this.mapVM.getDialogBoxRef().current?.openDialog({
            title: "Select fields to display",
            content: React.createElement(AttributeFieldSelectorForm),
            isFullWidth: true,
        });
    }

    closeFieldSelectorDialog() {
        this.isFieldSelectorOpen = false;
        this.emitFieldSelectionChange();
    }

    isAllColumnsVisible(): boolean {
        return !this.visibleColumnIds || this.visibleColumnIds.length === 0;
    }

    /**
     * Applying zoom constraint on table
     */




    private rowIntersectsExtent(row: Row, extent: number[]): boolean {
        try {
            // Overlay rows usually have OpenLayers geometry
            if (row["geometry"] instanceof Geometry) {
                return row["geometry"].intersectsExtent(extent);
            }

            // DALayer rows may have WKT geom
            if (row["geom"]) {
                const geom = new WKT().readGeometry(row["geom"], {
                    dataProjection: this.mapVM.getViewProjectionCode(),
                    featureProjection: this.mapVM.getViewProjectionCode(),
                });

                return geom.intersectsExtent(extent);
            }

            return true;
        } catch (err) {
            console.warn("Failed to apply extent filter on row", err);
            return true;
        }
    }

    private filterRowsByExtentConstraint(rows: Row[]): Row[] {
        const extent = this.mapVM.getExtentConstraint();

        if (!extent) return rows;

        return rows.filter((row) => this.rowIntersectsExtent(row, extent));
    }

    /**
     * Column type settings
     *
     */

    private isDateString(value: any): boolean {
        if (typeof value !== "string") return false;

        // reject short/random strings
        if (value.length < 8) return false;

        // ISO date or datetime
        const isoDateRegex =
            /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

        if (isoDateRegex.test(value)) {
            const date = new Date(value);
            return !isNaN(date.getTime());
        }

        return false;
    }

    private resolveColumnType(value: any): Column["type"] {
        if (value instanceof Date) {
            return "date";
        }

        if (typeof value === "number") {
            return "number";
        }

        if (this.isDateString(value)) {
            return "date";
        }

        return "string";
    }

    openUploadGeometryDrawer() {
        if (!this.isEditable) {
            this.mapVM.showSnackbar("Editing is not allowed", "warning");
            return;
        }

        const selectedRows = this.getSelectedRows();

        if (selectedRows.length !== 1) {
            this.mapVM.showSnackbar("Please select exactly one row", "warning");
            return;
        }

        const layerUuid = this.tableLayerUUID;

        if (!layerUuid) {
            this.mapVM.showSnackbar("No active layer found", "warning");
            return;
        }

        const selectedRow = selectedRows[0];
        const pkObject = this.getRowPKObject(selectedRow);

        this.mapVM.getRightDrawerRef().current?.setContent(
            "Upload Geometry",
            React.createElement(GeometryUploadForm, {
                pkObject,
                layerUuid,
                tableManager: this,
            }),
            true,
            420
        );
    }

    async downloadSelectedGeometries() {
        const layerUuid = this.tableLayerUUID;

        if (!layerUuid) {
            this.mapVM.showSnackbar("No active layer found", "warning");
            return;
        }

        const selectedRows = this.getSelectedRows();

        if (!selectedRows.length) {
            this.mapVM.showSnackbar("Please select row(s) first", "warning");
            return;
        }

        const pkObjects = selectedRows.map((row) => this.getRowPKObject(row));

        const url = MapApi.getURL(MapAPIs.DCH_DOWNLOAD_ROWS_GEOMETRY, {
            uuid: layerUuid,
        });

        try {
            this.mapVM.getMapLoadingRef().current?.openIsLoading();

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${AuthServices.getAccessToken()}`,
                },
                body: JSON.stringify({
                    pk_objects: pkObjects,
                }),
            });

            if (!response.ok) {
                let message = "Failed to download geometry";

                try {
                    const errorData = await response.json();
                    message =
                        errorData?.detail ||
                        errorData?.message ||
                        errorData?.error ||
                        message;
                } catch {
                    // ignore non-json error response
                }

                this.mapVM.showSnackbar(message, "error");
                return;
            }

            const blob = await response.blob();

            const contentDisposition =
                response.headers.get("Content-Disposition") ||
                response.headers.get("content-disposition");

            console.log(response.headers)

            // let filename =
            //     selectedRows.length === 1
            //         ? "selected_geometry.gpkg"
            //         : "selected_geometries.gpkg";
            let filename = MapVM.generateUUID() + ".gpkg"


            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match?.[1]) {
                    filename = match[1];
                }
            }

            const downloadUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(downloadUrl);

            this.mapVM.showSnackbar(
                selectedRows.length === 1
                    ? "Geometry downloaded"
                    : `${selectedRows.length} geometries downloaded`,
                "success"
            );
        } catch (err: any) {
            console.error("Download geometry error:", err);

            this.mapVM.showSnackbar(
                err?.message || "Failed to download geometry",
                "error"
            );
        } finally {
            this.mapVM.getMapLoadingRef().current?.closeIsLoading();
        }
    }
}