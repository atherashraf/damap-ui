// DANumberField.tsx
import * as React from "react";
import { TextField, TextFieldProps } from "@mui/material";

interface DANumberFieldProps
    extends Omit<TextFieldProps, "type" | "value" | "onChange"> {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onValueChange: (value: number) => void;
}

const DANumberField = ({
                           value,
                           min,
                           max,
                           step = 1,
                           onValueChange,
                           inputProps,
                           ...props
                       }: DANumberFieldProps) => {
    const [textValue, setTextValue] = React.useState(String(value));

    React.useEffect(() => {
        setTextValue(String(value));
    }, [value]);

    const normalizeValue = (raw: string): number => {
        let n = Number(raw);

        if (Number.isNaN(n)) {
            n = min ?? 0;
        }

        if (min !== undefined) n = Math.max(min, n);
        if (max !== undefined) n = Math.min(max, n);

        return n;
    };

    return (
        <TextField
            {...props}
            type="number"
            value={textValue}
            onChange={(e) => {
                const raw = e.target.value;

                setTextValue(raw);

                if (raw === "") return;

                const n = normalizeValue(raw);
                onValueChange(n);
                setTextValue(String(n));
            }}
            onBlur={() => {
                const n = normalizeValue(textValue);
                onValueChange(n);
                setTextValue(String(n));
            }}
            inputProps={{
                min,
                max,
                step,
                ...inputProps,
            }}
        />
    );
};

export default DANumberField;