import BaseStyleForm, { BaseStyleFormProps } from "./BaseStyleForm";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import * as React from "react";
import { RefObject } from "react";
import { MapAPIs } from "@/api/MapApi";
import PointSymbolizer, {
  IPointSymbolizerState,
} from "./symbolizer/PointSymbolizer";
import {
  IFeatureStyle,
  IFilter,
  IGeomStyle,
  IRule,
} from "@/types/typeDeclarations";
import LegendGrid from "../atoms/LegendGrid";
import AddStyleButton from "../atoms/AddStyleButton";
import ColorRamp from "../atoms/ColorRamp";


interface FieldInfo {
  name: string;
  d_type: string;
}

interface IProps {}

interface IState {
  fields: FieldInfo[];
  selectedField: FieldInfo;
  selectedMethod: string;
  noOfClasses: number;
  styleList: IRule[];
}

class DensityStyleForm extends BaseStyleForm<IProps, IState> {
  private pointSymbolizerRef = React.createRef<PointSymbolizer>();
  private colorRampRef: RefObject<ColorRamp | null> = React.createRef<ColorRamp>();

  constructor(props: BaseStyleFormProps) {
    super(props);
    this.state = {
      fields: [],
      fieldValues: [],
      selectedField: "",
      noOfClasses: 4,
      styleList: [{ title: "default", style: this.getGeomStyle() }],
    };
  }

  componentDidMount() {
    const currentStyle = this.props.mapVM.getDALayer(this.props.layerId)?.style;
    console.log(currentStyle);
    if (currentStyle && currentStyle?.type === "density") {
      // const styleList = [{title: "default", style: currentStyle.default}]
      const styleList: IRule[] = [];
      currentStyle.style.rules?.forEach((rule: IRule) => {
        styleList.push(rule);
      });
      this.setState(() => ({ styleList: styleList }));
    }
    this.props.mapVM
      .getApi()
      .get(MapAPIs.DCH_LAYER_FIELDS, { uuid: this.props.layerId })
      .then((payload: any) => {
        this.setState({ fields: payload });
      });
  }

  removeStyles() {
    this.setState({ styleList: [] });
  }

  addStyles() {
    const { selectedField, selectedMethod, noOfClasses } = this.state;
    if (!selectedField) {
      this.props.mapVM.showSnackbar("Please select field first...");
    } else if (!selectedMethod) {
      this.props.mapVM.showSnackbar("Please select classification method...");
    } else {
      this.props.mapVM
        .getApi()
        .get(MapAPIs.DCH_LAYER_FIELD_DISTINCT_VALUE, {
          uuid: this.props.layerId,
          field_name: selectedField.name,
          field_type: selectedField.d_type,
          classification: selectedMethod,
          no_of_classes: noOfClasses,
        })
        .then((payload: any) => {
          this.setState({ fieldValues: payload });
          if (payload) {
            const styleList: IRule[] = [];
            // const valueCount = payload.length
            payload.forEach((item: number, index: number) => {
              if (index !== 0) {
                const title: string = `${Math.round(
                  payload[index - 1]
                )} - ${Math.round(item)}`;
                const filter: IFilter = {
                  field: this.state.selectedField.name,
                  op: "between",
                  value: [payload[index - 1], item],
                };
                const rule: IRule = {
                  title: title,
                  filter: filter,
                  style: this.getGeomStyle(index - 1),
                };
                // console.log("rules", rule)
                styleList.push(rule);
              }
            });
            this.setState({ styleList: styleList });
          }
        });
    }
  }

  getFeatureStyle(): IFeatureStyle {
    // const style: DAGeomStyle = this.vectorStyleRef.current.getStyleParams()
    // const defaultRule: IRule[] = this.state.styleList.filter((item: IRule) => item.title == "default") || []
    const rules: IRule[] = this.state.styleList.filter(
      (item: IRule) => item.title !== "default"
    );
    return {
      type: "density",
      style: {
        rules: rules,
      },
    };
  }

  updatePointParams(pointSymbolizer: IPointSymbolizerState) {
    const styleList = this.state.styleList.map((rule: IRule) => {
      rule.style.pointShape = pointSymbolizer.pointShape;
      rule.style.pointSize = pointSymbolizer.pointSize;
      return rule;
    });
    this.setState({ styleList: styleList });
  }

