import {Control} from "ol/control.js";
import {createRoot} from "react-dom/client";
import {RefObject} from "react";
import MapVM from "../models/MapVM";
import TimeSlider, {TimeSliderHandle} from "./TimeSlider";


interface IControlOptions {
    target?: any;
    mapVM: MapVM;
    timeSliderRef: RefObject<TimeSliderHandle>;
    onDateChange?: (date: Date) => void;
}

export const formatYmdDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

class TimeSliderControl extends Control {
    constructor(opt_options: IControlOptions) {
        const options: IControlOptions = opt_options || {} as IControlOptions;

        const element: HTMLDivElement = document.createElement("div");
        element.style.position = "absolute";
        element.style.bottom = "30px";
        element.style.left = "0px";
        element.style.width = "100%";
        element.style.padding = "6px";
        element.style.boxSizing = "border-box";
        element.style.zIndex = "1000"

        const sliderRoot = createRoot(element);
        sliderRoot.render(
            <TimeSlider
                ref={options.timeSliderRef}
                mapVM={options.mapVM}
                onDateChange={options.onDateChange}

            />
        );
        // ✅ Safely access ref after render
        let attempts = 0;
        const maxAttempts = 5;
        const intervalId = setInterval(() => {
            const current = options.timeSliderRef.current;
            if (current) {
                (current as any).hasControl = true;
                clearInterval(intervalId); // ✅ Stop checking
                // console.log("✅ TimeSliderControl successfully initialized.");
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(intervalId); // ❌ Stop after 5 tries
                    console.warn("⚠️ TimeSliderControl ref not available after multiple attempts.");
                }
            }
        }, 100); // Check every 50ms (total 250ms max)
        super({
            element: element,
            target: options.target,
        });
    }
}

export default TimeSliderControl;
