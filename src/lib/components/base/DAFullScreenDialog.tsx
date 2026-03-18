/**
 * DAFullScreenDialog
 * -------------------
 *
 * A reusable full-screen dialog component based on MUI's Dialog + AppBar (Functional Version).
 *
 * Features:
 * - Open and Close via exposed methods (`handleClickOpen`, `handleClose`)
 * - Set dialog title and dynamic content via `setContent`
 * - Smooth Slide-up Transition
 *
 * Usage:
 *
 * import DAFullScreenDialog from "@/components/base/DAFullScreenDialog";
 *
 * const dialogRef = React.useRef<DAFullScreenDialogHandle>(null);
 *
 * <DAFullScreenDialog ref={dialogRef} />
 *
 * To Open and Set Content:
 * dialogRef.current?.handleClickOpen();
 * dialogRef.current?.setContent("My Title", <MyComponent />);
 *
 */

import * as React from "react";
import {
    Dialog,
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Button,
    Slide
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";

// MUI Transition for sliding dialog
const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children: React.ReactElement },
    ref: React.Ref<unknown>
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Ref Interface: Methods we expose to parent
export interface DAFullScreenDialogHandle {
    handleClickOpen: () => void;
    handleClose: () => void;
    setContent: (title: string, content: React.ReactNode) => void;
}

// Main Component
const DAFullScreenDialog = React.forwardRef<DAFullScreenDialogHandle>((_props, ref) => {
    const [open, setOpen] = React.useState(false);
    const [title, setTitle] = React.useState<string>("");
    const [content, setDialogContent] = React.useState<React.ReactNode>(null);

    // Expose methods to parent via ref
    React.useImperativeHandle(ref, () => ({
        handleClickOpen: () => setOpen(true),
        handleClose: () => setOpen(false),
        setContent: (newTitle: string, newContent: React.ReactNode) => {
            setTitle(newTitle);
            setDialogContent(newContent);
        }
    }));

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={() => setOpen(false)}
            TransitionComponent={Transition}
        >
            {/* AppBar Header */}
            <AppBar sx={{ position: "relative" }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => setOpen(false)}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                        {title}
                    </Typography>
                    <Button autoFocus color="inherit" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Dynamic Content */}
            {content}
        </Dialog>
    );
});

export default DAFullScreenDialog;
