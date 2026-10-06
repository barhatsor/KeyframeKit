
/**
 * Checks whether a stylesheet's rules can be read.
 *
 * Reading `cssRules` throws a `SecurityError` when the stylesheet
 * isn't origin-clean, e.g. a cross-origin `<link>` loaded without CORS.
 * Browsers differ on which stylesheets qualify (Safari 17 also treats
 * `data:` URL stylesheets in sandboxed iframes as cross-origin),
 * so we test for access instead of comparing origins.
 * @see https://drafts.csswg.org/cssom/#dom-cssstylesheet-cssrules
 */
export function isStyleSheetAccessible(styleSheet: CSSStyleSheet) {

  try {
    styleSheet.cssRules;
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'SecurityError')
      return false;
    throw error;
  }

}
