
/**
 * Imports a stylesheet from a URL.
 * @param url The URL of the stylesheet to import.
 * @throws
 *  - `TypeError`
 *    - Thrown if the stylesheet could not be imported.
 * @remarks
 *  - `@import` rules won't be resolved in imported stylesheets.
 *    [See more.](https://github.com/WICG/construct-stylesheets/issues/119#issuecomment-588352418)
 *  - This polyfill exists because [Safari dosen't support](https://caniuse.com/mdn-javascript_statements_import_import_attributes_type_css)
 *    CSS Modules (see [this bug](https://bugs.webkit.org/show_bug.cgi?id=227967)).
 * @see
 *  - [Creating a CSS module script - HTML Spec](https://html.spec.whatwg.org/multipage/webappapis.html#creating-a-css-module-script)
 *  - [import() return value - MDN Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#return_value)
 * @group Sourcing Stylesheets
 */
export async function importStyleSheet(url: string) {

  const resp = await fetch(url);

  if (!resp.ok)
    throw new TypeError(`Failed to fetch dynamically imported module: ${url}`);

  const respText = await resp.text();

  const styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(respText);

  return styleSheet;

}
