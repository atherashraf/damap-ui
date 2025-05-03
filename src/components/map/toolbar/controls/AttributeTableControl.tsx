import * as React from "react";
import {IconButton, Tooltip} from "@mui/material";
import TableChartIcon from "@mui/icons-material/TableChart";
import AttributeTable from "@/components/map/table/AttributeTable.tsx";
import {RefObject} from "react";
import {MapAPIs} from "@/api/MapApi.ts";
import {Column, Row} from "@/types/gridTypeDeclaration.ts";
import {Feature} from "ol";
import _ from "@/utils/lodash.ts";
import {AttributeTableRequest} from "@/types/typeDeclarations.ts";
import {useMapVM} from "@/components/map/models/MapVMContext.tsx";




const daGridRef: RefObject<any> = React.createRef<typeof AttributeTable>();
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
    React.useEffect(() => {
        setTimeout(() => mapVM.setAttributeTableRef(daGridRef), 500);
    }, [mapVM]);

    const openAttributeTable = (tableHeight = 250) => {
        // const mapPanelRef = mapVM.getMapPanelRef();
        // const daGridRef = this.getAttributeTableRef();
        const bottomDrawer = mapVM.getBottomDrawerRef()

        let open = bottomDrawer.current?.isOpen();
        const uuid = mapVM.getLayerOfInterest();
        if (!uuid) {
            mapVM.showSnackbar("Please select a layer to view its attributes");
        } else if (!open) {
            // const mapDiv = document.getElementById(mapDivInfo['mapDivId']);
            // const mapHeight = mapDiv?.clientHeight ?? 0;
            // tableHeight = mapHeight >= mapDivInfo['minMapHeight'] ? tableHeight : mapHeight - mapDivInfo['minMapHeight'];
            // if (mapDiv) {
            //     mapDiv.style.height = `${mapHeight - tableHeight}px`;
            // }
            // bottomDrawer.current?.openDrawer(tableHeight);

            if (uuid) {
                if (mapVM.isDALayerExists(uuid)) {
                    mapVM.getApi()
                        .get(MapAPIs.DCH_LAYER_ATTRIBUTES, {uuid: uuid})
                        .then((payload: { columns: Column[], rows: Row[], pkCols: string[] }) => {
                            if (payload) {
                                requestAttributeTable({
                                    columns: payload.columns,
                                    rows: payload.rows,
                                    pkCols: payload.pkCols,
                                    tableHeight: tableHeight,
                                });
                            } else {
                                bottomDrawer.current?.closeDrawer();
                                mapVM.getSnackbarRef()?.current?.show("No attribute found");
                            }
                        })
                        .catch(() => {
                            bottomDrawer.current?.closeDrawer();
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
                        rows.push({...properties, rowId: parseFloat(id)});
                    });

                    requestAttributeTable({
                        columns: columns,
                        rows: rows,
                        pkCols: ['id'],
                        tableHeight: tableHeight,
                    });


                }
            }
        } else {
            bottomDrawer.current?.closeDrawer();
            mapVM.showSnackbar("No attribute found....")
        }
    }

    // replacement of createAttributeTable with triggering a request:
    const requestAttributeTable = (request: AttributeTableRequest) => {
        const {columns, rows, pkCols, tableHeight} = request;
        const attributeGrid = (
            <AttributeTable
                //@ts-ignore
                columns={columns}
                data={rows}
                pkCols={pkCols}
                tableHeight={tableHeight || 300}
                mapVM={mapVM}
            />
        );
        const bottomDrawer = mapVM.getBottomDrawerRef()
        bottomDrawer?.current.setContent(attributeGrid);
        bottomDrawer?.current.openDrawer(tableHeight || maxTableHeight);
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
