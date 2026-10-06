[KeyframeKit](index.md) / convertStyleSheetKeyframes

# <div class="subheader"> Function</div> convertStyleSheetKeyframes()

```ts
function convertStyleSheetKeyframes(obj: {
  in: CSSStyleSheetSource;
  of: string;
}): ConvertedKeyframes | undefined;
```

Converts a CSS keyframes rule from a stylesheet (or stylesheet list)
into Web Animations API keyframes.

## Parameters

### obj

#### in

[`CSSStyleSheetSource`](CSSStyleSheetSource.md)

The stylesheet or stylesheet list where the rule resides.

#### of

`string`

The name of the `@keyframes` rule to get keyframes from.

## Returns

[`ConvertedKeyframes`](ConvertedKeyframes.md) \| `undefined`

## Throws

- `TypeError`
   - Thrown if keyframes rule name is not a string.
 - `TypeError`
   - Thrown if source is not a `CSSStyleSheet` or a `StyleSheetList`.
 - `SecurityError`
   - Thrown if source is a `CSSStyleSheet` whose rules can't be read
     (e.g. a cross-origin stylesheet loaded without CORS).

## Remarks

- If multiple rules have the name, the last one is used, like in CSS.
 - When searching a `StyleSheetList`, stylesheets whose rules can't be read
   are skipped.
 - Only top-level rules are read: `@keyframes` rules nested in other rules
   (e.g. `@media`, `@supports` or `@layer`) aren't found.
