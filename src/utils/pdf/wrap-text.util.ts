import type { PDFFont } from "pdf-lib";

/**
 * Wraps `text` into lines that fit within `maxWidth` points using the given
 * pdf-lib font and font size. Returns an array of line strings.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number,
): string[] {
  // Normalize all whitespace (including \n, \r, \t) into single spaces
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}
