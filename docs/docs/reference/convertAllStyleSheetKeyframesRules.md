[KeyframeKit](index.md) / convertAllStyleSheetKeyframesRules

# <div class="subheader"> Function</div> convertAllStyleSheetKeyframesRules()

```ts
function convertAllStyleSheetKeyframesRules(obj: {
  in: CSSStyleSheetSource;
}): ConvertedKeyframesRules;
```

Gets all the CSS keyframes rules in a stylesheet or stylesheet list,
then converts them to Web Animations API keyframes.

## Parameters

### obj

#### in

[`CSSStyleSheetSource`](CSSStyleSheetSource.md)

The style sheet or style sheet list to get keyframes from.

## Returns

[`ConvertedKeyframesRules`](ConvertedKeyframesRules.md)

## Throws

- `TypeError`
   - Thrown if source is not a `CSSStyleSheet` or a `StyleSheetList`.
 - `SecurityError`
   - Thrown if source is a `CSSStyleSheet` whose rules can't be read
     (e.g. a cross-origin stylesheet loaded without CORS).

## Remarks

- If multiple rules have the same name, the last one is used, like in CSS.
 - When reading a `StyleSheetList`, stylesheets whose rules can't be read
   are skipped.
 - Only top-level rules are read: `@keyframes` rules nested in other rules
   (e.g. `@media`, `@supports` or `@layer`) aren't found.
