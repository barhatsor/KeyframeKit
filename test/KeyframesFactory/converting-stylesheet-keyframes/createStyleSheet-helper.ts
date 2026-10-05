/** Helper: Creates a CSSStyleSheet with the given CSS text. */
export async function createStyleSheet(css: string): Promise<CSSStyleSheet> {
  const sheet = new CSSStyleSheet();
  await sheet.replace(css);
  return sheet;
}
