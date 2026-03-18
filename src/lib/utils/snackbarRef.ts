// src/utils/snackbarRef.ts
import { createRef } from "react";
import type { DASnackbarHandle } from "@/components/base/DASnackbar";

export const snackbarRef = createRef<DASnackbarHandle>();
