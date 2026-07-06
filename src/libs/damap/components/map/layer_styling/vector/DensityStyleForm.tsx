import BaseStyleForm, { BaseStyleFormProps } from "./BaseStyleForm";
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select, Typography,
} from "@mui/material";
import * as React from "react";
import { RefObject } from "react";

import { MapAPIs } from "@damap/api/MapApi";
import PointSymbolizer from "./symbolizer/PointSymbolizer";
import {
  IFeatureStyle,
  IFilter,
  IGeomStyle,
  IRule,
} from "@damap/types/typeDeclarations";

import LegendGrid from "../atoms/LegendGrid";
import AddStyleButton from "../atoms/AddStyleButton";
import ColorRamp from "../atoms/ColorRamp";
import DANumberField from "@damap/components/base/DANumberField";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface FieldInfo {
  name: string;
  d_type: string;
}

type IProps = object

interface IState {
  fields: FieldInfo[];
  fieldValues: number[];
  selectedField: FieldInfo | null;
  selectedMethod: string;
  noOfClasses: number;
  styleList: IRule[];
}

class DensityStyleForm extends BaseStyleForm<IProps, IState> {
  private pointSymbolizerRef = React.createRef<PointSymbolizer>();
  private colorRampRef: RefObject<ColorRamp | null> =
      React.createRef<ColorRamp>();

  constructor(props: BaseStyleFormProps) {
    super(props);

    this.state = {
      fields: [],
      fieldValues: [],
      selectedField: null,
      selectedMethod: "",
      noOfClasses: 4,
      styleList: [{ title: "default", style: this.getGeomStyle() }],
    };
  }

  componentDidMount() {
    const layerId =
        this.props.layerId || this.props.mapVM.getLayerOfInterest();

    if (!layerId) return;

    const currentStyle = this.props.mapVM.getDALayer(layerId)?.style;

    if (currentStyle?.type === "density") {
      const styleList: IRule[] = currentStyle.style.rules || [];
      this.setState({ styleList });
    }

    this.props.mapVM
        .getApi()
        .get(MapAPIs.DCH_LAYER_FIELDS, { uuid: layerId })
        .then((payload: FieldInfo[]) => {
          this.setState({ fields: payload || [] });
        });
  }

  removeStyles() {
    this.setState({ styleList: [] });
  }

  addStyles() {
    const { selectedField, selectedMethod, noOfClasses } = this.state;

    const layerId =
        this.props.layerId || this.props.mapVM.getLayerOfInterest();

    if (!layerId) return;

    if (!selectedField) {
      this.props.mapVM.showSnackbar("Please select field first...");
      return;
    }

    if (!selectedMethod) {
      this.props.mapVM.showSnackbar("Please select classification method...");
      return;
    }

    this.props.mapVM
        .getApi()
        .get(MapAPIs.DCH_LAYER_FIELD_DISTINCT_VALUE, {
          uuid: layerId,
          field_name: selectedField.name,
          field_type: selectedField.d_type,
          classification: selectedMethod,
          no_of_classes: noOfClasses,
        })
        .then((payload: number[]) => {
          this.setState({ fieldValues: payload || [] });

          if (!payload || payload.length < 2) return;

          const classCount = payload.length - 1;
          const rampColors =
              this.colorRampRef.current?.getColorRamp(classCount) || [];

          const styleList: IRule[] = [];
          const fieldName = selectedField.name;

          payload.forEach((item: number, index: number) => {
            if (index === 0) return;

            const ruleIndex = index - 1;
            const minValue = payload[index - 1];
            const maxValue = item;
            const color =
                rampColors[ruleIndex] ||
                this.colorRampRef.current?.getColor(classCount, ruleIndex) ||
                "#404abf";

            const filter: IFilter = {
              field: fieldName,
              op: "between",
              value: [minValue, maxValue],
            };

            styleList.push({
              title: `${Math.round(minValue)} - ${Math.round(maxValue)}`,
              filter,
              style: this.getGeomStyle(color),
            });
          });

          this.setState({ styleList });
        });
  }

  getFeatureStyle(): IFeatureStyle {
    const rules: IRule[] = this.state.styleList.filter(
        (item) => item.title !== "default"
    );

    return {
      type: "density",
      style: {
        rules,
      },
    };
  }

  updatePointParams(pointStyle: IGeomStyle) {
    const styleList = this.state.styleList.map((rule) => ({
      ...rule,
      style: {
        ...rule.style,
        pointShape: pointStyle.pointShape,
        pointSize: pointStyle.pointSize,
        pointRotation: pointStyle.pointRotation,
        fillColor: pointStyle.fillColor ?? rule.style.fillColor,
        fillOpacity: pointStyle.fillOpacity ?? rule.style.fillOpacity,
        strokeColor: pointStyle.strokeColor ?? rule.style.strokeColor,
        strokeWidth: pointStyle.strokeWidth ?? rule.style.strokeWidth,
        strokeOpacity:
            pointStyle.strokeOpacity ?? rule.style.strokeOpacity,
      },
    }));

    this.setState({ styleList });
  }

