
import type { ConvertedKeyframesRules } from '../data-types/ConvertedKeyframes';
import type { CSSStyleSheetSource } from '../data-types/CSSStyleSheetSource';
import { convertKeyframesRule } from './convertKeyframesRule';
import { isStyleSheetAccessible } from './isStyleSheetAccessible';


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
 * @group Converting Stylesheet Keyframes
 */
export function convertAllStyleSheetKeyframesRules({ in: source }: {
  in: CSSStyleSheetSource
}): ConvertedKeyframesRules {

  switch (true) {
    case source instanceof StyleSheetList:
      return convertAllStyleSheetKeyframesRulesInStyleSheetList(source);
    case source instanceof CSSStyleSheet:
      return convertAllStyleSheetKeyframesRulesInStyleSheet(source);
    default:
      throw new TypeError(`Source must be either a CSSStyleSheet or a StyleSheetList.`);
  }

}

function convertAllStyleSheetKeyframesRulesInStyleSheetList(
  styleSheetList: StyleSheetList
): ConvertedKeyframesRules {

  const keyframesRules: ConvertedKeyframesRules = new Map();

  for (const styleSheet of styleSheetList) {

    if (!isStyleSheetAccessible(styleSheet))
      continue;

    const rules = convertAllStyleSheetKeyframesRulesInStyleSheet(styleSheet);

    for (const [ruleName, keyframesRule] of rules) {
      // the last rule with the name is the one CSS uses
      // see: https://drafts.csswg.org/css-animations/#keyframes
      keyframesRules.set(ruleName, keyframesRule);
    }

  }

  return keyframesRules;

}

function convertAllStyleSheetKeyframesRulesInStyleSheet(
  styleSheet: CSSStyleSheet
): ConvertedKeyframesRules {

  const keyframesRules: ConvertedKeyframesRules = new Map();

  for (const rule of styleSheet.cssRules) {

    if (!(rule instanceof CSSKeyframesRule))
      continue;

    const keyframes = convertKeyframesRule(rule);

    keyframesRules.set(rule.name, keyframes);

  }

  return keyframesRules;

}
