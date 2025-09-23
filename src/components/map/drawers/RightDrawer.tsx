import * as React from 'react';
import {
    AppBar, Box, IconButton, Toolbar, Typography, Paper, CircularProgress, Fade
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {JSX} from 'react';

const LOCAL_STORAGE_KEY = 'rightDrawerWidth';

interface RightDrawerProps {
    children?: React.ReactNode;
}

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

        const savedWidth = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
        const width = savedWidth ? parseInt(savedWidth) : 350;

        this.state = {
            open: false, content: null, heading: '', isResizing: false, lastDownX: null, width, isLoading: false,
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

    // keeps content, just hides
    hideDrawer = () => this.setState({open: false});

    setWidth = (width: number) => this.setState({width});

    closeDrawer = () => {
        this.setState({
            open: false, heading: '', content: null, isLoading: false,
        });
    };

    setContent = (heading: string, content: JSX.Element | null, open: boolean = false, width: number = 350) => {
        this.setState({heading, content, isLoading: false, open, width});
    };

    startLoading = (heading?: string) => {
        this.setState({
            isLoading: true, heading: heading ?? this.state.heading, open: true,
        });
    };

    stopLoading = () => {
        this.setState({isLoading: false});
    };

    handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        document.body.style.cursor = 'ew-resize';
        (document.body.style as any).userSelect = 'none';
        this.setState({isResizing: true, lastDownX: e.clientX});
    };

    handleMouseMove = (e: MouseEvent) => {
        if (!this.state.isResizing) return;

        // Use viewport width for robust calculations
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const offsetRight = viewportWidth - e.clientX;
        const minWidth = 200;
        const maxWidth = 1200;
        const next = Math.max(minWidth, Math.min(maxWidth, offsetRight));
        if (next !== this.state.width) {
            this.setState({width: next});
        }
    };

    handleMouseUp = () => {
        if (this.state.isResizing) {
            this.saveWidthToStorage(this.state.width);
        }
        document.body.style.cursor = '';
        (document.body.style as any).userSelect = '';
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
        return this.state.open;
    }

    render() {
        const {open, heading, content, width, isLoading} = this.state;

        return (<>
                {/* Show Tab */}
                {!open && content && (<Box
                        onClick={this.openDrawer}
                        sx={{
                            position: 'fixed',
                            top: '50%',
                            height: '200px',
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
                    </Box>)}

                {/* Drawer (with internal left-edge resize handle) */}
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
                        {/* Left-edge internal resize handle (higher z-index so it's above content) */}
                        <Box
                            onMouseDown={this.handleMouseDown}
                            sx={{
                                position: 'absolute', left: -3,            // slightly outside to ensure easy hit
                                top: 0, bottom: 0, width: 8,            // a bit wider for easier grab
                                cursor: 'ew-resize', bgcolor: '#e0e0e0', zIndex: 2,           // above content/appbar/paper
                                '&:hover': {bgcolor: '#d5d5d5'}, '&:active': {bgcolor: '#cfcfcf'},
                            }}
                        />

                        <AppBar position="static" color="secondary" sx={{height: 40, justifyContent: 'center'}}>
                            <Toolbar variant="dense" sx={{minHeight: '40px !important', px: 1}}>
                                <Typography variant="h6" sx={{flexGrow: 1, fontSize: 16}}>
                                    {heading}
                                </Typography>

                                <IconButton size="small" onClick={this.hideDrawer} sx={{color: 'white'}}>
                                    <VisibilityOffIcon fontSize="small"/>
                                </IconButton>

                                <IconButton size="small" onClick={this.closeDrawer} sx={{color: 'white'}}>
                                    <CloseIcon fontSize="small"/>
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
                                zIndex: 1, // ensure the handle (zIndex:2) sits above
                            }}
                            elevation={0}
                        >

                            <Box sx={{flexGrow: 1, p: 2, display: 'flex', justifyContent: 'center'}}>
                                {isLoading ? (<CircularProgress size={40}
                                                                thickness={4}/>) : (content ? content : this.props.children)}
                            </Box>
                        </Paper>
                    </Box>
                </Fade>
            </>);
    }
}

export default RightDrawer;
export type RightDrawerHandle = typeof RightDrawer.prototype;
