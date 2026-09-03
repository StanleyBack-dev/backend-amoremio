import { rgb } from "pdf-lib";

/** Brand and UI colors - aligned with frontend theme (src/config/theme.ts) */
export const PDF_COLORS = {
  // Primary brand colors
  gold: rgb(0.831, 0.686, 0.216), // #D4AF37
  goldDark: rgb(0.722, 0.537, 0.106), // #B8891B
  purple: rgb(0.482, 0.247, 0.949), // #7B3FF2
  purpleDark: rgb(0.31, 0.176, 0.608), // #4F2D9B
  // Text and semantic colors
  text: rgb(0.11, 0.09, 0.188), // #1C1730
  textMuted: rgb(0.361, 0.329, 0.478), // #5C547A
  textLight: rgb(0.612, 0.565, 0.78), // #9C90C7
  negative: rgb(0.761, 0.153, 0.153), // #C22727
  positive: rgb(0.129, 0.545, 0.318), // #218B51
  // Backgrounds and borders
  border: rgb(0.878, 0.859, 0.929), // #E0DBED
  rowAlt: rgb(0.969, 0.961, 0.984), // #F7F5FB
  bgLight: rgb(0.929, 0.906, 0.969), // #EDE7F7
  white: rgb(1, 1, 1),
} as const;

/** Page layout constants (A4 points) */
export const PDF_LAYOUT = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  marginX: 40,
  topMargin: 36,
  bottomMargin: 110,
  get contentWidth() {
    return this.pageWidth - this.marginX * 2;
  },
} as const;

/** Font sizes */
export const PDF_FONT_SIZES = {
  heading: 20,
  subheading: 10,
  sectionTitle: 12,
  body: 9,
  small: 8,
  micro: 7,
} as const;
