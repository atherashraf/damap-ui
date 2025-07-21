class ColorUtils {
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
     */
    static toRGBA(rgb: { r: number; g: number; b: number }, alpha: number = 1): string {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    /**
     * Darkens a given RGB color by a specified factor.
     */
    static darkenColor(rgb: { r: number; g: number; b: number }, factor: number = 0.7): { r: number; g: number; b: number } {
        return {
            r: Math.max(0, Math.floor(rgb.r * factor)),
            g: Math.max(0, Math.floor(rgb.g * factor)),
            b: Math.max(0, Math.floor(rgb.b * factor))
        };
    }

    /**
     * Returns a contrasting text color (black or white) for a given RGB background color.
     */
    static getContrastingTextColorRGB(rgb: { r: number; g: number; b: number }): string {
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    /**
     * Returns a contrasting text color (black or white) for a given HEX background color.
     * @param hex - Background HEX color in #rrggbb format
     */
    static getContrastingTextColorHex(hex: string): string {
        const rgb = this.hexToRGB(hex);
        return this.getContrastingTextColorRGB(rgb);
    }

    /**
     * Converts a HEX color to RGB.
     * @param hex - Color in #rrggbb format
     */
    static hexToRGB(hex: string): { r: number; g: number; b: number } {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return { r, g, b };
    }

    /**
     * Converts an RGB color to HEX.
     * @param rgb - RGB color
     */
    static rgbToHex(rgb: { r: number; g: number; b: number }): string {
        return (
            '#' +
            [rgb.r, rgb.g, rgb.b]
                .map((val) => val.toString(16).padStart(2, '0'))
                .join('')
        );
    }
}
export default ColorUtils
