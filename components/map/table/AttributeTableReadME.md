````md
# AttributeTableManager

`AttributeTableManager` is responsible for opening, refreshing, presenting, and managing attribute tables in DAMap.

It centralizes:

- opening layer-backed attribute tables
- opening custom attribute tables
- row identity helpers
- row selection and zoom
- row update / delete workflows
- CSV export
- toolbar action injection
- current table request state

---

## Responsibilities

`AttributeTableManager` owns the attribute-table workflow and presentation logic, while `MapVM` provides the map infrastructure and shared services.

### Managed by `AttributeTableManager`

- Load DALayer attributes from backend
- Build and store `tableRequest`
- Present table in bottom drawer
- Open overlay-layer table
- Open custom table
- Track whether current table is custom
- Select row and sync selection layer
- Save row edits
- Delete rows
- Export visible rows to CSV
- Add / clear toolbar actions
- Provide current table columns, rows, pkCols

### Still provided by `MapVM`

- map instance
- API access
- layer of interest
- bottom drawer refs
- loading ref
- snackbar
- selection layer
- attribute table UI state (`selectedRowKey`, `scrollTop`)
- UUID generation

---

## Construction

`AttributeTableManager` is created inside `MapVM`.

```ts
this.attributeTableManager = new AttributeTableManager(this);
````

Access it using:

```ts
const tableManager = mapVM.getAttributeTableManager();
```

---

## Basic Usage

### Open attribute table for current layer of interest

```ts
const tableManager = mapVM.getAttributeTableManager();
tableManager.open();
```

With custom height:

```ts
tableManager.open(320);
```

---

### Refresh current attribute table

```ts
await tableManager.refresh();
```

> Refresh only works for DALayer-backed tables.
> For custom tables, refresh is intentionally disabled.

---

### Reopen current table request

```ts
tableManager.reopen();
```

This is useful when table data is already loaded and only needs to be shown again.

---

## Open a Custom Attribute Table

Use this when rows/columns are already available in memory and do not need to be fetched from backend.

```ts
tableManager.openCustomAttributeTable({
    columns: [
        { id: "name", label: "Name", disablePadding: false, type: "string" },
        { id: "age", label: "Age", disablePadding: false, type: "number" },
    ],
    rows: [
        { name: "Ali", age: 20 },
        { name: "Sara", age: 22 },
    ],
    pkCols: ["name"], // optional
    tableHeight: 320, // optional
});
```

### Notes

* If `pkCols` is not provided, it falls back to `["rowId"]`
* If a row does not contain `rowId`, it is auto-generated using `MapVM.generateUUID()`
* Custom tables are marked as non-refreshable

---

## Table Data Access

### Columns

```ts
tableManager.columns
```

### Rows

```ts
tableManager.data
```

### Primary key columns

```ts
tableManager.pkCols
```

### Editable state

```ts
tableManager.isEditable
```

### Current table request

```ts
tableManager.getTableRequest()
```

### Check whether table exists

```ts
tableManager.hasTable()
```

### Clear current table request

```ts
tableManager.clearTableRequest()
```

---

## Row Identity

The manager supports two row identity forms:

### 1. UI key string

Used for:

* selected row state
* lookup in local table rows
* stable comparison inside table logic

```ts
const rowKey = tableManager.getRowKey(row, pkCols);
```

Example result:

```ts
"123"
"10__LHR"
"f84a0c3d..."
```

### 2. PK object

Used for backend-oriented identity and composite keys.

```ts
const pkObject = tableManager.getRowPKObject(row, pkCols);
```

Example result:

```
{ id: 123 }
{ district: "LHR", mouza: "ABC" }
{ rowId: "f84a0c3d..." }
```

> Recommendation:
>
> * use `getRowKey()` for UI identity
> * use `getRowPKObject()` for backend/API identity

---

## Row Selection

### Select a row

```ts
await tableManager.selectRow(row, pkCols);
```

What it does:

* stores selected row key in `MapVM`
* fetches geometry for DALayer rows if needed
* adds feature geometry to selection layer
* supports overlay-layer geometries too

### Zoom to selection

```ts
tableManager.zoomToSelection();
```

### Clear selection

```ts
tableManager.clearSelection();
```

---

## Row Editing

### Save edited row

```ts
const changed = await tableManager.saveRow(
    originalRow,
    tempRowData,
    columns,
    pkCols
);
```

What it does:

* checks editable columns only
* normalizes values by column type
* calls `mapVM.updateAttribute(...)`
* updates local `tableRequest.rows` when successful
* shows success snackbar if row changed

### Value normalization

Internal helper:

```ts
tableManager.normalizeValue(value, column.type);
```

Supported types:

* `"string"`
* `"number"`
* `"date"`

---

## Row Deletion

```ts
const success = await tableManager.deleteRow(row, pkCols);
```

What it does:

* builds PK object
* calls `mapVM.deleteFeatures(...)`
* clears selected row state
* removes deleted row from local `tableRequest.rows`

---

## CSV Export

```ts
tableManager.exportCsv(columns, rows);
```

Custom file name:

```ts
tableManager.exportCsv(columns, rows, "my_table.csv");
```

---

## Toolbar Management

`AttributeTableManager` also owns attribute-table toolbar actions.

### Add custom toolbar action

```tsx
tableManager.addAttributeToolbarButton({
    id: "btn-selection",
    slot: "end",
    order: 10,
    node: (
        <Button
            size="small"
            variant="contained"
            onClick={() => console.log("clicked")}
        >
            Selection
        </Button>
    ),
});
```

### Clear toolbar actions

Clear all:

```ts
tableManager.clearAttributeToolbarButtons();
```

Clear one slot only:

```ts
tableManager.clearAttributeToolbarButtons("end");
```

### Access toolbar handle directly

```ts
const toolbar = tableManager.getAttributeTableToolbarHandle();
```

---

## Table Height

### Set table height

```ts
tableManager.setTableHeight(300);
```

### Get table height

```ts
const h = tableManager.getTableHeight();
```

---

## Filtering Helper

The manager provides a helper for simple in-memory filtering.

```ts
const filteredRows = tableManager.applyFilters(rows, filters);
```

Example:

```ts
const filters = [
    { key: "name", value: "ali" },
    { key: "age", value: [20, 40] },
];
```

---

## Typical Integration Pattern

### Inside React component

```ts
const mapVM = getMapVM();
const tableManager = mapVM.getAttributeTableManager();
```

### Toolbar wiring

```tsx
<AttributeTableToolbar
    ref={mapVM.getAttributeTableToolbarRef()}
    onRefresh={() => tableManager.refresh()}
    onZoom={() => tableManager.zoomToSelection()}
    onClear={() => tableManager.clearSelection()}
    onExport={() => tableManager.exportCsv(columns, rows)}
    searchText={searchText}
    onSearchTextChange={setSearchText}
    rowsCount={rows.length}
