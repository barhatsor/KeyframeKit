[KeyframeKit](index.md) / ConvertedKeyframes

# <div class="subheader"> Class</div> ConvertedKeyframes

Web Animations API keyframes converted with the factory functions.

Call [`toKeyframeEffect`](#tokeyframeeffect) to create an animation from them.

## Constructors

### Constructor

```ts
new ConvertedKeyframes(keyframes: Keyframe[]): ConvertedKeyframes;
```

#### Parameters

##### keyframes

`Keyframe`[]

#### Returns

`ConvertedKeyframes`

## Methods

### toKeyframeEffect()

```ts
toKeyframeEffect(options: number | KeyframeEffectOptions | null): KeyframeEffectParameters;
```

#### Parameters

##### options

`number` \| `KeyframeEffectOptions` \| `null`

Keyframe effect options.
 [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect#options)

 Note: to ease like CSS, leave out `easing`. If you set it, it eases the whole
 animation at once, on top of each keyframe's easing.

#### Returns

[`KeyframeEffectParameters`](KeyframeEffectParameters.md)

## Properties

### keyframes

```ts
keyframes: Keyframe[];
```

## See Also

- [ConvertedKeyframesRules](ConvertedKeyframesRules.md)
- [convertKeyframesRule](convertKeyframesRule.md)
- [convertStyleSheetKeyframes](convertStyleSheetKeyframes.md)
