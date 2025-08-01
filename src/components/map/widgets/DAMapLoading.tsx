import * as React from "react";
import "@/assets/css/da-map-loading.css";

interface IState {
    width: number;
    height: number;
    isLoading: boolean;
}

interface IProps {}

class DAMapLoading extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            width: 200,
            height: 200,
            isLoading: false,
        };
    }

    componentDidMount() {
        //@ts-ignore
        const width = document?.getElementById("map")?.clientWidth | 200;
        //@ts-ignore
        const height = document?.getElementById("map")?.clientHeight | 200;
        this.setState({
            width: width,
            height: height,
        });
    }

    openIsLoading() {
        this.setState({
            isLoading: true,
        });
    }

    closeIsLoading() {
        this.setState({
            isLoading: false,
        });
    }

    render() {
        if (!this.state.isLoading) {
            return null; // Return null to hide the loading screen when isLoading is false
        }

        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }
}

export default DAMapLoading;
export type DAMapLoadingHandle = typeof DAMapLoading.prototype;