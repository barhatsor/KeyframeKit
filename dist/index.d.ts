/**
 * KeyframeKit
 * @license MIT
 */
/**
 * Gets all the CSS keyframes rules in a stylesheet or stylesheet list,
 * then converts them to Web Animations API keyframes.
 * @param obj
 *  @param obj.in The style sheet or style sheet list to get keyframes from.
 * @throws
 *  - `TypeError`
 *    - Thrown if source is not a `CSSStyleSheet` or a `StyleSheetList`.
 *  - `SecurityError`
 *    - Thrown if source is a `CSSStyleSheet` whose rules can't be read
 *      (e.g. a cross-origin stylesheet loaded without CORS).
 * @remarks
 *  - If multiple rules have the same name, the last one is used, like in CSS.
 *  - When reading a `StyleSheetList`, stylesheets whose rules can't be read
 *    are skipped.
 *  - Only top-level rules are read: `@keyframes` rules nested in other rules
 *    (e.g. `@media`, `@supports` or `@layer`) aren't found.
 * @group Converting Stylesheet Keyframes
 */
export declare function convertAllStyleSheetKeyframesRules({ in: source }: {
    in: CSSStyleSheetSource;
}): ConvertedKeyframesRules;

/**
 * Web Animations API keyframes converted with the factory functions.
 *
 * Call {@linkcode toKeyframeEffect} to create an animation from them.
 * @group Data Types
 */
export declare class ConvertedKeyframes {
    keyframes: Keyframe[];
    constructor(keyframes: Keyframe[]);
    /**
     * @param options Keyframe effect options.
     *  [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect#options)
     *
     *  To ease like CSS, leave out `easing`. If you set it, it eases the whole
     *  animation at once, on top of each keyframe's easing.
     */
    toKeyframeEffect(options: number | KeyframeEffectOptions | null): KeyframeEffectParameters;
}

/**
 * Maps CSS keyframes rule names to their converted Web Animations API keyframes.
 * @group Data Types
 */
export declare type ConvertedKeyframesRules = Map<string, ConvertedKeyframes>;

/**
 * Converts a CSS keyframes rule to Web Animations API keyframes.
 * @param keyframesRule The rule to convert.
 * @group Converting Stylesheet Keyframes
 */
export declare function convertKeyframesRule(keyframesRule: CSSKeyframesRule): ConvertedKeyframes;

/**
 * Converts a CSS keyframes rule from a stylesheet (or stylesheet list)
 * into Web Animations API keyframes.
 * @param obj
 *  @param obj.of The name of the `@keyframes` rule to get keyframes from.
 *  @param obj.in The stylesheet or stylesheet list where the rule resides.
 * @throws
 *  - `TypeError`
 *    - Thrown if keyframes rule name is not a string.
 *  - `TypeError`
 *    - Thrown if source is not a `CSSStyleSheet` or a `StyleSheetList`.
 *  - `SecurityError`
 *    - Thrown if source is a `CSSStyleSheet` whose rules can't be read
 *      (e.g. a cross-origin stylesheet loaded without CORS).
 * @remarks
 *  - If multiple rules have the name, the last one is used, like in CSS.
 *  - When searching a `StyleSheetList`, stylesheets whose rules can't be read
 *    are skipped.
 *  - Only top-level rules are read: `@keyframes` rules nested in other rules
 *    (e.g. `@media`, `@supports` or `@layer`) aren't found.
 * @group Converting Stylesheet Keyframes
 */
export declare function convertStyleSheetKeyframes({ of: ruleName, in: source }: {
    of: string;
    in: CSSStyleSheetSource;
}): ConvertedKeyframes | undefined;

/**
 * A stylesheet or stylesheet list.
 * @group Data Types
 */
export declare type CSSStyleSheetSource = CSSStyleSheet | StyleSheetList;

/**
 * Gets a document's stylesheets when it loads,
 * or immediately returns them if it's already loaded.
 * @param document The document to get stylesheets from.
 * @group Sourcing Stylesheets
 */
export declare function getDocumentStyleSheetsOnLoad(document?: Document): Promise<StyleSheetList>;

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
export declare function importStyleSheet(url: string): Promise<CSSStyleSheet>;

/**
 * A keyframes object.
 *  [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
 * @see
 *  [Processing a keyframes argument - Web Animations Spec](https://drafts.csswg.org/web-animations-1/#processing-a-keyframes-argument)
 * @group Defining Animations
 */
export declare type KeyframeArgument = Keyframe[] | PropertyIndexedKeyframes;

/**
 * Provides a more convenient way to define animations than is offered natively.
 * @see
 *  [The KeyframeEffect interface - Web Animations Spec](https://drafts.csswg.org/web-animations-1/#the-keyframeeffect-interface)
 * @group Defining Animations
 */
export declare class KeyframeEffectParameters {
    keyframes: KeyframeArgument;
    options: KeyframeEffectOptions;
    /**
     * @param obj
     *  @param obj.keyframes A keyframes object.
     *   [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
     *  @param obj.options Keyframe effect options.
     *   [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect#options)
     */
    constructor({ keyframes, options }: {
        keyframes: KeyframeArgument;
        options?: number | KeyframeEffectOptions;
    });
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
    toAnimation({ target, options: additionalOptions, timeline }: {
        target: Element | null;
        options?: number | KeyframeEffectOptions;
        timeline?: AnimationTimeline | null;
    }): Animation;
}

declare namespace KeyframesFactory {
    export {
        getDocumentStyleSheetsOnLoad,
        importStyleSheet,
        convertStyleSheetKeyframes,
        convertAllStyleSheetKeyframesRules,
        convertKeyframesRule,
        ConvertedKeyframes,
        ConvertedKeyframesRules,
        CSSStyleSheetSource
    }
}
export default KeyframesFactory;

export { }
