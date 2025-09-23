class colorUtils {
    /**
     * Generates a random RGB or Hex color.
     */
    static getRandomRGB(): { r: number; g: number; b: number } {
        return {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        };
    }

    static getRandomHexColor(): string {
        const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
        const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
        const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
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
     * Lightens an RGB color by a specified factor.
     */
    static lightenColor(rgb: { r: number; g: number; b: number }, factor: number = 0.3): { r: number; g: number; b: number } {
        const newR = Math.min(255, rgb.r + (255 - rgb.r) * factor);
        const newG = Math.min(255, rgb.g + (255 - rgb.g) * factor);
        const newB = Math.min(255, rgb.b + (255 - rgb.b) * factor);
        return { r: Math.floor(newR), g: Math.floor(newG), b: Math.floor(newB) };
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

    /**
     * Calculates the relative luminance of an RGB color.
     * Formula based on WCAG 2.0.
     */
    static getLuminance(rgb: { r: number; g: number; b: number }): number {
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Calculates the contrast ratio between two colors.
     * @param color1 - A color in #hex format.
     * @param color2 - Another color in #hex format.
     */
    static getContrastRatio(color1: string, color2: string): number {
        const rgb1 = this.hexToRGB(color1);
        const rgb2 = this.hexToRGB(color2);
        const luminance1 = this.getLuminance(rgb1);
        const luminance2 = this.getLuminance(rgb2);
        const lighter = Math.max(luminance1, luminance2);
        const darker = Math.min(luminance1, luminance2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Finds a color with sufficient contrast against a base color.
     * It iteratively lightens or darkens the original color until a minimum
     * contrast ratio is met.
     * @param originalColor - The starting color in #hex format.
     * @param paperColor - The background color (e.g., the table's paper).
     * @param minContrast - The minimum acceptable contrast ratio (e.g., 2.2 for separation).
     * @returns A new #hex color string.
     */
    static getContrastColor(originalColor: string, paperColor: string, minContrast: number = 2.2): string {
        let newColor = originalColor;
        let tries = 0;
        const isLightMode = this.getLuminance(this.hexToRGB(paperColor)) > 0.5;

        // Try to reach the minimum contrast.
        while (this.getContrastRatio(newColor, paperColor) < minContrast && tries < 10) {
            let rgb = this.hexToRGB(newColor);
            if (isLightMode) {
                rgb = this.darkenColor(rgb, 0.9); // Darken by 10%
            } else {
                rgb = this.lightenColor(rgb, 0.1); // Lighten by 10%
            }
            newColor = this.rgbToHex(rgb);
            tries++;
        }

        // As a last resort, if we still don't have enough contrast,
        // just pick a color that's guaranteed to work.
        if (this.getContrastRatio(newColor, paperColor) < minContrast) {
            newColor = isLightMode ? '#000000' : '#FFFFFF';
        }

        return newColor;
    }
}

export default colorUtils;