import * as React from 'react';
import {
    AppBar,
    Box,
    IconButton,
    Toolbar,
    Typography,
    Paper,
    CircularProgress,
    Fade
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {JSX} from "react";

interface RightDrawerProps {}

const LOCAL_STORAGE_KEY = 'rightDrawerWidth';

interface RightDrawerState {
    open: boolean;
    content: JSX.Element | null;
    heading: string;
    isResizing: boolean;
    lastDownX: number | null;
    width: number;
    isLoading: boolean;
}

class RightDrawer extends React.PureComponent<RightDrawerProps, RightDrawerState> {
    constructor(props: RightDrawerProps) {
        super(props);

        const savedWidth = localStorage.getItem(LOCAL_STORAGE_KEY);
        const width = savedWidth ? parseInt(savedWidth) : 300;

        this.state = {
            open: false,
            content: null,
            heading: '',
            isResizing: false,
            lastDownX: null,
            width,
            isLoading: false,
        };
    }

    saveWidthToStorage(width: number) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, width.toString());
        } catch (err) {
            console.error('Error saving rightDrawer width:', err);
        }
    }

    openDrawer = () => this.setState({ open: true });

    hideDrawer = () => this.setState({ open: false }); // keeps content

    closeDrawer = () => {
        this.setState({
            open: false,
            heading: '',
            content: null,
            isLoading: false,
        });
    };

    setContent = (heading: string, content: JSX.Element) => {
        this.setState({ heading, content, isLoading: false, open: true });
    };

    startLoading = (heading?: string) => {
        this.setState({
            isLoading: true,
            heading: heading ?? this.state.heading,
            open: true,
        });
    };

    stopLoading = () => {
        this.setState({ isLoading: false });
    };

    handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        this.setState({ isResizing: true, lastDownX: e.clientX });
    };

    handleMouseMove = (e: MouseEvent) => {
        if (!this.state.isResizing) return;
        const offsetRight = document.body.offsetWidth - e.clientX;
        const minWidth = 200;
        const maxWidth = 600;
        if (offsetRight >= minWidth && offsetRight <= maxWidth) {
            this.setState({ width: offsetRight });
            this.saveWidthToStorage(offsetRight);
        }
    };

    handleMouseUp = () => {
        this.setState({ isResizing: false });
    };

    componentDidMount() {
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }

    isOpen() {
        return this.state.open;
    }

    render() {
        const { open, heading, content, width, isLoading } = this.state;

        return (
            <>
                {/* Show Tab */}
                {!open && content && (
                    <Box
                        onClick={this.openDrawer}
                        sx={{
                            position: 'fixed',
                            top: '50%',
                            height:"200px",
                            right: 0,
                            transform: 'translateY(-50%)',
                            bgcolor: '#1976d2',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: '4px 0 0 4px',
                            cursor: 'pointer',
                            zIndex: 1201,
                            writingMode: 'vertical-rl',
                            textAlign: 'center',
                            userSelect: 'none',
                            fontSize: 12,
                        }}
                    >
                        Tap to Expand
                    </Box>
                )}

                {/* Resize bar */}
                {open && (
                    <div
                        onMouseDown={this.handleMouseDown}
                        style={{
                            position: 'fixed',
                            top: 0,
                            bottom: 0,
                            right: `${width}px`,
                            width: '6px',
                            cursor: 'ew-resize',
                            backgroundColor: '#e0e0e0',
                            zIndex: 1200,
                        }}
                    />
                )}

                {/* Always mounted, only animated show/hide */}
                <Fade in={open}>
                    <Box
                        sx={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            width: `${width}px`,
                            minWidth: '200px',
                            height: '100%',
                            zIndex: 1300,
                            transform: open ? 'translateX(0)' : `translateX(${width}px)`,
                            transition: 'transform 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            borderLeft: '1px solid #ccc',
                        }}
                    >
                        <AppBar
                            position="static"
                            color="secondary"
                            sx={{ height: 40, justifyContent: 'center' }}
                        >
                            <Toolbar variant="dense" sx={{ minHeight: '40px !important', px: 1 }}>
                                <Typography variant="h6" sx={{ flexGrow: 1, fontSize: 16 }}>
                                    {heading}
                                </Typography>

                                <IconButton size="small" onClick={this.hideDrawer} sx={{ color: 'white' }}>
                                    <VisibilityOffIcon fontSize="small" />
                                </IconButton>

                                <IconButton size="small" onClick={this.closeDrawer} sx={{ color: 'white' }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Toolbar>
                        </AppBar>

                        <Paper
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                height: '100%',
                                overflowY: 'auto',
                                boxShadow: '-4px 0px 12px rgba(0,0,0,0.2)',
                                borderTopLeftRadius: 8,
                                borderBottomLeftRadius: 8,
                                position: 'relative',
                            }}
                            elevation={0}
                        >
                            <Box sx={{ flexGrow: 1, p: 2, display: 'flex', justifyContent: 'center' }}>
                                {isLoading ? (
                                    <CircularProgress size={40} thickness={4} />
                                ) : (
                                    content
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </Fade>
            </>
        );
    }
}

export default RightDrawer;
export type RightDrawerHandle = typeof RightDrawer.prototype;
