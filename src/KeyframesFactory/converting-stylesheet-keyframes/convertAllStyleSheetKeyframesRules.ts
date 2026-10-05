
import type { ConvertedKeyframesRules } from '../data-types/ConvertedKeyframes';
import type { CSSStyleSheetSource } from '../data-types/CSSStyleSheetSource';
import { convertKeyframesRule } from './convertKeyframesRule';


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

    const rules = convertAllStyleSheetKeyframesRulesInStyleSheet(styleSheet);

    for (const [ruleName, keyframesRule] of rules) {
      if (keyframesRules.has(ruleName))
        console.warn(`Found multiple declarations for keyframes rule ${ruleName}. Using rule from last stylesheet in list.`);
      
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
