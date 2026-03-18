// hooks/useMapApi.ts
import { useMemo } from "react";
import { RefObject } from "react";
import MapApi from "@damap/api/MapApi";
import { DASnackbarHandle } from "@damap/components/base/DASnackbar";

export function useMapApi(snackbarRef: RefObject<DASnackbarHandle | null>) {
    const api = useMemo(() => new MapApi(snackbarRef), [snackbarRef]);
    return api;
}
