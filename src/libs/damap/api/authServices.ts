/**
 * Map library compatibility: subtree imports `@damap/api/authServices`.
 * Storage, login, refresh, and user shape are owned by `@/api/authServices`
 * (aligned with backend JWT + `User` profile).
 */
export { default } from "@/api/authServices";
export type { User } from "@/components/admin/types";