/>
```

### Row click

```ts
await tableManager.selectRow(row, pkCols);
```

### Row save

```ts
await tableManager.saveRow(originalRow, tempRowData, columns, pkCols);
```

### Row delete

```ts
await tableManager.deleteRow(row, pkCols);
```

---

## Internal Workflow Summary

### DALayer-backed table

```
open()
  -> openDALayerTable()
  -> loadDALayerTableRequest()
  -> presentAttributeTable()
```

### Overlay-layer table

```
open()
  -> openOverlayLayerTable()
  -> build rows/columns from features
  -> presentAttributeTable()
```

### Custom table

```
openCustomAttributeTable()
  -> normalize rows
  -> create tableRequest
  -> presentAttributeTable()
```

---

## Best Practices

* Use real `pkCols` whenever available
* Use `rowId` fallback only when no real PK exists
* Prefer `getRowPKObject()` for backend operations
* Prefer `getRowKey()` for UI comparison/state
* Keep `AttributeTableToolbar` dumb and prop-driven
* Let `AttributeTableManager` own toolbar action injection
* Let `MapVM` remain infrastructure/facade, not table workflow owner

---

## Future Improvements

Possible future additions:

* full object-based PK flow for `updateAttribute`
* server-side filtering/sorting
* pagination support
* row caching
* multi-row selection / deletion
* table mode metadata (`dalayer`, `overlay`, `custom`)

---

# 🧩 Attribute Table Toolbar

`AttributeTableManager` fully manages the Attribute Table toolbar.

You can dynamically add, remove, and control toolbar actions without coupling UI logic inside `AttributeTable`.

---

## 🔹 Add Toolbar Button

```tsx
tableManager.addAttributeToolbarButton({
    id: "btn-selection",
    slot: "end",       // "start" | "center" | "end"
    order: 10,         // optional ordering
    node: (
        <Button
            size="small"
            variant="contained"
            onClick={() => {
                console.log("Selection clicked");
            }}
        >
            Selection
        </Button>
    ),
});
```

### Parameters

| Field   | Type                           | Description                  |
| ------- | ------------------------------ | ---------------------------- |
| `id`    | string                         | Unique identifier (required) |
| `slot`  | `"start" \| "center" \| "end"` | Toolbar section              |
| `order` | number                         | Ordering inside slot         |
| `node`  | ReactNode                      | UI element                   |

---

## 🔹 Clear Toolbar Buttons

### Clear all buttons

```ts
tableManager.clearAttributeToolbarButtons();
```

### Clear only a specific slot

```ts
tableManager.clearAttributeToolbarButtons("end");
```

---

## 🔹 Access Toolbar Handle (Advanced)

```ts
const toolbar = tableManager.getAttributeTableToolbarHandle();
```

You can directly call:

```
toolbar?.addAction(...)
toolbar?.clear(...)
```

---

## 🔹 Example: Add Multiple Buttons

```
tableManager.addAttributeToolbarButton({
    id: "btn-refresh",
    slot: "start",
    order: 1,
    node: (
        <Button size="small" onClick={() => tableManager.refresh()}>
            Refresh
        </Button>
    ),
});

tableManager.addAttributeToolbarButton({
    id: "btn-export",
    slot: "end",
    order: 5,
    node: (
        <Button size="small" onClick={() => tableManager.exportCsv(columns, rows)}>
            Export
        </Button>
    ),
});
```

---

## 🔹 Best Practices

* Always use **unique `id`** per button
* Use `order` to control placement instead of manual layout hacks
* Keep toolbar buttons **stateless** (call manager methods)
* Avoid directly accessing toolbar ref unless necessary
* Clear buttons when switching table context (optional but recommended)

---

## 🔹 Lifecycle Tip

When opening a new table:

```ts
tableManager.clearAttributeToolbarButtons();
```

Then add relevant buttons:

```ts
const btn={
    
};
tableManager.addAttributeToolbarButton(btn);
```

---

## 🔹 Recommended Pattern

```
const tableManager = mapVM.getAttributeTableManager();

tableManager.open();

tableManager.clearAttributeToolbarButtons();

tableManager.addAttributeToolbarButton({
    id: "btn-custom",
    slot: "end",
    node: <Button>Custom</Button>,
});
```

---

## 🧠 Design Philosophy

Toolbar is now:

* **Owned by AttributeTableManager**
* **UI-agnostic**
* **Dynamically extensible**
* **Decoupled from AttributeTable**

---