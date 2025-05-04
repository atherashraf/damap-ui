import * as React from 'react';
import { Box, IconButton, CircularProgress, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';



interface BottomDrawerProps {
    target: string;
}

interface BottomDrawerState {
    open: boolean;
    container: HTMLElement | null;
    paperHeight: number;
    content: JSX.Element | null;
    isLoading: boolean;
    isHidden: boolean;
}

class BottomDrawer extends React.PureComponent<BottomDrawerProps, BottomDrawerState> {
    // originalMapHeight: number | null = null;

    constructor(props: BottomDrawerProps) {
        super(props);
        ;

        this.state = {
            open: false,
            container: null,
            paperHeight: 0,
            content: null,
            isLoading: false,
            isHidden: false,
        };
    }

    componentDidMount() {
        this.setState({ container: document.getElementById(this.props.target) });
    }

    openDrawer = (height: number = this.state.paperHeight) => {
        this.setState({ open: true, paperHeight: height });
    };

    closeDrawer = () => {
        this.setState({ open: false, isLoading: false, paperHeight: 0 });
    };

    toggleDrawer = () => {
        const { open, paperHeight } = this.state;
        if (!open) this.openDrawer(paperHeight);
        else this.closeDrawer();
    };

    isOpen = () => this.state.open;

    setContent = (content: JSX.Element) => {
        this.setState({ content, isLoading: false });
    };

    clearContent = () => {
        this.setState({ content: null, isLoading: false });
    };

    startLoading = () => {
        this.setState({ isLoading: true, content: null });
    };

    stopLoading = () => {
        this.setState({ isLoading: false });
    };

    handleHide = () => {
        this.setState({ isHidden: true });
    };

    handleUnhide = () => {
        this.setState({ isHidden: false });
    };
    isHidden() {
        return this.state.isHidden;
    }




    newMousePos = (clientY: number) => {
        const bodyHeight = document.body.offsetHeight;
        const newHeight = bodyHeight - clientY;
        const minHeight = 150;
        const maxHeight = 600;

        if (newHeight >= minHeight && newHeight <= maxHeight) {
            this.setState({ paperHeight: newHeight });
        }
    };

    handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const moveHandler = (moveEvent: MouseEvent) => {
            this.newMousePos(moveEvent.clientY);
        };
        const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    };

    render() {
        const { open, paperHeight, content, isLoading, isHidden } = this.state;

        return (
            <>
                <Slide direction="up" in={open && !isHidden} mountOnEnter unmountOnExit>
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${paperHeight}px`,
                            bgcolor: 'background.paper',
                            zIndex: 1300,
                            boxShadow: '0px -2px 10px rgba(0,0,0,0.2)',
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Resizer Bar */}
                        <Box
                            sx={{
                                height: 10,
                                cursor: 'ns-resize',
                                bgcolor: 'grey.300',
                            }}
                            onMouseDown={this.handleMouseDown}
                        />

                        {/* Header Toolbar */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            px: 0.1,
                            py: 0.3,
                        }}>
                            <IconButton size="small" onClick={this.closeDrawer} title="Close Drawer">
                                <CloseIcon />
                            </IconButton>
                            <IconButton size="small" onClick={this.handleHide} title="Hide Drawer">
                                <KeyboardArrowDownIcon />
                            </IconButton>
                        </Box>

                        {/* Drawer Content */}
                        <Box sx={{
                            flex: 1,
                            overflowY: 'auto',
                            px: 2,
                            py: 1,
                        }}>
                            {isLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                    <CircularProgress size={40} thickness={4} />
                                </Box>
                            ) : (
                                content ?? <Box sx={{ py: 2 }}>No Content</Box>
                            )}
                        </Box>
                    </Box>
                </Slide>

                {/* Tap-to-expand when hidden */}
                {isHidden && (
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 36,
                            bgcolor: 'secondary.light',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0px -2px 6px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            zIndex: 1300,
                        }}
                        onClick={this.handleUnhide}
                    >
                        <Box sx={{ color: 'secondary.contrastText' }}>▲ Tap to expand</Box>
                    </Box>
                )}
            </>
        );
    }


}

export default BottomDrawer;
