import React from "react";
//@ts-ignore
import { ColorResult, SketchPicker } from "react-color";
import autoBind from "auto-bind";
import {
  Box,
  Button,
  Popper,
  ClickAwayListener,
  Typography,
} from "@mui/material";
import ColorUtils from "@/utils/colorUtils";

interface CustomColorPickerProps {
  label?: string;
  color: string | undefined;
  isAlpha: boolean;
  onChange?: (color: string) => void;
}

interface CustomColorPickerState {
  color: string | undefined;
  anchorEl: HTMLElement | null;
}

class DAColorPicker extends React.PureComponent<
    CustomColorPickerProps,
    CustomColorPickerState
> {
  state: CustomColorPickerState = {
    color: this.props.color || ColorUtils.getRandomHexColor(),
    anchorEl: null,
  };

  constructor(props: CustomColorPickerProps) {
    super(props);
    autoBind(this);
  }

  handleColorChange(color: ColorResult) {
    let hexColor = color.hex;
    if (this.props?.isAlpha && color?.rgb?.a !== undefined) {
      const alphaHex = Math.round(color.rgb.a * 255)
          .toString(16)
          .padStart(2, "0");
      hexColor = color.hex + alphaHex;
    }
    this.setState({ color: hexColor });
    if (this.props.onChange) this.props.onChange(hexColor);
  }

  handleButtonClick(event: React.MouseEvent<HTMLElement>) {
    this.setState({
      anchorEl: this.state.anchorEl ? null : event.currentTarget,
    });
  }

  handleClose() {
    this.setState({ anchorEl: null });
  }

  getColor() {
    return this.state.color;
  }

  render() {
    const { label, isAlpha } = this.props;
    const { anchorEl, color } = this.state;
    const open = Boolean(anchorEl);

    return (
        <Box>
          {label && (
              <Typography variant="subtitle2" gutterBottom>
                {label}
              </Typography>
          )}

          <Button
              variant="outlined"
              onClick={this.handleButtonClick}
              sx={{
                width: 44,
                height: 36,
                minWidth: 44,
                border: "1px solid #ccc",
                padding: 0,
              }}
          >
            <Box
                sx={{
                  width: 28,
                  height: 28,
                  backgroundColor: color,
                  border: "1px solid #999",
                  borderRadius: "50%",
                  margin: "auto",
                }}
            />
          </Button>

          <Popper
              open={open}
              anchorEl={anchorEl}
              placement="bottom-start"
              modifiers={[
                {
                  name: 'zIndex',
                  enabled: true,
                  phase: 'write',
                  fn({ state }) {
                    state.styles.popper.zIndex = '1500';
                  },
                },
              ]}
              style={{ zIndex: 1500 }} // fallback
          >
            <ClickAwayListener onClickAway={this.handleClose}>
              <Box
                  p={1}
                  bgcolor="white"
                  border="1px solid #ccc"
                  borderRadius={1}
                  boxShadow={3}
                  zIndex={9999}
              >
                <SketchPicker
                    color={color}
                    onChange={this.handleColorChange}
                    disableAlpha={!isAlpha}
                />
              </Box>
            </ClickAwayListener>
          </Popper>
        </Box>
    );
  }
}

export default DAColorPicker;
