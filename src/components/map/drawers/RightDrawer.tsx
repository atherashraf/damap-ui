import * as React from 'react';
import {
    AppBar,
    Box,
    IconButton,
    Toolbar,
    Typography,
    Paper,
    CircularProgress,
    Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { JSX } from 'react';

const LOCAL_STORAGE_KEY = 'rightDrawerWidth';

interface RightDrawerProps {
    children?: React.ReactNode;
    /** AppBar color */
    appBarColor?: 'primary' | 'secondary' | 'default' | 'transparent' | 'inherit';
    /** AppBar height in px */
    appBarHeight?: number;
    /** Initial width if nothing saved */
    defaultWidth?: number;
    /** Min/Max resize bounds */
    minWidth?: number;
    maxWidth?: number;
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
    static defaultProps: Partial<RightDrawerProps> = {
        appBarColor: 'secondary',
        appBarHeight: 40,
        defaultWidth: 350,
        minWidth: 200,
        maxWidth: 1200,
    };

    constructor(props: RightDrawerProps) {
        super(props);

        // Start with defaultWidth; we’ll override from localStorage in componentDidMount
        const width = props.defaultWidth ?? 350;

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

    // ---------- persistence ----------
    private saveWidthToStorage = (width: number) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, width.toString());
        } catch (err) {
            // non-blocking
            console.error('Error saving rightDrawer width:', err);
        }
    };

    // ---------- public API (kept same names) ----------
    /** Show (unhide) while preserving content & width */
    openDrawer = () => this.setState({ open: true });

    /** Hide but keep content & width */
    hideDrawer = () => this.setState({ open: false });

    /** Close and clear everything */
    closeDrawer = () => {
        this.setState({
            open: false,
            heading: '',
            content: null,
            isLoading: false,
        });
    };

    /** Set/replace content; opens by default; width preserved unless provided */
    setContent = (heading: string, content: JSX.Element | null, open: boolean = true, width?: number) => {
        this.setState((prev) => ({
            heading,
            content,
            isLoading: false,
            open,
            width: width ?? prev.width, // keep current width unless new one provided
        }));
    };

    /** Begin loading spinner (also opens) */
    startLoading = (heading?: string) => {
        this.setState((prev) => ({
            isLoading: true,
            heading: heading ?? prev.heading,
            open: true,
        }));
    };

    /** Stop spinner */
    stopLoading = () => {
        this.setState({ isLoading: false });
    };

    /** Programmatically set width (clamped & persisted) */
    setWidth = (width: number) => {
        const minWidth = this.props.minWidth!;
        const maxWidth = this.props.maxWidth!;
        const clamped = Math.max(minWidth, Math.min(maxWidth, width));
        this.setState({ width: clamped });
        this.saveWidthToStorage(clamped);
    };

    /** Get current width */
    getWidth = () => this.state.width;

    /** Is open? */
    isOpen = () => this.state.open;

    // ---------- resize handlers ----------
    handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        document.body.style.cursor = 'ew-resize';
        (document.body.style as any).userSelect = 'none';
        this.setState({ isResizing: true, lastDownX: e.clientX });
    };

    handleMouseMove = (e: MouseEvent) => {
        if (!this.state.isResizing) return;

        const minWidth = this.props.minWidth!;
        const maxWidth = this.props.maxWidth!;

        // Use viewport width for robust calculations
        const viewportWidth =
            window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const offsetRight = viewportWidth - e.clientX;
        const next = Math.max(minWidth, Math.min(maxWidth, offsetRight));

        if (next !== this.state.width) {
            this.setState({ width: next });
        }
    };

    handleMouseUp = () => {
        if (this.state.isResizing) {
            this.saveWidthToStorage(this.state.width);
        }
        document.body.style.cursor = '';
        (document.body.style as any).userSelect = '';
        this.setState({ isResizing: false });
    };

    // ---------- lifecycle ----------
    componentDidMount() {
        // init width from localStorage (safer here than in constructor for SSR)
        try {
            const savedWidth = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedWidth) {
                const parsed = parseInt(savedWidth, 10);
                if (!Number.isNaN(parsed)) {
                    this.setState({ width: parsed });
                }
            }
        } catch {
            /* ignore */
        }

        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }

    // ---------- render ----------
    render() {
        const { open, heading, content, width, isLoading } = this.state;
        const { children, appBarColor = 'secondary', appBarHeight = 40, minWidth } = this.props;

        return (
            <>
                {/* Unhide tab (only when we have content and the drawer is hidden) */}
                {!open && content && (
                    <Box
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
                            zIndex: 1400, // above any mounted content
                            writingMode: 'vertical-rl',
                            textAlign: 'center',
                            userSelect: 'none',
                            fontSize: 12,
                        }}
                    >
                        Tap to Expand
                    </Box>
                )}

                {/* Drawer (unmounted when hidden to avoid overlay issues) */}
                <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                    <Box
                        sx={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            width: `${width}px`,
                            minWidth: `${minWidth}px`,
                            height: '100%',
                            zIndex: 1300,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            borderLeft: '1px solid #ccc',
                        }}
                    >
                        {/* Left-edge internal resize handle */}
                        <Box
                            onMouseDown={this.handleMouseDown}
                            sx={{
                                position: 'absolute',
                                left: -3, // slightly outside to ensure easy hit
                                top: 0,
                                bottom: 0,
                                width: 8, // a bit wider for easier grab
                                cursor: 'ew-resize',
                                bgcolor: '#e0e0e0',
                                zIndex: 2,
                                pointerEvents: open ? 'auto' : 'none', // safety
                                '&:hover': { bgcolor: '#d5d5d5' },
                                '&:active': { bgcolor: '#cfcfcf' },
                            }}
                        />

                        <AppBar position="static" color={appBarColor} sx={{ height: appBarHeight, justifyContent: 'center' }}>
                            <Toolbar variant="dense" sx={{ minHeight: `${appBarHeight}px !important`, px: 1 }}>
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
                                zIndex: 1,
                            }}
                            elevation={0}
                        >
                            <Box sx={{ flexGrow: 1, p: 2, display: 'flex', justifyContent: 'center' }}>
                                {isLoading ? (
                                    <CircularProgress size={40} thickness={4} />
                                ) : content ? (
                                    content
                                ) : (
                                    children
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
/** Keep your existing external type usage intact */
export type RightDrawerHandle = typeof RightDrawer.prototype;
