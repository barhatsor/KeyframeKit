
import type { CSSStyleSheetSource } from '../data-types/CSSStyleSheetSource';
import { ConvertedKeyframes } from '../data-types/ConvertedKeyframes';
import { convertKeyframesRule } from './convertKeyframesRule';


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
export function convertStyleSheetKeyframes({ of: ruleName, in: source }: {
  of: string,
  in: CSSStyleSheetSource
}): ConvertedKeyframes | undefined {

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

function convertStyleSheetKeyframesInStyleSheetList({ of: ruleName, styleSheetList }: {
  of: string,
  styleSheetList: StyleSheetList
}) {

  const foundRules = Array.from(styleSheetList)
    .map(styleSheet => findKeyframesRuleInStyleSheet({ ruleName, styleSheet }))
    .filter(rule => rule !== undefined);

  const foundRule = foundRules.at(-1);
  if (foundRule === undefined)
    return

  if (foundRules.length > 1)
    console.warn(`Found multiple declarations for keyframes rule ${ruleName}. Using rule from last stylesheet in list.`);

  return convertKeyframesRule(foundRule);

}

function convertStyleSheetKeyframesInStyleSheet({ of: ruleName, styleSheet }: {
  of: string,
  styleSheet: CSSStyleSheet
}) {

  const rule = findKeyframesRuleInStyleSheet({ ruleName, styleSheet });

  if (rule === undefined)
    return;

  return convertKeyframesRule(rule);

}

function findKeyframesRuleInStyleSheet({ ruleName, styleSheet }: {
  ruleName: string,
  styleSheet: CSSStyleSheet
}) {

  const cssRules = Array.from(styleSheet.cssRules);

  const rule = cssRules.find((rule): rule is CSSKeyframesRule =>
    rule instanceof CSSKeyframesRule &&
    rule.name === ruleName
  );

  return rule;

}
