// src/libs/damap/types/authTypes.ts
/****
 in specific application use this type to enhance users


 import { AuthServices } from "damap";
 import type { DAMapUserBase } from "damap";
 import { appSnackbarRef } from "@/core/AppSnackbar";
 import { normalizeAuthUser } from "@/auth/normalizeAuthUser";

 export interface WasaUser extends DAMapUserBase {
     distId?: number | null;
     distName?: string | null;
     wasaDivId?: number | null;
     wasaDivName?: string | null;
     wasaSubdivId?: number | null;
     wasaSubdivName?: string | null;
     description?: string | null;
 }

 AuthServices.configureAuth<WasaUser>({
    normalizeUser: normalizeAuthUser,
    snackbar: (message) => appSnackbarRef.current?.show(message),
 });
 ****/

export type DAMapRole = string;

export interface DAMapUserBase {
    id?: number | string;
    username?: string;
    name?: string;
    email?: string;
    roles?: DAMapRole[];
    isSuperuser?: boolean;
    isStaff?: boolean;
    isActive?: boolean;
    isVerified?: boolean;

    [key: string]: unknown;
}


