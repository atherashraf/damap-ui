import BaseStyleForm, { BaseStyleFormProps } from "./BaseStyleForm";
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow, Typography,
} from "@mui/material";
import * as React from "react";
import { MapAPIs } from "@damap/api/MapApi";
import { DASelect } from "@damap/components/styled/styledMapComponents";
import {
  IFeatureStyle,
  IGeomStyle,
  IRule,
} from "@damap/types/typeDeclarations";
import PointSymbolizer from "./symbolizer/PointSymbolizer";
import { LegendIcons } from "../atoms/LegendIcons";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type IProps = BaseStyleFormProps;

interface FieldInfo {
  name: string;
  d_type: string;
}

interface IState {
  fields: FieldInfo[];
  fieldValues: string[];
  selectedField: string;
  selectedValue: string;
  styleList: IRule[];
}

class MultipleStyleForm extends BaseStyleForm<IProps, IState> {
  private pointSymbolizerRef = React.createRef<PointSymbolizer>();

  constructor(props: BaseStyleFormProps) {
    super(props);

    this.state = {
      fields: [],
      fieldValues: [],
      selectedField: "",
      selectedValue: "",
      styleList: [
        {
          title: "default",
          style: this.getRandomStyle(),
        },
      ],
    };
  }

  componentDidMount() {
    const layerId =
        this.props.layerId || this.props.mapVM.getLayerOfInterest();

    if (!layerId) return;

    const currentStyle =
        this.props.mapVM.getDALayer(layerId)?.style?.style;

    if (currentStyle) {
      const styleList: IRule[] = [
        {
          title: "default",
          style: currentStyle.default || this.getRandomStyle(),
        },
        ...(currentStyle.rules || []),
      ];

      this.setState({ styleList });
    }

    this.props.mapVM
        .getApi()
        .get(MapAPIs.DCH_LAYER_FIELDS, { uuid: layerId })
        .then((payload: FieldInfo[]) => {
          this.setState({ fields: payload || [] });
        });
  }

  getFeatureStyle(): IFeatureStyle {
    const defaultRule = this.state.styleList.find(
        (item) => item.title === "default"
    );

    const rules = this.state.styleList.filter(
        (item) => item.title !== "default"
    );

    return {
      type: "multiple",
      style: {
        default: defaultRule?.style || this.getRandomStyle(),
        rules,
      },
    };
  }

  getFieldName(fieldInfo?: FieldInfo) {
    const layerId =
        this.props.layerId || this.props.mapVM.getLayerOfInterest();

    if (!layerId || !fieldInfo) return;

    this.props.mapVM
        .getApi()
        .get(MapAPIs.DCH_LAYER_FIELD_DISTINCT_VALUE, {
          uuid: layerId,
          field_name: fieldInfo.name,
          field_type: fieldInfo.d_type,
        })
        .then((payload: string[]) => {
          this.setState({ fieldValues: payload || [] });
        });
  }

