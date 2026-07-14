export type FilterChip<Key extends string = string> = {
  key: Key;
  label: string;
};

export function getSelectedItemId(
  requestedId: string | null | undefined,
  visibleIds: readonly string[],
): string | null {
  if (!requestedId || !visibleIds.includes(requestedId)) {
    return null;
  }

  return requestedId;
}

export function getVisibleFilterChips<
  Filters extends Record<string, string>,
>(
  filters: Filters,
  defaults: Filters,
  formatters: Partial<{
    [Key in keyof Filters]: (value: Filters[Key]) => string;
  }>,
): FilterChip<Extract<keyof Filters, string>>[] {
  return (Object.keys(filters) as Array<Extract<keyof Filters, string>>)
    .filter((key) => filters[key] !== defaults[key])
    .map((key) => ({
      key,
      label: formatters[key]?.(filters[key]) ?? filters[key],
    }));
}
