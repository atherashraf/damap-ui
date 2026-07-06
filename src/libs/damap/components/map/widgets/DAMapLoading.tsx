import * as React from "react";
import { Backdrop, CircularProgress } from "@mui/material";

interface IState {
    isLoading: boolean;
}

interface IProps {}

class DAMapLoading extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            isLoading: false,
        };
    }

    openIsLoading = () => {
        this.setState({ isLoading: true });
    };

    closeIsLoading = () => {
        this.setState({ isLoading: false });
    };

    render() {
        return (
            <Backdrop
                open={this.state.isLoading}
                sx={{
                    position: "absolute",   // 👈 important for map overlay
                    zIndex: 9999,
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.2)",
                }}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        );
    }
}

export default DAMapLoading;
export type DAMapLoadingHandle = typeof DAMapLoading.prototype;