  getRandomStyle(): IGeomStyle {
    const randomColor =
        "#" +
        Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0");

    const pointStyle = this.pointSymbolizerRef.current?.getStyleParams();

    return {
      pointShape: pointStyle?.pointShape ?? "circle",
      pointSize: pointStyle?.pointSize ?? 12,
      pointRotation: pointStyle?.pointRotation ?? 0,

      strokeColor: randomColor,
      strokeWidth: 2,
      strokeOpacity: 1,

      fillColor: randomColor,
      fillOpacity: 0.65,
      fillPattern: "solid",

      lineCap: "butt",
      lineJoin: "round",
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
      },
    }));

    this.setState({ styleList });
  }

  updateStyleItem(index: number, style: IGeomStyle) {
    const styleList = this.state.styleList.map((item, i) =>
        i === index
            ? {
              ...item,
              style,
            }
            : item
    );

    this.setState({ styleList });
  }

  AddStyleItem() {
    if (!this.state.selectedField) {
      this.props.mapVM.showSnackbar("Please select field");
      return;
    }

    if (!this.state.selectedValue) {
      this.props.mapVM.showSnackbar("Please select value");
      return;
    }

    const exists = this.state.styleList.some(
        (item) =>
            item.filter?.field === this.state.selectedField &&
            item.filter?.value === this.state.selectedValue
    );

    if (exists) {
      this.props.mapVM.showSnackbar(
          "Value already added. Select other value."
      );
      return;
    }

    const styleList: IRule[] = [
      ...this.state.styleList,
      {
        title: this.state.selectedValue,
        filter: {
          field: this.state.selectedField,
          op: "==",
          value: this.state.selectedValue,
        },
        style: this.getRandomStyle(),
      },
    ];

    this.setState({ styleList });
  }

  AddAllStyleItem() {
    if (!this.state.selectedField) {
      this.props.mapVM.showSnackbar("Please select field");
      return;
    }

    const styleItems: IRule[] = this.state.fieldValues.map((value) => ({
      title: value,
      filter: {
        field: this.state.selectedField,
        op: "==",
        value,
      },
      style: this.getRandomStyle(),
    }));

    styleItems.unshift({
      title: "default",
      style: this.getRandomStyle(),
    });

    this.setState({ styleList: styleItems });
  }

  RemoveAllItems() {
    const defaultStyle =
        this.state.styleList.find((item) => item.title === "default")
            ?.style || this.getRandomStyle();

    this.setState({
      styleList: [
        {
          title: "default",
          style: defaultStyle,
        },
      ],
    });
  }

  render(): React.ReactNode {
    const layerId =
        this.props.layerId || this.props.mapVM.getLayerOfInterest();

    if (!layerId) return null;

    const layer = this.props.mapVM.getDALayer(layerId);
    const geomType = layer?.getGeomType() || [];

    const isPointLayer = geomType.some((g: string) =>
        g.toLowerCase().includes("point")
    );

    return (
        <React.Fragment>


          <fieldset>
            <legend>Select Field and Value</legend>

            <Box sx={{ flex: 1, pt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="select-field-label">
                  Select Field
                </InputLabel>

                <DASelect
                    labelId="select-field-label"
                    id="select-field-select"
                    value={this.state.selectedField}
                    label="Select Field"
                    onChange={(e) => {
                      const selectedField = e.target
                          .value as string;

                      const fieldInfo = this.state.fields.find(
                          (item) => item.name === selectedField
                      );

                      this.setState({
                        selectedField,
                        selectedValue: "",
                        fieldValues: [],
                      });

                      this.getFieldName(fieldInfo);
                    }}
                >
                  {this.state.fields
                      .filter((field) => field.d_type === "string")
                      .map((field) => (
                          <MenuItem
                              key={`${field.name}-key`}
                              value={field.name}
                          >
                            {field.name}
                          </MenuItem>
                      ))}
                </DASelect>
              </FormControl>
            </Box>


            <Box sx={{ flex: 1, pt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="select-value-label">
                  Select Value
                </InputLabel>

                <DASelect
                    labelId="select-value-label"
                    id="select-value-select"
                    value={this.state.selectedValue}
                    label="Select Value"
                    onChange={(e) =>
                        this.setState({
                          selectedValue: e.target.value as string,
                        })
                    }
                >
                  {this.state.fieldValues.map((value) => (
                      <MenuItem
                          key={`${value}-key`}
                          value={value}
                      >
                        {value}
                      </MenuItem>
                  ))}
                </DASelect>
              </FormControl>
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


            <Box sx={{ flex: 1, pt: 1 }}>
              <Button
                  onClick={() => this.AddStyleItem()}
                  fullWidth
                  color="success"
                  variant="contained"
              >
                Add Value
              </Button>
            </Box>

            <Box sx={{ flex: 1, pt: 1 }}>
              <Button
                  onClick={() => this.AddAllStyleItem()}
                  fullWidth
                  color="primary"
                  variant="contained"
              >
                Add All Value
              </Button>
            </Box>

            <Box sx={{ flex: 1, pt: 1 }}>
              <Button
                  onClick={() => this.RemoveAllItems()}
                  fullWidth
                  color="error"
                  variant="contained"
              >
                Clear
              </Button>
            </Box>
          </fieldset>

          {this.state.styleList.length > 0 && (
              <fieldset>
                <legend>Symbology Grid</legend>

                <TableContainer style={{ maxHeight: 200 }}>
                  <Table size="medium" padding="none">
                    <TableBody>
                      {this.state.styleList.map((item, index) => (
                          <TableRow key={`style-row-${index}`}>
                            <TableCell>
                              {item.title}
                            </TableCell>

                            <TableCell>
                              <LegendIcons
                                  key={`legend-icon-${index}`}
                                  mapVM={this.props.mapVM}
                                  updateStyle={(style: IGeomStyle) =>
                                      this.updateStyleItem(
                                          index,
                                          style
                                      )
                                  }
                                  index={index}
                                  geomType={geomType}
                                  style={item.style}
                              />
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </fieldset>
          )}
        </React.Fragment>
    );
  }
}

export default MultipleStyleForm;