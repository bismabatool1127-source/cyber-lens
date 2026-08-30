/** Client-side copy of the display-defang helper (mirrors server behavior). */
export function defangForDisplay(urlText) {
  return String(urlText)
    .replace(/^https?:\/\//i, (m) => (m.toLowerCase().startsWith('https') ? 'hxxps://' : 'hxxp://'))
    .replace(/\./g, '[.]');
}
