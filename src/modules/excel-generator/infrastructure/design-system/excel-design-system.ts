/** Brand and UI colors (ARGB hex) - aligned with frontend theme (src/config/theme.ts) */
export const EXCEL_COLORS = {
  purpleDark: "FF4F2D9B",
  gold: "FFD4AF37",
  text: "FF1C1730",
  textMuted: "FF5C547A",
  border: "FFE0DBED",
  rowAlt: "FFF7F5FB",
  bgLight: "FFEDE7F7",
  white: "FFFFFFFF",
} as const;

/** Character-width units used to convert a column's relative weight into an Excel column width. */
export const EXCEL_LAYOUT = {
  minColumnWidth: 10,
  maxColumnWidth: 60,
  widthPerWeightUnit: 14,
} as const;
