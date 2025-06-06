import { Box, TextField } from "@mui/material";
import * as React from "react";
import MapVM from "@/components/map/models/MapVM";
import { MapAPIs } from "@/api/MapApi";
import DASelectButton from "@/components/map/widgets/DASelectButton";
import { MouseEventHandler } from "react";

interface IProps {
  mapVM: MapVM;
}

const PredefinedStyling = (props: IProps) => {
  const [options, setPredefinedList] = React.useState([
    { name: "Add New Style", style: null },
  ]);
  const [styleName, setStyleName] = React.useState("");

  React.useEffect(() => {
    props.mapVM
      .getApi()
      .get(MapAPIs.DCH_PREDEFINED_LIST)
      .then((payload) => {
        if (payload) {
          const p = [...options, ...payload];
          // console.log(p)
          setPredefinedList(p);
        }
      });
  }, [options, props.mapVM]);

  const handleClick = (
    //@ts-ignore
    e: MouseEventHandler<HTMLButtonElement>,
    selectedIndex: number
  ) => {
    const option = options[selectedIndex];
    if (option.name === "Add New Style") {
      props.mapVM.getDialogBoxRef()?.current?.openDialog({
        content: (
          <>
            <Box
              sx={{ display: "flex", flex: 1, p: 2, justifyContent: "center" }}
            >
              <TextField
                label={"Add Style Name"}
                defaultValue={styleName}
                variant={"standard"}
                onChange={(e) => setStyleName(e.target.value as string)}
              />
            </Box>
            {/*<Box sx={{ flex: 1 }}>*/}
            {/*  <LegendGridJqx />*/}
            {/*</Box>*/}
          </>
        ),
      });
    } else {
      console.info(`You clicked ${options[selectedIndex].name}`);
    }
  };

  return (
    <React.Fragment>
      <Box sx={{ flex: 1 }}>
        <DASelectButton options={options} handleClick={handleClick} />
      </Box>
    </React.Fragment>
  );
};

export default PredefinedStyling;
