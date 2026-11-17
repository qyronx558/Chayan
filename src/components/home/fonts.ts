import { Tiro_Devanagari_Sanskrit, Kalam, Courier_Prime } from "next/font/google"

/* Tiro Devanagari Sanskrit was drawn for Sanskrit texts and carries the IAST
 * diacritics; Kalam is a hand-lettered face used sparingly for human notes. */
export const sanskritFont = Tiro_Devanagari_Sanskrit({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["devanagari", "latin", "latin-ext"],
  display: "swap",
})

export const handFont = Kalam({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
})

/* Typewriter face for typed office notices and library catalogue cards. */
export const typeFont = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
})
