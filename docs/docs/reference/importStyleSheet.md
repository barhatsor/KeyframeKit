[KeyframeKit](index.md) / importStyleSheet

# <div class="subheader"> Function</div> importStyleSheet()

```ts
function importStyleSheet(url: string): Promise<CSSStyleSheet>;
```

Imports a stylesheet from a URL.

## Parameters

### url

`string`

The URL of the stylesheet to import.

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`CSSStyleSheet`](https://developer.mozilla.org/docs/Web/API/CSSStyleSheet)\>

## Throws

- `TypeError`
   - Thrown if the stylesheet could not be imported.

## Remarks

- `@import` rules won't be resolved in imported stylesheets.
   [See more.](https://github.com/WICG/construct-stylesheets/issues/119#issuecomment-588352418)
 - This polyfill exists because [Safari dosen't support](https://caniuse.com/mdn-javascript_statements_import_import_attributes_type_css)
   CSS Modules (see [this bug](https://bugs.webkit.org/show_bug.cgi?id=227967)).

## See

- [Creating a CSS module script - HTML Spec](https://html.spec.whatwg.org/multipage/webappapis.html#creating-a-css-module-script)
 - [import() return value - MDN Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#return_value)