  getGeomStyle(valueIndex = -1): IGeomStyle {
    const color = this.colorRampRef.current?.getColor(valueIndex);
    return {
      pointShape:
        this.pointSymbolizerRef.current?.getPointSymbolizer().pointShape ||
        "circle",
      pointSize:
        this.pointSymbolizerRef.current?.getPointSymbolizer().pointSize || 10,
      strokeColor: color,
      strokeWidth: 3,
      fillColor: color,
    };
  }

  // updateStyleItem(index: number, style: IGeomStyle) {
  //     const data = this.state.styleList.map((item: IRule, i: number) => i == index ?
  //         Object.assign(item, {style: style}) : item)
  //     this.setState(() => ({styleList: data}))
  // }
  updateStyleItem(index: number, styleRule: IRule) {
    this.setState({
      styleList: [
        ...this.state.styleList.slice(0, index),
        Object.assign({}, this.state.styleList[index], styleRule),
        ...this.state.styleList.slice(index + 1),
      ],
    });
  }

  render() {
    //@ts-ignore
    const geomType = this.props?.mapVM
      ?.getDALayer(this.props?.layerId)
      .getGeomType();
    const classificationMethods = [
      ["Natural Break", "NaturalBreak"],
      ["Quantile", "Quantile"],
      ["Equal Interval", "EqualInterval"],
    ];
    return (
      <React.Fragment>
        {geomType.findIndex((a:string) => a.includes("Point")) !== -1 && (
          <PointSymbolizer
            ref={this.pointSymbolizerRef}
            pointSize={
              this.state.styleList.length > 0
                ? this.state.styleList[0].pointSize
                : "circle"
            }
            pointShape={
              this.state.styleList.length > 0
                ? this.state.styleList[0].pointShape
                : 18
            }
            updateStyle={this.updatePointParams.bind(this)}
          />
        )}
        <fieldset>
          <legend>Classification</legend>
          <Box sx={{ flex: 1, p: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="select-field-label">Select Field</InputLabel>
              <Select
                value={this.state.selectedField.name}
                label="Select Field"
                onChange={(e) => {
                  this.setState({ selectedField: e.target.value });
                }}
              >
                {this.state.fields.map(
                  (field: any) =>
                    field.d_type === "number" && (
                      <MenuItem key={`${field.name} - key`} value={field}>
                        {field.name}
                      </MenuItem>
                    )
                )}
              </Select>
            </FormControl>
            <Box sx={{ flex: 1, pt: 1 }}>
              <FormControl fullWidth size={"small"}>
                {/*<InputLabel id="select-value-label">Select Point Size</InputLabel>*/}
                <TextField
                  type={"number"}
                  value={this.state.noOfClasses}
                  label="No of Classes"
                  size={"small"}
                  onChange={(e) =>
                    this.setState({
                      noOfClasses: parseInt(e.target.value as string),
                    })
                  }
                  InputProps={{ inputProps: { min: 2, max: 10 } }}
                />
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, pt: 1 }}>
              <FormControl fullWidth size={"small"}>
                <InputLabel id="select-value-label">Select Method</InputLabel>
                <Select
                  value={this.state.selectedMethod}
                  label="Select Method"
                  onChange={(e) => {
                    this.setState({ selectedMethod: e.target.value });
                  }}
                >
                  {classificationMethods.map((method: string[]) => (
                    <MenuItem key={`${method} - key`} value={method[1]}>
                      {method[0]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, pt: 1, alignItems: "center" }}>
              <ColorRamp ref={this.colorRampRef} mapVM={this.props.mapVM} />
            </Box>
            <Box sx={{ flex: 1, pt: 1, alignItems: "center" }}>
              <AddStyleButton
                menuList={[
                  {
                    name: "Add Style",
                    handleClick: this.addStyles.bind(this),
                  },
                  {
                    name: "Remove Styles",
                    handleClick: this.removeStyles.bind(this),
                  },
                ]}
              />
            </Box>
          </Box>
        </fieldset>
        {this.state.styleList.length > 0 && (
          <LegendGrid
            styleList={this.state.styleList}
            updateStyleItem={this.updateStyleItem.bind(this)}
            mapVM={this.props.mapVM}
            layerId={this.props.layerId}
          />
        )}
      </React.Fragment>
    );
  }
}

export default DensityStyleForm;
