export type LengthUnit = "m" | "km" | "ft" | "mi";
export type AreaUnit = "m2" | "km2" | "ft2" | "acres";
export type MeasureMode = "length" | "area";
export type MeasureUnit = LengthUnit | AreaUnit;

export const LENGTH_UNITS: { value: LengthUnit; label: string }[] = [
    { value: "m", label: "Meters" },
    { value: "km", label: "Kilometers" },
    { value: "ft", label: "Feet" },
    { value: "mi", label: "Miles" },
];

export const AREA_UNITS: { value: AreaUnit; label: string }[] = [
    { value: "m2", label: "Square Meters" },
    { value: "km2", label: "Square Kilometers" },
    { value: "ft2", label: "Square Feet" },
    { value: "acres", label: "Acres" },
];

class ConversionManager {
    static convertLength(valueInMeters: number, unit: LengthUnit): number {
        switch (unit) {
            case "km":
                return valueInMeters / 1000;
            case "ft":
                return valueInMeters * 3.28084;
            case "mi":
                return valueInMeters / 1609.344;
            case "m":
            default:
                return valueInMeters;
        }
    }

    static convertArea(valueInSquareMeters: number, unit: AreaUnit): number {
        switch (unit) {
            case "km2":
                return valueInSquareMeters / 1_000_000;
            case "ft2":
                return valueInSquareMeters * 10.7639;
            case "acres":
                return valueInSquareMeters / 4046.8564224;
            case "m2":
            default:
                return valueInSquareMeters;
        }
    }

    static getUnitLabel(unit: MeasureUnit): string {
        switch (unit) {
            case "m":
                return "m";
            case "km":
                return "km";
            case "ft":
                return "ft";
            case "mi":
                return "mi";
            case "m2":
                return "m²";
            case "km2":
                return "km²";
            case "ft2":
                return "ft²";
            case "acres":
                return "acres";
            default:
                return "";
        }
    }

    static formatLength(valueInMeters: number, unit: LengthUnit, decimals = 2): string {
        const converted = this.convertLength(valueInMeters, unit);
        return `${converted.toFixed(decimals)} ${this.getUnitLabel(unit)}`;
    }

    static formatArea(valueInSquareMeters: number, unit: AreaUnit, decimals = 2): string {
        const converted = this.convertArea(valueInSquareMeters, unit);
        return `${converted.toFixed(decimals)} ${this.getUnitLabel(unit)}`;
    }
}

export default ConversionManager;