


export class ColorUtils {
    /**
     * Generates a random RGB color.
     */
    static getRandomRGB(): { r: number; g: number; b: number } {
        return {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        };
    }

    /**
     * Converts RGB and alpha values to an RGBA string.
     * @param rgb - RGB values
     * @param alpha - Alpha value (0 to 1)
     */
    static toRGBA(rgb: { r: number; g: number; b: number }, alpha: number = 1): string {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    /**
     * Darkens a given RGB color by a specified factor.
     * @param rgb - Original RGB color
     * @param factor - Darkening factor (e.g., 0.7 for 30% darker)
     */
    static darkenColor(rgb: { r: number; g: number; b: number }, factor: number = 0.7): { r: number; g: number; b: number } {
        return {
            r: Math.max(0, Math.floor(rgb.r * factor)),
            g: Math.max(0, Math.floor(rgb.g * factor)),
            b: Math.max(0, Math.floor(rgb.b * factor))
        };
    }
}