  getGeomStyle(color = "#404abf"): IGeomStyle {
    const pointStyle = this.pointSymbolizerRef.current?.getStyleParams();

    return {
      pointShape: pointStyle?.pointShape ?? "circle",
      pointSize: pointStyle?.pointSize ?? 10,
      pointRotation: pointStyle?.pointRotation ?? 0,

      strokeColor: color,
      strokeWidth: pointStyle?.strokeWidth ?? 3,
      strokeOpacity: pointStyle?.strokeOpacity ?? 1,

      fillColor: color,
      fillOpacity: pointStyle?.fillOpacity ?? 0.65,
      fillPattern: "solid",

      lineCap: "butt",
      lineJoin: "round",
    };
  }
  updateStyleItem(index: number, styleRule: IRule) {
    this.setState({
      styleList: [
        ...this.state.styleList.slice(0, index),
        {
          ...this.state.styleList[index],
          ...styleRule,
        },
        ...this.state.styleList.slice(index + 1),
      ],
    });
  }

  render(): React.ReactNode {
    const layerId =
        this.props.layerId || this.props.mapVM.getLayerOfInterest();

    if (!layerId) return null;

    const geomType =
        this.props.mapVM.getDALayer(layerId)?.getGeomType() || [];

    const isPointLayer = geomType.some((g: string) =>
        g.toLowerCase().includes("point")
    );

    const classificationMethods = [
      ["Natural Break", "NaturalBreak"],
      ["Quantile", "Quantile"],
      ["Equal Interval", "EqualInterval"],
    ];

    return (
        <React.Fragment>

          <fieldset>
            <legend>Classification</legend>

            <Box sx={{ flex: 1, p: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="select-field-label">
                  Select Field
                </InputLabel>

                <Select
                    labelId="select-field-label"
                    value={this.state.selectedField?.name ?? ""}
                    label="Select Field"
                    onChange={(e) => {
                      const selected = this.state.fields.find(
                          (field) => field.name === e.target.value
                      );

                      this.setState({
                        selectedField: selected ?? null,
                      });
                    }}
                >
                  {this.state.fields
                      .filter((field) => field.d_type === "number")
                      .map((field) => (
                          <MenuItem
                              key={`${field.name}-key`}
                              value={field.name}
                          >
                            {field.name}
                          </MenuItem>
                      ))}
                </Select>
              </FormControl>

              <Box sx={{ flex: 1, pt: 1 }}>
                <DANumberField
                    label="No of Classes"
                    size="small"
                    fullWidth
                    value={this.state.noOfClasses}
                    min={2}
                    max={10}
                    step={1}
                    onValueChange={(value) =>
                        this.setState({
                          noOfClasses: Math.round(value),
                        })
                    }
                />
              </Box>

              <Box sx={{ flex: 1, pt: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="select-method-label">
                    Select Method
                  </InputLabel>

                  <Select
                      labelId="select-method-label"
                      value={this.state.selectedMethod}
                      label="Select Method"
                      onChange={(e) => {
                        this.setState({
                          selectedMethod: e.target.value,
                        });
                      }}
                  >
                    {classificationMethods.map((method) => (
                        <MenuItem
                            key={`${method[1]}-key`}
                            value={method[1]}
                        >
                          {method[0]}
                        </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: 1, pt: 1, alignItems: "center" }}>
                <ColorRamp
                    ref={this.colorRampRef}
                    mapVM={this.props.mapVM}
                />
              </Box>

              {isPointLayer && (

                  <Accordion defaultExpanded={false} sx={{ mt: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Point Symbolizer</Typography>
                    </AccordionSummary>

                    <AccordionDetails sx={{ p: 1 }}>
                      <PointSymbolizer
                          ref={this.pointSymbolizerRef}
                          style={this.state.styleList[0]?.style}
                          updateStyle={(style) => this.updatePointParams(style)}
                          showIconUpload={false}
                      />
                    </AccordionDetails>
                  </Accordion>

              )}


              <Box sx={{ flex: 1, pt: 1, alignItems: "center" }}>
                <AddStyleButton
                    menuList={[
                      {
                        name: "Add Style",
                        handleClick: this.addStyles.bind(this),
                      },
                      {
                        name: "Remove Styles",
                        handleClick:
                            this.removeStyles.bind(this),
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
                  layerId={layerId}
              />
          )}
        </React.Fragment>
    );
  }
}

export default DensityStyleForm;