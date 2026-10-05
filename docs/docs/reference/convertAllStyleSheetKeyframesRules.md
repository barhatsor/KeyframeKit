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
