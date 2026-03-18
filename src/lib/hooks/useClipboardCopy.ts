import { useState } from "react";

/**
 * useClipboardCopy
 * -----------------
 * A custom hook to copy text to clipboard and track copy status.
 *
 * Usage:
 * const { copy, isCopied } = useClipboardCopy();
 * copy("your text");
 */
const useClipboardCopy = () => {
    const [isCopied, setIsCopied] = useState(false);

    const copy = async (text: string) => {
        if (!navigator.clipboard) {
            console.warn("Clipboard API not available");
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // reset after 2 seconds
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    return { copy, isCopied };
};

export default useClipboardCopy;
