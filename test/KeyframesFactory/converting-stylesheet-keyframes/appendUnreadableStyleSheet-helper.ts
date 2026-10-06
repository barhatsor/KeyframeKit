
/**
 * Helper: Appends a `<style>` with the given CSS text to the document,
 * then makes its rules unreadable: reading its `cssRules` throws a `SecurityError`,
 * like it does for a cross-origin stylesheet.
 *
 * A `StyleSheetList` can't be constructed or modified, so we stub the getter
 * on a real stylesheet instance, which keeps it in `document.styleSheets`.
 * @see https://drafts.csswg.org/cssom/#dom-cssstylesheet-cssrules
 */
export function appendUnreadableStyleSheet(css: string): HTMLStyleElement {

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  Object.defineProperty(style.sheet, 'cssRules', {
    get() {
      throw new DOMException('Not allowed to access cross-origin stylesheet.', 'SecurityError');
    }
  });

  return style;

}
