import * as React from "react";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Paper,
    Box,
    Fade,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { JSX } from "react";

interface LeftDrawerProps {
    initState?: boolean;
}

interface LeftDrawerState {
    open: boolean;
    content: JSX.Element | null;
    heading: string;
    width: number;
    isResizing: boolean;
    lastDownX: number | null;
}

class LeftDrawer extends React.PureComponent<LeftDrawerProps, LeftDrawerState> {
    constructor(props: LeftDrawerProps) {
        super(props);
        this.state = {
            open: props.initState || false,
            content: null,
            heading: "",
            width: 250,
            isResizing: false,
            lastDownX: null,
        };
    }

    openDrawer = () => this.setState({ open: true });

    hideDrawer = () => this.setState({ open: false }); // keeps content

    closeDrawer = () => {
        this.setState({
            open: false,
            heading: "",
            content: null,
        });
    };

    toggleDrawer = () => this.setState((prev) => ({ open: !prev.open }));

    setContent = (heading: string, content: JSX.Element) => {
        this.setState({ heading, content, open: true });
    };

    setHeading = (heading: string) => {
        this.setState({ heading });
    };

    isOpen() {
        return this.state.open;
    }

    handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        this.setState({ isResizing: true, lastDownX: e.clientX });
    };

    handleMouseMove = (e: MouseEvent) => {
        if (!this.state.isResizing) return;

        const offsetLeft = e.clientX;
        const minWidth = 200;
        const maxWidth = 500;
        if (offsetLeft >= minWidth && offsetLeft <= maxWidth) {
            this.setState({ width: offsetLeft });
        }
    };

    handleMouseUp = () => {
        this.setState({ isResizing: false });
    };

    componentDidMount() {
        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
    }

    componentWillUnmount() {
        document.removeEventListener("mousemove", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);
    }

    render() {
        const { open, heading, content, width } = this.state;

        return (
            <>
                {/* Show Tab */}
                {!open && content && (
                    <Box
                        onClick={this.openDrawer}
                        sx={{
                            position: "fixed",
                            top: "50%",
                            left: 0,
                            height: "200px",
                            transform: "translateY(-50%)",
                            bgcolor: "#1976d2",
                            color: "white",
                            px: 1,
                            py: 0.5,
                            borderRadius: "0 4px 4px 0",
                            cursor: "pointer",
                            zIndex: 1201,
                            writingMode: "vertical-rl",
                            textAlign: "center",
                            userSelect: "none",
                            fontSize: 12,
                        }}
                    >
                        Tap to Expand
                    </Box>
                )}

                {/* Resize handle on right edge of drawer */}
                {open && (
                    <div
                        onMouseDown={this.handleMouseDown}
                        style={{
                            position: "fixed",
                            top: 0,
                            bottom: 0,
                            left: `${this.state.width}px`,
                            width: "6px",
                            cursor: "ew-resize",
                            backgroundColor: "#e0e0e0",
                            zIndex: 1200,
                        }}
                        onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#d0d0d0")
                        }
                        onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = "#e0e0e0")
                        }
                    />
                )}

                {/* Drawer */}
                <Fade in={open}>
                    <Box
                        sx={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: `${width}px`,
                            minWidth: "200px",
                            height: "100%",
                            bgcolor: "background.paper",
                            zIndex: 1300,
                            transform: open ? "translateX(0)" : `-100%`,
                            transition: "transform 0.3s ease",
                            display: "flex",
                            flexDirection: "column",
                            borderRight: "1px solid #ccc",
                            boxShadow: 4,
                        }}
                    >
                        <AppBar
                            position="static"
                            color="secondary"
                            sx={{ height: 40, justifyContent: "center" }}
                        >
                            <Toolbar
                                variant="dense"
                                sx={{ minHeight: "40px !important", p: 0 }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{ flexGrow: 1, fontSize: 16, ml: 1 }}
                                >
                                    {heading}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={this.hideDrawer}
                                    sx={{ color: "white" }}
                                >
                                    <VisibilityOffIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={this.closeDrawer}
                                    sx={{ color: "white" }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Toolbar>
                        </AppBar>

                        <Paper
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                width: "100%",
                                height: "100%",
                                overflowY: "auto",
                                boxShadow: "4px 0px 12px rgba(0,0,0,0.2)",
                                borderTopRightRadius: 8,
                                borderBottomRightRadius: 8,
                            }}
                            elevation={0}
                        >
                            {content}
                        </Paper>
                    </Box>
                </Fade>
            </>
        );
    }
}

export default LeftDrawer;
export type LeftDrawerHandle = typeof LeftDrawer.prototype;
