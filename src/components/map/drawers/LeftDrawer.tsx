/**
 * LeftDrawer Component
 *
 * A flexible MUI-based drawer that slides in from the left.
 * Allows dynamically setting content and heading.
 * Can be controlled programmatically (open, close, toggle).
 *
 * Features:
 * - Slide-in animation (MUI Slide)
 * - Dynamic content injection
 * - Supports global access via LeftDrawerContext
 *
 */

import * as React from "react";
import {Slide, AppBar, Toolbar, IconButton, Typography, Paper} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface LeftDrawerProps {
  initState?: boolean;
}

interface LeftDrawerState {
  open: boolean;
  content: JSX.Element;
  heading: string;
}

class LeftDrawer extends React.PureComponent<LeftDrawerProps, LeftDrawerState> {
  constructor(props: LeftDrawerProps) {
    super(props);
    this.state = {
      open: props.initState || false,
      content: <React.Fragment />,
      heading: "",
    };
  }

  openDrawer = () => this.setState({ open: true });

  closeDrawer = () => this.setState({ open: false });

  toggleDrawer = () => this.setState((prev) => ({ open: !prev.open }));

  setContent = (heading: string, content: JSX.Element) => {
    this.setState({ heading, content });
    this.openDrawer();
  };

  setHeading = (heading: string) => {
    this.setState({ heading });
  };

  render() {
    const { open, content, heading } = this.state;

    return (
        <Slide direction="right" in={open} mountOnEnter unmountOnExit>
          <div style={{width: "250px",
              // height: "99%",
              // display: "flex",
              backgroundColor: "white",
              // padding: 4,
              overflow: "auto",
              // border: "black 1px solid"
          }}>
            {/* AppBar for Heading */}
            <AppBar position="static" color="primary" sx={{ height: "40px" }}>
              <Toolbar variant="dense" sx={{ minHeight: "40px !important", p: 0 }}>
                <Typography variant="h6" sx={{ flexGrow: 1, fontSize: 16, ml: 1 }}>
                  {heading}
                </Typography>
                <IconButton size="small" onClick={this.closeDrawer} sx={{ color: "white" }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Toolbar>
            </AppBar>

            {/* Content Area */}
            <Paper
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  overflowY: 'auto',
                  boxShadow: '4px 0px 12px rgba(0,0,0,0.2)', // Rightward shadow
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                }}
                elevation={0}
            >

            {content}
            </Paper>
          </div>
        </Slide>
    );
  }
}

export default LeftDrawer;
