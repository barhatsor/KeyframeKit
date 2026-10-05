/**
 * KeyframeKit
 * @license MIT
 */
/**
 * Gets a document's stylesheets when it loads,
 * or immediately returns them if it's already loaded.
 * @param document The document to get stylesheets from.
 * @group Sourcing Stylesheets
 */
async function getDocumentStyleSheetsOnLoad(document = window.document) {
    await waitForDocumentLoad(document);
    return document.styleSheets;
}
async function waitForDocumentLoad(document) {
    const isLoaded = () => document.readyState === 'complete';
    if (isLoaded())
        return;
    const { promise, resolve } = Promise.withResolvers();
    const cleanup = new AbortController();
    const onReadyStateChange = () => {
        if (isLoaded())
            resolve();
    };
    document.addEventListener('readystatechange', onReadyStateChange, { signal: cleanup.signal });
    await promise;
    // remove the listener
    cleanup.abort();
}

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
async function importStyleSheet(url) {
    const resp = await fetch(url);
    if (!resp.ok)
        throw new TypeError(`Failed to fetch dynamically imported module: ${url}`);
    const respText = await resp.text();
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(respText);
    return styleSheet;
}

/**
 * Provides a more convenient way to define animations than is offered natively.
 * @see
 *  [The KeyframeEffect interface - Web Animations Spec](https://drafts.csswg.org/web-animations-1/#the-keyframeeffect-interface)
 * @group Defining Animations
 */
