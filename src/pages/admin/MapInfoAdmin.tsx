import * as React from "react";
import {useNavigate} from "react-router-dom";
import {RefObject} from "react";
import DASnackbar, { DASnackbarHandle } from "@/components/base/DASnackbar";
import ChangeList, { ChangeListHandle } from "@/components/admin/ChangeList";
import {Column, Row} from "@/types/gridTypeDeclaration";
import {Action} from "@/components/admin/ChangeListToolbar";
import MapApi, {MapAPIs} from "@/api/MapApi";

const snackbarRef: RefObject<DASnackbarHandle | null> = React.createRef<DASnackbarHandle>();
const changeListRef = React.createRef<ChangeListHandle>();
const MapInfo = () => {
    const [columns, setColumns] = React.useState<Column[]>([]);
    const [data, setData] = React.useState<Row[]>();
    const [actions, setActions] = React.useState<Action[]>([]);
    const api = React.useMemo(() => new MapApi(snackbarRef), []);

    const navigate = useNavigate();
    const getRowData = React.useCallback(() => {
        return changeListRef.current?.getSelectedRowData();
    },[]);
    console.log("rowData", getRowData());
    const getSelectedUUID = React.useCallback(() => {
        const rowData = getRowData();
        if (rowData) {
            return rowData.uuid;
        }
    }, [getRowData]) ;
    const initAction = React.useCallback(() => {
        const actions = [
            {
                name: "Create Map Info",
                action: () => {
                    navigate("/EditMap/-1");
                },
            },
            {
                name: "View Map",
                action: () => {
                    const uuid = getSelectedUUID();
                    if (uuid) {
                        navigate("/ViewMap/" + uuid);
                    } else {
                        snackbarRef.current?.show("Please select a row");
                    }
                },
            },
            {
                name: "Update Map",
                action: () => {
                    const uuid = getSelectedUUID();
                    if (uuid) {
                        navigate("/EditMap/" + uuid);
                        // api.get(MapAPIs.DCH_UPDATE_MAP, { uuid: uuid }).then((payload) => {
                        //   if (payload) {
                        //     window.location.reload();
                        //     setTimeout(() => {
                        //       snackbarRef.current?.show("Map Info updated successfully");
                        //     }, 3000);
                        //   }
                        // });
                    } else {
                        snackbarRef.current?.show("Please select a row");
                    }
                },
            },
            {
                name: "Delete Map",
                action: () => {
                    const uuid = getSelectedUUID();
                    if (uuid) {
                        api.get(MapAPIs.DCH_DELETE_MAP, {uuid: uuid}).then((payload) => {
                            if (payload) {
                                window.location.reload();
                                setTimeout(() => {
                                    snackbarRef.current?.show("Map Info deleted successfully");
                                }, 3000);
                            }
                        });
                    } else {
                        snackbarRef.current?.show("Please select a row");
                    }
                },
            },
        ];
        setActions(actions);
    }, [navigate, api, getSelectedUUID]);
    React.useEffect(() => {
        initAction();
        api.get(MapAPIs.DCH_ALL_MAP_INFO).then((payload) => {
            if (payload) {
                setColumns(payload.columns);
                setData(payload.rows);
            }
        });
    }, [api, initAction]);

    return (
        <React.Fragment>
            {/*<Typography variant="h5">Map Info</Typography>*/}
            {columns.length > 0 ? (
                //@ts-ignore
                <ChangeList
                    ref={changeListRef}
                    columns={columns}
                    data={data || []}
                    tableHeight={"100%"}
                    tableWidth={"100%"}
                    actions={actions}
                    api={api}
                    pkColName={"uuid"}
                    saveURL={MapApi.getURL(MapAPIs.DCH_SAVE_MAP_INFO)}
                />
            ) : (
                <React.Fragment/>
            )}
            <DASnackbar ref={snackbarRef}/>
        </React.Fragment>
    );
};

export default MapInfo;
