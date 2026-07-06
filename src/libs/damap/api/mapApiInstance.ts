// damap/api/mapApiSingleton.ts

import type { RefObject } from "react";
import MapApi from "./MapApi";
import type { DASnackbarHandle } from "@damap/components/base/DASnackbar";
import {snackbarRef} from "@damap/utils/snackbarRef";

let instance: MapApi | null =  new MapApi(snackbarRef);

export const initMapApi = (
    snackbarRef: RefObject<DASnackbarHandle | null>
): MapApi => {
    if (!instance) {
        instance = new MapApi(snackbarRef);
    }

    return instance;
};

export const getMapApi = (): MapApi => {
    if (!instance) {
        throw new Error(
            "MapApi is not initialized. Call initMapApi(snackbarRef) first."
        );
    }

    return instance;
};

export const resetMapApi = (): void => {
    instance = null;
};