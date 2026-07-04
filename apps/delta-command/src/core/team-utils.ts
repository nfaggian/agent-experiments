export function formatNameList(names: string[], limit = 5): string {
  if (names.length <= limit) return names.join(", ");
  const shown = names.slice(0, limit).join(", ");
  return `${shown}, and ${names.length - limit} more`;
}
