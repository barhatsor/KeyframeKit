
import { ConvertedKeyframes } from '../data-types/ConvertedKeyframes';


const CHARS = {
  PERCENT_SIGN: '%',
  COMMA: ',',
  HYPHEN_MINUS: '-',
  DOUBLE_HYPHEN_MINUS: '--',
  WEBKIT_PREFIX: '-webkit-'
} as const;


/**
 * Converts a CSS keyframes rule to Web Animations API keyframes.
 * @param keyframesRule The rule to convert.
 * @group Converting Stylesheet Keyframes
 */
export function convertKeyframesRule(
  keyframesRule: CSSKeyframesRule
): ConvertedKeyframes {

  const keyframes = Array.from(keyframesRule);

  // we `flatMap` as keyframes can be conjoined, eg. `0%, 100%`
  // and we have to split them for the Web Animations API's format
  // see: https://drafts.csswg.org/css-animations/#dom-csskeyframerule-keytext
  const parsedKeyframes = keyframes.flatMap(keyframe =>
    parseKeyText(keyframe.keyText).map(percent =>
      parseKeyframe({ keyframe, percent })
    )
  );

  // sort the keyframes in place by escalating offset
  // (this is required to avoid a TypeError,
  // see: https://drafts.csswg.org/web-animations-1/#processing-a-keyframes-argument).
  // note: the `!` are safe: these are keyframes created by
  // us, which always have an offset.
  parsedKeyframes.sort((a, b) => a.offset! - b.offset!);

  return new ConvertedKeyframes(parsedKeyframes);

}

function parseKeyframe({ keyframe, percent }: {
  keyframe: CSSKeyframeRule,
  percent: number
}) {

  const offset = percent / 100;

  const parsedProperties = parseKeyframeProperties(keyframe.style);

  const parsedKeyframe: Keyframe = {
    ...parsedProperties,
    offset
  };

  return parsedKeyframe;

}

/** https://drafts.csswg.org/web-animations-1/#processing-a-keyframes-argument */
type KeyframeProperties = { [propertyName: string]: string };

function parseKeyframeProperties(style: CSSStyleDeclaration) {

  const parsedProperties: KeyframeProperties = {};

  for (const propertyName of style) {

    /// https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/getPropertyValue
    const propertyValue = style.getPropertyValue(propertyName);

    /// https://drafts.csswg.org/web-animations-1/#ref-for-animation-property-name-to-idl-attribute-name%E2%91%A0
    const attributeName = animationPropertyNameToIDLAttributeName(
      propertyName
    );

    parsedProperties[attributeName] = propertyValue;

  }

  return parsedProperties;

}

/** https://drafts.csswg.org/css-animations/#dom-csskeyframerule-keytext */
function parseKeyText(keyText: string) {

  const percentages = keyText.split(CHARS.COMMA);

  // we need to trim `percent`, as Blink
  // returns spaced keyText percentages (e.g. `1%, 2%`)
  const parsePercent = (percent: string) => Number(
    removeSuffix(percent.trim(), CHARS.PERCENT_SIGN)
  );

  return percentages.map(
    percent => parsePercent(percent)
  );

}


/** https://drafts.csswg.org/web-animations-1/#animation-property-name-to-idl-attribute-name */
function animationPropertyNameToIDLAttributeName(property: string) {

  if (isCustomPropertyName(property)) return property;

  if (property === 'float') return 'cssFloat';

  if (property === 'offset') return 'cssOffset';

  // https://drafts.csswg.org/cssom/#ref-for-supported-css-property%E2%91%A2
  const lowercaseFirst = isWebkitCasedAttribute(property);

  return cssPropertyToIDLAttribute(property, lowercaseFirst);

}

/** https://drafts.csswg.org/cssom/#css-property-to-idl-attribute */
function cssPropertyToIDLAttribute(property: string, lowercaseFirst: boolean = false) {

  let output = '';
  let uppercaseNext = false;

  if (lowercaseFirst)
    property = property.slice(1);

  for (const c of property) {

    if (c === CHARS.HYPHEN_MINUS) {

      uppercaseNext = true;

    } else if (uppercaseNext) {

      uppercaseNext = false;

      output += c.toUpperCase();

    } else {

      output += c;

    }

  }

  return output;

}

/** https://drafts.csswg.org/css-variables-2/#typedef-custom-property-name */
function isCustomPropertyName(property: string) {
  return property.startsWith(CHARS.DOUBLE_HYPHEN_MINUS) &&
         property !== CHARS.DOUBLE_HYPHEN_MINUS;
}

/** https://drafts.csswg.org/cssom/#ref-for-supported-css-property%E2%91%A2 */
function isWebkitCasedAttribute(property: string) {
  return property.startsWith(CHARS.WEBKIT_PREFIX);
}


function removeSuffix(value: string, suffix: string) {
  return value.slice(0, -suffix.length);
}
