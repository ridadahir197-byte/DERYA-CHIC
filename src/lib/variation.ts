export function formatVariation(size?: string | null, color?: string | null): string {
  const s = size && size.trim() ? size.trim() : "";
  const c = color && color.trim() ? color.trim() : "";
  if (s && c) return `Size: ${s} • Color: ${c}`;
  if (c) return `Color: ${c}`;
  if (s) return `Size: ${s}`;
  return "";
}
