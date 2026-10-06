
import { KeyframeEffectParameters } from '../../KeyframeEffectParameters';


/**
 * Web Animations API keyframes converted with the factory functions.
 * 
 * Call {@linkcode toKeyframeEffect} to create an animation from them.
 * @group Data Types
 */
export class ConvertedKeyframes {

  keyframes: Keyframe[];

  constructor(keyframes: Keyframe[]) {
    this.keyframes = keyframes;
  }

  /**
   * @param options Keyframe effect options.
   *  [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect#options)
   *
   *  Note: to ease like CSS, leave out `easing`. If you set it, it eases the whole
   *  animation at once, on top of each keyframe's easing.
   */
  toKeyframeEffect(
    options: number | KeyframeEffectOptions | null
  ) {

    const keyframeEffect = new KeyframeEffectParameters({
      keyframes: this.keyframes,
      // convert (required) nullable to optional
      options: options ?? undefined
    });

    return keyframeEffect;

  }

}


/**
 * Maps CSS keyframes rule names to their converted Web Animations API keyframes.
 * @group Data Types
 */
export type ConvertedKeyframesRules = Map<string, ConvertedKeyframes>;
