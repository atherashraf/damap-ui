import * as React from "react";
import {Dialog, DialogActions, DialogTitle, IconButton, Tooltip} from "@mui/material";
import Button from "@mui/material/Button";
import VisibilityIcon from '@mui/icons-material/Visibility';

import autoBind from "auto-bind";
import {JSX} from "react";


interface IProps {
}

export interface DialogData {
    title?: string;
    content: JSX.Element;
    actions?: JSX.Element;
    isFullScreen?: boolean,
    isFullWidth?: boolean
}

interface IState {
    open: boolean;
    hidden?: boolean;
    title?: string;
    content: JSX.Element;
    actions?: JSX.Element;
    isFullScreen?: boolean;
    isFullWidth?: boolean;
}

class DADialogBox extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        autoBind(this);
        this.state = {
            open: false,
            content: <React.Fragment/>,
            hidden: false
        };

    }

    closeDialog() {
        this.setState({
            open: false,
            content: <React.Fragment/>,
            isFullScreen: false,
            isFullWidth: false
        });
    }

    openDialog(data: DialogData) {
        this.setState({
            open: true,
            title: data.title,
            content: data.content,
            actions: data.actions,
            isFullWidth: data.isFullWidth,
            isFullScreen: data.isFullScreen
        });
    }

    hideDialog() {
        this.setState({hidden: true});
    }

    unhideDialog() {
        this.setState({hidden: false});
    }


    updateContents(content: JSX.Element) {
        // const data = Object.assign(this.state.data, {content: content})
        // console.log(data);
        this.setState({content: content});
    }
    setFullScreen(isFullScreen: boolean) {
        this.setState({isFullScreen:isFullScreen})
    }
    setFullWidth(isFullWidth:boolean){
        this.setState({isFullWidth:isFullWidth})
    }

    render() {
        return (
            <React.Fragment>
                {!this.state.hidden && (
                    <Dialog
                        container={document.getElementById("fullscreen")}
                        onClose={this.closeDialog}
                        open={this.state.open}
                        fullWidth={this.state.isFullWidth}
                        fullScreen={this.state.isFullScreen}
                    >
                        {this.state.title && (
                            <DialogTitle
                                key={"main-title"}
                                style={{cursor: "move"}}
                                id="draggable-dialog-title"
                            >
                                {this.state.title}
                            </DialogTitle>
                        )}
                        {this.state.content}
                        <DialogActions>
                            {this.state.actions}
                            <Button onClick={this.hideDialog}>Hide</Button>
                            <Button autoFocus onClick={this.closeDialog}>Close</Button>
                        </DialogActions>
                    </Dialog>
                )}

                {this.state.hidden && (
                    <Tooltip title="Show Dialog">
                        <IconButton
                            color="primary"
                            onClick={this.unhideDialog}
                            style={{
                                position: "fixed",
                                bottom: 16,
                                right: 16,
                                zIndex: 1300,
                                backgroundColor: "#fff",
                                boxShadow: "0px 0px 6px rgba(0,0,0,0.2)"
                            }}
                            size="large"
                        >
                            <VisibilityIcon/>
                        </IconButton>
                    </Tooltip>
                )}
            </React.Fragment>
        );
    }

}

export default DADialogBox;
export type DADialogBoxHandle = typeof DADialogBox.prototype;