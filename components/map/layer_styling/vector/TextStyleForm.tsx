import autoBind from "auto-bind";

import BaseStyleForm, { BaseStyleFormProps } from "./BaseStyleForm";
import TextSymbolizer from "./symbolizer/TextSymbolizer";

import {
    IFeatureStyle,
    ITextStyle,
    isLabelableLayer,
} from "@damap/types/typeDeclarations";

interface TextStylingFormState {
    textStyle?: ITextStyle;
    labelField?: string;
    labels: string[];
}

class TextStylingForm extends BaseStyleForm<object, TextStylingFormState> {
    constructor(props: BaseStyleFormProps) {
        super(props);
        this.state = {
            textStyle: undefined,
            labelField: undefined,
            labels: [],
        };
        autoBind(this);
    }

    async componentDidMount() {
        await this.loadTextState();
        await this.loadLabelFields();
    }

    async componentDidUpdate(prevProps: BaseStyleFormProps) {
        if (prevProps.layerId !== this.props.layerId) {
            await this.loadTextState();
            await this.loadLabelFields();
        }
    }

    async loadTextState() {
        const layerId = this.props.layerId;
        const currentStyle = this.props.mapVM.getDALayer(layerId)?.style;

        this.setState({
            textStyle: currentStyle?.text?.style,
            labelField: currentStyle?.text?.labelField,
        });
    }

    async loadLabelFields() {
        const layer = this.props.mapVM.getDALayer(this.props.layerId);

        if (!isLabelableLayer(layer)) {
            this.setState({ labels: [] });
            return;
        }

        try {
            const labels = await layer.getAttributeList();
            this.setState({
                labels: Array.isArray(labels) ? labels : [],
            });
        } catch (error) {
            console.error("Failed to load label fields:", error);
            this.setState({ labels: [] });
            this.props.mapVM.showSnackbar("Failed to load label fields");
        }
    }

    handleApply(textStyle: ITextStyle, label: string) {
        const daLayer = this.props.mapVM.getDALayer(this.props.layerId);

        this.setState({
            textStyle,
            labelField: label,
        });

        if (!daLayer) return;

        daLayer.style = {
            ...(daLayer.style || {
                type: "single",
                style: {},
            }),
            text: {
                labelField: label,
                style: textStyle,
                showLabel: true,
            },
        };

        if (isLabelableLayer(daLayer)) {
            daLayer.setLabelProperty(label);
            daLayer.setTextStyle(textStyle);
            daLayer.setShowLabel(true);
        }

        daLayer.updateStyle();
        this.props.mapVM.showSnackbar("Text style applied");
    }

    getFeatureStyle(): IFeatureStyle | undefined {
        const layerId = this.props.layerId;
        const currentStyle = this.props.mapVM.getDALayer(layerId)?.style;

        if (!this.state.textStyle || !this.state.labelField) {
            return currentStyle;
        }

        return {
            ...(currentStyle || {
                type: "single",
                style: {},
            }),
            text: {
                labelField: this.state.labelField,
                style: this.state.textStyle,
                showLabel: true,
            },
        };
    }

    render() {
        const layerId = this.props.layerId;
        const currentStyle = this.props.mapVM.getDALayer(layerId)?.style;

        return (
            <TextSymbolizer
                initialStyle={this.state.textStyle || currentStyle?.text?.style}
                labelField={this.state.labelField || currentStyle?.text?.labelField}
                labels={this.state.labels}
                onApply={this.handleApply}
            />
        );
    }
}

export default TextStylingForm;