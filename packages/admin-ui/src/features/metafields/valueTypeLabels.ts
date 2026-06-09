import type { MetafieldValueType } from "./types"

const VALUE_TYPE_LABELS: Record<MetafieldValueType, string> = {
  single_line_text: "Single line text",
  multi_line_text: "Multi-line text",
  number_integer: "Integer",
  number_decimal: "Decimal",
  boolean: "True / false",
  date: "Date",
  date_time: "Date and time",
  color: "Color",
  url: "URL",
  json: "JSON",
  "list.single_line_text": "List of text",
  "list.number_integer": "List of integers",
  rich_text: "Rich text",
}

export function labelForMetafieldValueType(type: MetafieldValueType): string {
  return VALUE_TYPE_LABELS[type]
}

export function metafieldValueTypeSelectOptions(): { value: MetafieldValueType; label: string }[] {
  return (Object.keys(VALUE_TYPE_LABELS) as MetafieldValueType[]).map((value) => ({
    value,
    label: VALUE_TYPE_LABELS[value],
  }))
}
