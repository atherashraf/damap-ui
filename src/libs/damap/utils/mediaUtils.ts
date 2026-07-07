// src/libs/damap/utils/mediaUtils.ts
/***
  in wasa use it like
  import { setThumbnailUrlBuilder } from "damap";

  setThumbnailUrlBuilder((mediaUrl, options) => {
      const width = options?.width ?? 96;
      const height = options?.height ?? 64;

      const thumbBase = mediaUrl.replace(/\/media\//i, "/survey/media-thumb/");

      if (thumbBase === mediaUrl) {
      return mediaUrl;
      }

      const joiner = thumbBase.includes("?") ? "&" : "?";
      return `${thumbBase}${joiner}width=${width}&height=${height}`;
  });
 ***/
import MapApi from "../api/MapApi";

const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;
const IMAGE_FILE_REGEX = /\.(png|jpe?g|gif|webp|bmp|svg)(?:[?#].*)?$/i;

const preloadedImageUrls = new Set<string>();

export type ThumbnailUrlBuilder = (
    fullImageUrl: string,
    options?: {
        width?: number;
        height?: number;
    }
) => string;

let thumbnailUrlBuilder: ThumbnailUrlBuilder | null = null;

export const setThumbnailUrlBuilder = (builder: ThumbnailUrlBuilder | null) => {
    thumbnailUrlBuilder = builder;
};

export const getMediaUrl = (path?: string | null): string | null => {
    if (!path) return null;

    const normalized = path.trim();
    if (!normalized) return null;

    if (
        ABSOLUTE_URL_REGEX.test(normalized) ||
        normalized.startsWith("data:")
    ) {
        return normalized;
    }

    return MapApi.getBaseURL(normalized);
};

export const getImageThumbnailUrl = (
    path?: string | null,
    options?: {
        width?: number;
        height?: number;
    }
): string | null => {
    const mediaUrl = getMediaUrl(path);
    if (!mediaUrl) return null;

    if (mediaUrl.startsWith("data:")) return mediaUrl;

    if (thumbnailUrlBuilder) {
        return thumbnailUrlBuilder(mediaUrl, options);
    }

    return mediaUrl;
};

export const isImagePath = (value?: string | null): boolean => {
    if (!value) return false;

    const normalized = value.trim();
    if (!normalized) return false;

    return (
        normalized.startsWith("data:image/") ||
        IMAGE_FILE_REGEX.test(normalized)
    );
};

export const getImageCellUrl = (
    columnId: string,
    value: unknown
): string | null => {
    if (typeof value !== "string") return null;

    const normalized = value.trim();
    if (!normalized) return null;

    if (normalized.startsWith("data:image/")) {
        return normalized;
    }

    const isImageColumn =
        /(photo|image|picture|avatar|icon|thumbnail)/i.test(columnId);

    const looksLikeImage = IMAGE_FILE_REGEX.test(normalized);

    if (!isImageColumn && !looksLikeImage) {
        return null;
    }

    return getMediaUrl(normalized);
};

export const getImageCellThumbnailUrl = (
    columnId: string,
    value: unknown,
    options?: {
        width?: number;
        height?: number;
    }
): string | null => {
    if (typeof value !== "string") return null;

    const fullImageUrl = getImageCellUrl(columnId, value);
    if (!fullImageUrl) return null;

    return getImageThumbnailUrl(value, options) ?? fullImageUrl;
};

export const preloadImageUrl = (url?: string | null): Promise<void> => {
    if (!url || preloadedImageUrls.has(url)) {
        return Promise.resolve();
    }

    if (typeof window === "undefined" || typeof Image === "undefined") {
        preloadedImageUrls.add(url);
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";

        image.onload = () => {
            preloadedImageUrls.add(url);
            resolve();
        };

        image.onerror = () => {
            reject(new Error(`Failed to preload image: ${url}`));
        };

        image.src = url;
    });
};

export const isImageUrlPreloaded = (url?: string | null): boolean => {
    return !!url && preloadedImageUrls.has(url);
};