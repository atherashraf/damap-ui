/**
 * BottomDrawer
 * ---------------------------------------------------------------------
 * A resizable, slide-in drawer anchored to the **bottom** of the screen.
 *
 * Features:
 * - Slide animation using MUI `Slide`
 * - Mounts/unmounts from DOM when hidden
 * - Mouse-driven vertical resizing with min/max bounds
 * - Height persistence via `localStorage`
 * - Optional loading state with spinner
 * - Programmatic control through imperative methods
 * - Safe recovery if height becomes 0 (falls back to saved/default height)
 *
 * Resizing:
 * - Drag the top bar of the drawer to resize (vertical)
 * - Height is clamped between `minHeight` and `maxHeight`
 *
 * Public API (via ref):
 * - openDrawer(height?)
 * - hideDrawer()
 * - unhideDrawer()
 * - closeDrawer()
 * - hideUnhideDrawer(durationMs)
 * - setContent(content)
 * - clearContent()
 * - startLoading()
 * - stopLoading()
 * - setHeight(height)
 * - getHeight()
 * - isOpen()
 * - isHidden()
 *
 * Backward-compatible (deprecated) aliases:
 * - handleHide()
 * - handleUnhide()
 */

import * as React from "react";
import { Box, IconButton, CircularProgress, Slide } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { AttributeTableRequest } from "@damap/types/typeDeclarations";
import AttributeTable from "@damap/components/map/table/AttributeTable";

const LOCAL_STORAGE_KEY = "bottomDrawerHeight";

interface BottomDrawerProps {
    target?: string;
    defaultHeight?: number;
    minHeight?: number;
    maxHeight?: number;
}

interface BottomDrawerState {
    open: boolean;
    height: number;
    content: React.ReactNode;
    isLoading: boolean;
    isHidden: boolean;
}

class BottomDrawer extends React.PureComponent<BottomDrawerProps, BottomDrawerState> {
    static defaultProps: Partial<BottomDrawerProps> = {
        defaultHeight: 240,
        minHeight: 150,
        maxHeight: 600,
    };

    private unhideTimer: number | null = null;

    constructor(props: BottomDrawerProps) {
        super(props);

        this.state = {
            open: false,
            height: props.defaultHeight ?? 240,
            content: null,
            isLoading: false,
            isHidden: false,
        };
    }

