
/**
 * A keyframes object.
 *  [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
 * @see
 *  [Processing a keyframes argument - Web Animations Spec](https://drafts.csswg.org/web-animations-1/#processing-a-keyframes-argument)
 * @group Defining Animations
 */
export type KeyframeArgument = Keyframe[] | PropertyIndexedKeyframes;

/**
 * Provides a more convenient way to define animations than is offered natively.
 * @see
 *  [The KeyframeEffect interface - Web Animations Spec](https://drafts.csswg.org/web-animations-1/#the-keyframeeffect-interface)
 * @group Defining Animations
 */
export class KeyframeEffectParameters {

  keyframes: KeyframeArgument;
  options: KeyframeEffectOptions;

  /**
   * @param obj
   *  @param obj.keyframes A keyframes object.
   *   [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
   *  @param obj.options Keyframe effect options.
   *   [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect#options)
   */
  constructor({ keyframes, options = {} }: {
    keyframes: KeyframeArgument,
    options?: number | KeyframeEffectOptions
  }) {

    this.keyframes = keyframes;
    
    const parsedOptions = parseOptionsArg(options);

    // CSS defaults to 'ease', but the Web Animations API defaults to 'linear'
    // https://drafts.csswg.org/web-animations-1/#dom-effecttiming-easing
    if (!('easing' in parsedOptions))
      parsedOptions.easing = 'ease';

    this.options = parsedOptions;

  }

  /**
   * @param obj
   *  @param obj.target An element to attach the animation to.
   *  @param obj.options Additional keyframe effect options. Can override existing keys.
   *   [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect#options)
   *  @param obj.timeline The timeline with which to associate the animation.
   *   [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Animation/Animation#timeline)
   * @see
   *  - [The KeyframeEffect interface - Web Animations Spec](https://drafts.csswg.org/web-animations-1/#the-keyframeeffect-interface)
   *  - [The Animation interface - Web Animations Spec](https://drafts.csswg.org/web-animations-1/#the-animation-interface)
   */
  toAnimation({ target, options: additionalOptions = {}, timeline = document.timeline }: {
    target: Element | null,
    options?: number | KeyframeEffectOptions,
    timeline?: AnimationTimeline | null
  }): Animation {

    const parsedAdditionalOptions = parseOptionsArg(additionalOptions);

    // override existing option keys with additional options
    const options: KeyframeEffectOptions = {
      ...this.options,
      ...parsedAdditionalOptions
    };


    const keyframeEffect = new KeyframeEffect(
      target,
      this.keyframes,
      options
    );

    const animation = new Animation(
      keyframeEffect,
      timeline
    );

    return animation;

  }

}

/**
 * @see
 * - https://drafts.csswg.org/web-animations-1/#dom-keyframeeffect-keyframeeffect-target-keyframes-options-options
 * - https://drafts.csswg.org/web-animations-1/#dom-effecttiming-duration
 */
function parseOptionsArg(optionsArg: number | KeyframeEffectOptions) {
  if (typeof optionsArg === 'number')
    return { duration: optionsArg };
  return optionsArg;
}