class KeyframeEffectParameters {
    keyframes;
    options;
    /**
     * @param obj
     *  @param obj.keyframes A keyframes object.
     *   [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
     *  @param obj.options Keyframe effect options.
     *   [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect#options)
     */
    constructor({ keyframes, options = {} }) {
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
    toAnimation({ target, options: additionalOptions = {}, timeline = document.timeline }) {
        const parsedAdditionalOptions = parseOptionsArg(additionalOptions);
        // override existing option keys with additional options
        const options = {
            ...this.options,
            ...parsedAdditionalOptions
        };
        const keyframeEffect = new KeyframeEffect(target, this.keyframes, options);
        const animation = new Animation(keyframeEffect, timeline);
        return animation;
    }
}
/**
 * @see
 * - https://drafts.csswg.org/web-animations-1/#dom-keyframeeffect-keyframeeffect-target-keyframes-options-options
 * - https://drafts.csswg.org/web-animations-1/#dom-effecttiming-duration
 */
function parseOptionsArg(optionsArg) {
    if (typeof optionsArg === 'number')
        return { duration: optionsArg };
    return optionsArg;
}

/**
 * Web Animations API keyframes converted with the factory functions.
 *
 * Call {@linkcode toKeyframeEffect} to create an animation from them.
 * @group Data Types
 */
class ConvertedKeyframes {
    keyframes;
    constructor(keyframes) {
        this.keyframes = keyframes;
    }
    /**
     * @param options Keyframe effect options.
     *  [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect#options)
     */
    toKeyframeEffect(options) {
        const keyframeEffect = new KeyframeEffectParameters({
            keyframes: this.keyframes,
            // convert (required) nullable to optional
            options: options ?? undefined
        });
        return keyframeEffect;
    }
}

const CHARS = {
    PERCENT_SIGN: '%',
    COMMA: ',',
    HYPHEN_MINUS: '-',
    DOUBLE_HYPHEN_MINUS: '--',
    WEBKIT_PREFIX: '-webkit-'
};
/**
 * Converts a CSS keyframes rule to Web Animations API keyframes.
 * @param keyframesRule The rule to convert.
 * @group Converting Stylesheet Keyframes
 */
function convertKeyframesRule(keyframesRule) {
    const keyframes = Array.from(keyframesRule);
    // we `flatMap` as keyframes can be conjoined, eg. `0%, 100%`
    // and we have to split them for the Web Animations API's format
    // see: https://drafts.csswg.org/css-animations/#dom-csskeyframerule-keytext
    const parsedKeyframes = keyframes.flatMap(keyframe => parseKeyText(keyframe.keyText).map(percent => parseKeyframe({ keyframe, percent })));
    // sort the keyframes in place by escalating offset
    // (this is required to avoid a TypeError,
    // see: https://drafts.csswg.org/web-animations-1/#processing-a-keyframes-argument).
    // note: the `!` are safe: these are keyframes created by
    // us, which always have an offset.
    parsedKeyframes.sort((a, b) => a.offset - b.offset);
    return new ConvertedKeyframes(parsedKeyframes);
}
function parseKeyframe({ keyframe, percent }) {
    const offset = percent / 100;
    const parsedProperties = parseKeyframeProperties(keyframe.style);
    const parsedKeyframe = {
        ...parsedProperties,
        offset
    };
    return parsedKeyframe;
}
function parseKeyframeProperties(style) {
    const parsedProperties = {};
    for (const propertyName of style) {
        /// https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/getPropertyValue
        const propertyValue = style.getPropertyValue(propertyName);
        /// https://drafts.csswg.org/web-animations-1/#ref-for-animation-property-name-to-idl-attribute-name%E2%91%A0
        const attributeName = animationPropertyNameToIDLAttributeName(propertyName);
        parsedProperties[attributeName] = propertyValue;
    }
    return parsedProperties;
}
/** https://drafts.csswg.org/css-animations/#dom-csskeyframerule-keytext */
function parseKeyText(keyText) {
    const percentages = keyText.split(CHARS.COMMA);
    // we need to trim `percent`, as Blink
    // returns spaced keyText percentages (e.g. `1%, 2%`)
    const parsePercent = (percent) => Number(removeSuffix(percent.trim(), CHARS.PERCENT_SIGN));
    return percentages.map(percent => parsePercent(percent));
}
/** https://drafts.csswg.org/web-animations-1/#animation-property-name-to-idl-attribute-name */
function animationPropertyNameToIDLAttributeName(property) {
    if (isCustomPropertyName(property))
        return property;
    if (property === 'float')
        return 'cssFloat';
    if (property === 'offset')
        return 'cssOffset';
    // https://drafts.csswg.org/cssom/#ref-for-supported-css-property%E2%91%A2
    const lowercaseFirst = isWebkitCasedAttribute(property);
    return cssPropertyToIDLAttribute(property, lowercaseFirst);
}
/** https://drafts.csswg.org/cssom/#css-property-to-idl-attribute */
function cssPropertyToIDLAttribute(property, lowercaseFirst = false) {
    let output = '';
    let uppercaseNext = false;
    if (lowercaseFirst)
        property = property.slice(1);
    for (const c of property) {
        if (c === CHARS.HYPHEN_MINUS) {
            uppercaseNext = true;
        }
        else if (uppercaseNext) {
            uppercaseNext = false;
            output += c.toUpperCase();
        }
        else {
            output += c;
        }
    }
    return output;
}
/** https://drafts.csswg.org/css-variables-2/#typedef-custom-property-name */
function isCustomPropertyName(property) {
    return property.startsWith(CHARS.DOUBLE_HYPHEN_MINUS) &&
        property !== CHARS.DOUBLE_HYPHEN_MINUS;
}
/** https://drafts.csswg.org/cssom/#ref-for-supported-css-property%E2%91%A2 */
function isWebkitCasedAttribute(property) {
    return property.startsWith(CHARS.WEBKIT_PREFIX);
}
function removeSuffix(value, suffix) {
    return value.slice(0, -suffix.length);
}

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
 * @group Converting Stylesheet Keyframes
 */
function convertStyleSheetKeyframes({ of: ruleName, in: source }) {
    if (typeof ruleName !== 'string')
        throw new TypeError(`Keyframes rule name must be a string.`);
    switch (true) {
        case source instanceof StyleSheetList:
            return convertStyleSheetKeyframesInStyleSheetList({
                of: ruleName,
                styleSheetList: source
            });
        case source instanceof CSSStyleSheet:
            return convertStyleSheetKeyframesInStyleSheet({
                of: ruleName,
                styleSheet: source
            });
        default:
            throw new TypeError(`Source must be either a CSSStyleSheet or a StyleSheetList.`);
    }
}
function convertStyleSheetKeyframesInStyleSheetList({ of: ruleName, styleSheetList }) {
    const foundRules = Array.from(styleSheetList)
        .map(styleSheet => findKeyframesRuleInStyleSheet({ ruleName, styleSheet }))
        .filter(rule => rule !== undefined);
    const foundRule = foundRules.at(-1);
    if (foundRule === undefined)
        return;
    if (foundRules.length > 1)
        console.warn(`Found multiple declarations for keyframes rule ${ruleName}. Using rule from last stylesheet in list.`);
    return convertKeyframesRule(foundRule);
}
function convertStyleSheetKeyframesInStyleSheet({ of: ruleName, styleSheet }) {
    const rule = findKeyframesRuleInStyleSheet({ ruleName, styleSheet });
    if (rule === undefined)
        return;
    return convertKeyframesRule(rule);
}
function findKeyframesRuleInStyleSheet({ ruleName, styleSheet }) {
    const cssRules = Array.from(styleSheet.cssRules);
    const rule = cssRules.find((rule) => rule instanceof CSSKeyframesRule &&
        rule.name === ruleName);
    return rule;
}

/**
 * Gets all the CSS keyframes rules in a stylesheet or stylesheet list,
 * then converts them to Web Animations API keyframes.
 * @param obj
 *  @param obj.in The style sheet or style sheet list to get keyframes from.
 * @throws
 *  - `TypeError`
 *    - Thrown if source is not a `CSSStyleSheet` or a `StyleSheetList`.
 * @group Converting Stylesheet Keyframes
 */
function convertAllStyleSheetKeyframesRules({ in: source }) {
    switch (true) {
        case source instanceof StyleSheetList:
            return convertAllStyleSheetKeyframesRulesInStyleSheetList(source);
        case source instanceof CSSStyleSheet:
            return convertAllStyleSheetKeyframesRulesInStyleSheet(source);
        default:
            throw new TypeError(`Source must be either a CSSStyleSheet or a StyleSheetList.`);
    }
}
function convertAllStyleSheetKeyframesRulesInStyleSheetList(styleSheetList) {
    const keyframesRules = new Map();
    for (const styleSheet of styleSheetList) {
        const rules = convertAllStyleSheetKeyframesRulesInStyleSheet(styleSheet);
        for (const [ruleName, keyframesRule] of rules) {
            if (keyframesRules.has(ruleName))
                console.warn(`Found multiple declarations for keyframes rule ${ruleName}. Using rule from last stylesheet in list.`);
            keyframesRules.set(ruleName, keyframesRule);
        }
    }
    return keyframesRules;
}
function convertAllStyleSheetKeyframesRulesInStyleSheet(styleSheet) {
    const keyframesRules = new Map();
    for (const rule of styleSheet.cssRules) {
        if (!(rule instanceof CSSKeyframesRule))
            continue;
        const keyframes = convertKeyframesRule(rule);
        keyframesRules.set(rule.name, keyframes);
    }
    return keyframesRules;
}

const KeyframesFactory = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    ConvertedKeyframes,
    convertAllStyleSheetKeyframesRules,
    convertKeyframesRule,
    convertStyleSheetKeyframes,
    getDocumentStyleSheetsOnLoad,
    importStyleSheet
}, Symbol.toStringTag, { value: 'Module' }));

export { ConvertedKeyframes, KeyframeEffectParameters, convertAllStyleSheetKeyframesRules, convertKeyframesRule, convertStyleSheetKeyframes, KeyframesFactory as default, getDocumentStyleSheetsOnLoad, importStyleSheet };
//# sourceMappingURL=index.js.map
