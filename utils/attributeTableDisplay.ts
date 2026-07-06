import type { Column } from "@damap/types/gridTypeDeclaration";

const SURVEY_AT_COLUMN_RE = /^survey[_\s-]?at$/i;
const ISO_DATE_TIME_RE =
    /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/;

export function isSurveyAtColumn(col: Pick<Column, "id" | "label">): boolean {
    const id = col.id?.trim() ?? "";
    const label = col.label?.trim() ?? "";
    return (
        SURVEY_AT_COLUMN_RE.test(id) ||
        /^survey\s*at$/i.test(label)
    );
}

/** Display survey timestamps as `YYYY-MM-DD HH:mm`. */
export function formatSurveyAtDisplay(value: unknown): string {
    if (value == null || value === "") return "";

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return "";
        return formatDateParts(value);
    }

    const raw = String(value).trim();
    if (!raw) return "";

    const parsed = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return raw;

    return formatDateParts(parsed);
}

function formatDateParts(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function formatAttributeCellDisplay(
    col: Column,
    value: unknown
): string {
    if (value == null || value === "") return "";

    if (isSurveyAtColumn(col)) {
        return formatSurveyAtDisplay(value);
    }

    if (value instanceof Date) {
        return formatSurveyAtDisplay(value);
    }

    const text = String(value);
    if (col.type === "date" && ISO_DATE_TIME_RE.test(text)) {
        return formatSurveyAtDisplay(text);
    }

    return text;
}