    // ---------- persistence ----------
    private saveHeightToStorage = (height: number) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, height.toString());
        } catch (err) {
            console.error("Error saving bottomDrawer height:", err);
        }
    };

    private clampHeight = (h: number) => {
        const minH = this.props.minHeight ?? 150;
        const maxH = this.props.maxHeight ?? 600;
        return Math.max(minH, Math.min(maxH, h));
    };

    private getFallbackHeight = () => {
        const defaultH = this.props.defaultHeight ?? 240;

        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            const parsed = saved ? parseInt(saved, 10) : NaN;
            if (!Number.isNaN(parsed)) return this.clampHeight(parsed);
        } catch {
            /* ignore */
        }

        return this.clampHeight(defaultH);
    };

    private clearUnhideTimer = () => {
        if (this.unhideTimer != null) {
            window.clearTimeout(this.unhideTimer);
            this.unhideTimer = null;
        }
    };

    // ---------- public API ----------
    openDrawer = (height?: number) => {
        this.setState((prev) => {
            const baseHeight = prev.height > 0 ? prev.height : this.getFallbackHeight();
            return {
                open: true,
                isHidden: false,
                height: height != null ? this.clampHeight(height) : baseHeight,
            };
        });
    };

    hideDrawer = () => {
        this.clearUnhideTimer();
        // keep mounted; just hide visually
        this.setState({ open: false, isHidden: true });
    };

    unhideDrawer = () => {
        this.clearUnhideTimer();
        this.setState((prev) => ({
            isHidden: false,
            open: true,
            height: prev.height > 0 ? prev.height : this.getFallbackHeight(),
        }));
    };

    hideUnhideDrawer = (durationMs: number) => {
        const d = Math.max(0, durationMs || 0);
        this.hideDrawer();

        this.clearUnhideTimer();
        this.unhideTimer = window.setTimeout(() => {
            this.unhideDrawer();
            this.unhideTimer = null;
        }, d);
    };

    closeDrawer = () => {
        this.clearUnhideTimer();
        this.setState({
            open: false,
            isHidden: false,
            isLoading: false,
            content: null,
        });
    };

    isOpen = () => this.state.open;
    isHidden = () => this.state.isHidden;

    setContent = (content: React.ReactNode) => {
        this.setState({ content, isLoading: false });
    };

    clearContent = () => {
        this.setState({ content: null, isLoading: false });
    };

    startLoading = () => {
        this.clearUnhideTimer();
        this.setState({
            isLoading: true,
            content: null,
            open: true,
            isHidden: false,
            height: this.state.height > 0 ? this.state.height : this.getFallbackHeight(),
        });
    };

    stopLoading = () => {
        this.setState({ isLoading: false });
    };

    setHeight = (height: number) => {
        const clamped = this.clampHeight(height);
        this.setState({ height: clamped });
        this.saveHeightToStorage(clamped);
    };

    getHeight = () => this.state.height;

    /** @deprecated Use hideDrawer() instead */
    handleHide = () => this.hideDrawer();

    /** @deprecated Use unhideDrawer() instead */
    handleUnhide = () => this.unhideDrawer();

    // ---------- resize handlers ----------
    private handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();

        document.body.style.cursor = "ns-resize";
        (document.body.style as any).userSelect = "none";

        const moveHandler = (moveEvent: MouseEvent) => {
            const viewportH =
                window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

            const next = viewportH - moveEvent.clientY;
            const clamped = this.clampHeight(next);

            if (clamped !== this.state.height) {
                this.setState({ height: clamped });
            }
        };

        const upHandler = () => {
            this.saveHeightToStorage(this.state.height);
            document.body.style.cursor = "";
            (document.body.style as any).userSelect = "";

            document.removeEventListener("mousemove", moveHandler);
            document.removeEventListener("mouseup", upHandler);
        };

        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);
    };

    // ---------- lifecycle ----------
    componentDidMount() {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!Number.isNaN(parsed)) {
                    const clamped = this.clampHeight(parsed);
                    this.setState({ height: clamped > 0 ? clamped : this.getFallbackHeight() });
                    return;
                }
            }
        } catch {
            /* ignore */
        }

        this.setState((prev) => ({
            height: prev.height > 0 ? prev.height : this.getFallbackHeight(),
        }));
    }

    componentWillUnmount() {
        this.clearUnhideTimer();
    }

    private emitLayout = () => {
        window.dispatchEvent(
            new CustomEvent("drawerLayout", {
                detail: { side: "bottom", open: this.state.open, size: this.state.open ? this.state.height : 0 },
            })
        );
    };

    componentDidUpdate(_: any, prev: BottomDrawerState) {
        if (prev.open !== this.state.open || prev.height !== this.state.height) {
            this.emitLayout();
        }
    }

    // ---------- domain helper ----------
    requestAttributeTable = (request: AttributeTableRequest) => {
        const { columns, rows, pkCols } = request;
        const tableHeight = request.tableHeight || 200;
        const toolbarHeight = 60;
        const drawerHeight = toolbarHeight + tableHeight;

        const attributeGrid = <AttributeTable columns={columns} data={rows} pkCols={pkCols} />;

        this.setContent(attributeGrid);
        this.openDrawer(drawerHeight);
    };

    render() {
        const { open, height, content, isLoading, isHidden } = this.state;

        return (
            <>
                {/* ✅ keep mounted: remove unmountOnExit/mountOnEnter */}
                <Slide direction="up" in={open}>
                    <Box
                        sx={{
                            position: "fixed",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${height}px`,
                            bgcolor: "background.paper",
                            zIndex: 1400,
                            boxShadow: "0px -2px 10px rgba(0,0,0,0.2)",
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            // ✅ important when hidden but mounted
                            pointerEvents: open ? "auto" : "none",
                        }}
                    >
                        {/* Resizer Bar */}
                        <Box
                            sx={{
                                height: 10,
                                cursor: "ns-resize",
                                bgcolor: "grey.300",
                            }}
                            onMouseDown={this.handleMouseDown}
                        />

                        {/* Header Toolbar */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                px: 0.5,
                                py: 0.25,
                            }}
                        >
                            <IconButton size="small" onClick={this.closeDrawer} title="Close Drawer">
                                <CloseIcon />
                            </IconButton>

                            <IconButton size="small" onClick={this.hideDrawer} title="Hide Drawer">
                                <KeyboardArrowDownIcon />
                            </IconButton>
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1, overflow: "hidden", px: 2, py: 0.5 }}>
                            {isLoading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                                    <CircularProgress size={40} thickness={4} />
                                </Box>
                            ) : content ? (
                                content
                            ) : (
                                <Box sx={{ py: 2 }}>No Content</Box>
                            )}
                        </Box>
                    </Box>
                </Slide>

                {/* Tap-to-expand when hidden */}
                {isHidden && (
                    <Box
                        sx={{
                            position: "fixed",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 36,
                            bgcolor: "secondary.light",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            boxShadow: "0px -2px 6px rgba(0,0,0,0.1)",
                            cursor: "pointer",
                            zIndex: 1399,
                        }}
                        onClick={this.unhideDrawer}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                this.unhideDrawer();
                            }
                        }}
                        aria-label="Tap to expand bottom drawer"
                    >
                        <Box sx={{ color: "secondary.contrastText" }}>▲ Tap to expand</Box>
                    </Box>
                )}
            </>
        );
    }
}

export default BottomDrawer;
export type BottomDrawerHandle = typeof BottomDrawer.prototype;
