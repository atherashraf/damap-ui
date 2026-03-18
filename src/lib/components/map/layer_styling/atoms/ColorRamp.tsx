import * as React from "react";
import {JSX, RefObject} from "react";
import Button from "@mui/material/Button";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Box, IconButton } from "@mui/material";
import { IBaseMapProps } from "@/types/typeDeclarations";
import DADialogBox from "@/components/base/DADialogBox";
import DAColorPicker from "@/components/map/layer_styling/DAColorPicker";
import _ from "@/utils/lodash";

interface IProps extends IBaseMapProps {}

interface IState {
  backgroundColor: string;
  colors: string[];
}

class ColorRamp extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      backgroundColor: "linear-gradient(to right, white 0%, darkblue 100%)",
      colors: ["#701d1d", "#dcdf95"], // ✅ Only two initial colors
    };
  }

  componentDidMount() {
    this.createColorRamp();
  }

  getColors() {
    return [...this.state.colors];
  }

  getColorRamp(count: number): string[] {
    const { colors } = this.state;
    if (colors.length < 2 || count < 2) return colors;
    const result: string[] = [];

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const scaledIndex = t * (colors.length - 1);
      const lowerIndex = Math.floor(scaledIndex);
      const upperIndex = Math.ceil(scaledIndex);
      const localT = scaledIndex - lowerIndex;

      const rgba1 = _.hex2rgba(colors[lowerIndex]);
      const rgba2 = _.hex2rgba(colors[upperIndex]);
      if (!rgba1 || !rgba2) return result;

      const interpolate = (a: number, b: number) => Math.round((1 - localT) * a + localT * b);
      const r = interpolate(rgba1.r, rgba2.r).toString(16).padStart(2, "0");
      const g = interpolate(rgba1.g, rgba2.g).toString(16).padStart(2, "0");
      const b = interpolate(rgba1.b, rgba2.b).toString(16).padStart(2, "0");
      const a = interpolate(rgba1.a, rgba2.a).toString(16).padStart(2, "0");

      result.push(`#${r}${g}${b}${a}`);
    }

    return result;
  }

  getColor(noOfClasses: number, valueIndex = -1): string {
    if (valueIndex === -1) return _.randomColor();
    const colors = this.getColors();
    const index = (valueIndex / (noOfClasses - 1)) * (colors.length - 1);
    const mod = index % (colors.length - 1);
    let c;
    if (mod === 0) {
      c = colors[index];
    } else {
      const f = Math.floor(index);
      const x1 = (f / (colors.length - 1)) * (noOfClasses - 1);
      const x2 = ((f + 1) / (colors.length - 1)) * (noOfClasses - 1);
      const rgba1 = _.hex2rgba(colors[f]);
      const rgba2 = _.hex2rgba(colors[f + 1]);
      const r = Math.round(_.linearInterpolation(valueIndex, [x1, rgba1?.r || 0], [x2, rgba2?.r || 0])).toString(16);
      const g = Math.round(_.linearInterpolation(valueIndex, [x1, rgba1?.g || 0], [x2, rgba2?.g || 0])).toString(16);
      const b = Math.round(_.linearInterpolation(valueIndex, [x1, rgba1?.b || 0], [x2, rgba2?.b || 0])).toString(16);
      const a = Math.round(_.linearInterpolation(valueIndex, [x1, rgba1?.a || 0], [x2, rgba2?.a || 0])).toString(16);
      c = `#${r}${g}${b}${a}`;
    }

    return c;
  }

  createColorRamp() {
    const { colors } = this.state;
    let backgroundColor: string = "linear-gradient(to right";
    const totalColors = colors.length;
    colors.forEach((c, index) => {
      const percent = (index / (totalColors - 1)) * 100;
      backgroundColor += `, ${c} ${percent}%`;
    });
    backgroundColor += ")";
    this.setState(() => ({ backgroundColor: backgroundColor }));
    this.props.mapVM.getDialogBoxRef().current?.closeDialog();
  }

  async addColor() {
    const newColor = _.randomColor();
    await this.setState(() => ({ colors: [...this.state.colors, newColor] }));
    this.props.mapVM.getDialogBoxRef().current?.updateContents(this.getDialogContent());
  }

  removeColor(index: number) {
    const updated = [...this.state.colors];
    if (updated.length > 2) {
      updated.splice(index, 1);
      this.setState({ colors: updated });
      this.props.mapVM.getDialogBoxRef().current?.updateContents(this.getDialogContent());
    }
  }

  handleColorChange(index: number, color: string) {
    const colors = [...this.state.colors];
    colors[index] = color;
    this.setState(() => ({ colors: colors }));
  }

  getDialogContent(): JSX.Element {
    return (
        <Box
            sx={{
              p: 2,
              width: 400,
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "flex-start",
            }}
        >
          {this.state.colors.map((c: string, index: number) => (
              <Box key={"color-wrap-" + index} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <DAColorPicker
                    key={"color-" + index}
                    onChange={(color: string) => this.handleColorChange(index, color)}
                    label={"Color " + index}
                    color={c}
                    isAlpha={true}
                />
                {this.state.colors.length > 2 && (
                    <Button size="small" onClick={() => this.removeColor(index)}>
                      Remove
                    </Button>
                )}
              </Box>
          ))}
        </Box>
    );
  }

  handleClick() {
    const dialogRef: RefObject<DADialogBox | null> = this.props.mapVM.getDialogBoxRef();
    dialogRef.current?.openDialog({
      title: "Create Color Ramp",
      content: this.getDialogContent(),
      actions: (
          <React.Fragment>
            <Button key={"add-color"} onClick={this.addColor.bind(this)}>
              Add Color
            </Button>
            <Button key={"create-ramp"} onClick={this.createColorRamp.bind(this)}>
              Create
            </Button>
          </React.Fragment>
      ),
    });
  }

  render() {
    return (
        <Box display="flex" alignItems="center">
          <Box
              style={{
                background: this.state.backgroundColor,
                width: "85%",
                height: "30px",
              }}
          />
          <IconButton style={{ width: "15%", height: 30 }} onClick={this.handleClick.bind(this)}>
            <KeyboardArrowDownIcon />
          </IconButton>
        </Box>
    );
  }
}

export default ColorRamp;
