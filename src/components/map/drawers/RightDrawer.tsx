/**
 * RightDrawer Component (with Loading Spinner)
 *
 * Flexible, resizable MUI Drawer sliding in from the right.
 * Now supports showing a loading spinner dynamically.
 */

import * as React from 'react';
import {AppBar, Box, IconButton, Slide, Toolbar, Typography, Paper, CircularProgress} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {JSX} from "react";

interface RightDrawerProps {
}

const LOCAL_STORAGE_KEY = 'rightDrawerWidth';

interface RightDrawerState {
    open: boolean;
    content: JSX.Element;
    heading: string;
    isResizing: boolean;
    lastDownX: number | null;
    width: number;
    isLoading: boolean;
}

class RightDrawer extends React.PureComponent<RightDrawerProps, RightDrawerState> {
    constructor(props: RightDrawerProps) {
        super(props);

        // Load last width from localStorage if available
        const savedWidth = localStorage.getItem(LOCAL_STORAGE_KEY);
        const width = savedWidth ? parseInt(savedWidth) : 250;

        this.state = {
            open: false,
            content: <React.Fragment/>,
            heading: '',
            isResizing: false,
            lastDownX: null,
            width: width, // use saved width
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


    openDrawer = () => this.setState({open: true});

    closeDrawer = () => this.setState({open: false, isLoading: false});

    toggleDrawer = () => this.setState((prev) => ({open: !prev.open}));

    setContent = (heading: string, content: JSX.Element) => {
        this.setState({heading, content, isLoading: false});
        this.openDrawer();
    };

    setHeading = (heading: string) => {
        this.setState({heading});
    };

    startLoading = (heading?: string) => {
        this.setState({isLoading: true, heading: heading ?? this.state.heading});
        this.openDrawer();
    };

    stopLoading = () => {
        this.setState({isLoading: false});
    };

    handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        this.setState({isResizing: true, lastDownX: e.clientX});
    };

    handleMouseMove = (e: MouseEvent) => {
        if (!this.state.isResizing) return;

        const offsetRight = document.body.offsetWidth - e.clientX;
        const minWidth = 200;
        const maxWidth = 600;
        if (offsetRight >= minWidth && offsetRight <= maxWidth) {
            this.setState({width: offsetRight});
            this.saveWidthToStorage(offsetRight); // save new width live
        }
    };

    handleMouseUp = () => {
        this.setState({isResizing: false});
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
        return this.state.open; // you were missing 'return'
    }

    render() {
        const { open, heading, content, width, isLoading } = this.state;

        return (
            <>
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
                            zIndex: 1301, // above Slide but below AppBar
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d0d0d0')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                    />
                )}

                <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: `${width}px`,
                            minWidth: '200px',
                            bgcolor: 'background.paper',
                            height: '100%',
                            boxShadow: 4,
                            borderLeft: '1px solid #ccc',
                            position: 'fixed',
                            right: 0,
                            top: 0,
                            zIndex: 1300,
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
                </Slide>
            </>
        );
    }



}

export default RightDrawer;
// 👇 Use a different name for the type
export type RightDrawerHandle = typeof RightDrawer.prototype;
