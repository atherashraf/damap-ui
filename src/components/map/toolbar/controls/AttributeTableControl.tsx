import * as React from "react";
import {IconButton, Tooltip} from "@mui/material";
import TableChartIcon from "@mui/icons-material/TableChart";
import {useMapVM} from "@/components/map/models/MapVMContext";


export const maxTableHeight = 300;
const AttributeTableControl = () => {
    const mapVM = useMapVM();
    const theme = mapVM.getTheme();
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

    const openAttributeTable = () => {
        mapVM.openAttributeTable()
    }

    return (
        <React.Fragment>
            <Tooltip title={"Open Attribute Table"}>
                <IconButton sx={{padding: "3px"}}
                            style={{width: 30, height: 30,
                                backgroundColor: theme?.palette.secondary.main,
                                color:theme?.palette.secondary.contrastText}}
                            onClick={(_) => openAttributeTable()}>
                    <TableChartIcon/>
                </IconButton>
            </Tooltip>
        </React.Fragment>
    );
};
export default AttributeTableControl;
