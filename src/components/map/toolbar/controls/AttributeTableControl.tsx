import * as React from "react";
import {IconButton, Tooltip} from "@mui/material";
import TableChartIcon from "@mui/icons-material/TableChart";
import AttributeTable from "@/components/map/table/AttributeTable.tsx";
import {MapAPIs} from "@/api/MapApi.ts";
import {Column, Row} from "@/types/gridTypeDeclaration.ts";
import {Feature} from "ol";
import _ from "@/utils/lodash.ts";
import {AttributeTableRequest} from "@/types/typeDeclarations.ts";
import {useMapVM} from "@/components/map/models/MapVMContext.tsx";


export const maxTableHeight = 300;
const AttributeTableControl = () => {
    const mapVM = useMapVM();
    const ro = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const cr = entry.contentRect;
            if (cr.height > 0) {
                // daGridRef.current?.updateTableHeight(cr.height);
            }
        }
    });
    //@ts-ignore
    const target = document.getElementById("bottom-drawer-div");
    if (target) {
        ro.observe(target);
    }


    const openAttributeTable = (tableHeight = 250) => {
        const bottomDrawer = mapVM.getBottomDrawerRef();
        const drawerRef = bottomDrawer.current;
        if (!drawerRef) return;

        const uuid = mapVM.getLayerOfInterest();
        if (!uuid) {
            mapVM.showSnackbar("Please select a layer to view its attributes");
            return;
        }

        if (drawerRef.isOpen()) {
            if (drawerRef.isHidden?.()) {
                drawerRef.handleUnhide?.();
            }
            return;
        }

        if (mapVM.isDALayerExists(uuid)) {
            mapVM.getApi()
                .get(MapAPIs.DCH_LAYER_ATTRIBUTES, { uuid })
                .then((payload: { columns: Column[]; rows: Row[]; pkCols: string[] }) => {
                    if (payload) {
                        requestAttributeTable({
                            columns: payload.columns,
                            rows: payload.rows,
                            pkCols: payload.pkCols,
                            tableHeight: tableHeight,
                        });
                    } else {
                        drawerRef.closeDrawer();
                        mapVM.getSnackbarRef()?.current?.show("No attribute found");
                    }
                })
                .catch(() => {
                    drawerRef.closeDrawer();
                    mapVM.getSnackbarRef()?.current?.show("No attribute found");
                });
        } else if (mapVM.isOverlayLayerExist(uuid)) {
            const overlayLayer = mapVM.getOverlayLayer(uuid);
            const features = overlayLayer.getFeatures();
            const columns: Column[] = [];
            const rows: Row[] = [];
            features?.forEach((feature: Feature, index) => {
                const id = feature.getId();
                const properties = feature.getProperties();
                if (index === 0) {
                    Object.keys(properties).forEach((key) => {
                        columns.push({
                            disablePadding: false,
                            id: key,
                            label: key,
                            type: _.checkPrimitivesType(properties[key]),
                        });
                    });
                }
                //@ts-ignore
                rows.push({ ...properties, rowId: parseFloat(id) });
            });

            requestAttributeTable({
                columns,
                rows,
                pkCols: ["id"],
                tableHeight: tableHeight,
            });
        }
    };

    // replacement of createAttributeTable with triggering a request:
    const requestAttributeTable = (request: AttributeTableRequest) => {
        const  {columns, rows, pkCols, } = request;
        const tableHeight = request.tableHeight || 200
        const toolbarHeight = 100; // Adjust if needed
        const drawerHeight = toolbarHeight + tableHeight ;
        const attributeGrid = (
            <AttributeTable
                //@ts-ignore
                columns={columns}
                data={rows}
                pkCols={pkCols}
                tableHeight={tableHeight}
                mapVM={mapVM}
            />
        );
        const bottomDrawer = mapVM.getBottomDrawerRef()
        bottomDrawer?.current.setContent(attributeGrid);
        bottomDrawer?.current.openDrawer(drawerHeight );
    }

    return (
        <React.Fragment>
            <Tooltip title={"Open Attribute Table"}>
                <IconButton sx={{padding: "3px"}} onClick={(_) => openAttributeTable()}>
                    <TableChartIcon/>
                </IconButton>
            </Tooltip>
        </React.Fragment>
    );
};
export default AttributeTableControl;
