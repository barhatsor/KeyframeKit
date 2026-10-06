
import type { CSSStyleSheetSource } from '../data-types/CSSStyleSheetSource';
import { ConvertedKeyframes } from '../data-types/ConvertedKeyframes';
import { convertKeyframesRule } from './convertKeyframesRule';
import { isStyleSheetAccessible } from './isStyleSheetAccessible';


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
    .filter(isStyleSheetAccessible)
    .map(styleSheet => findKeyframesRuleInStyleSheet({ ruleName, styleSheet }))
    .filter(rule => rule !== undefined);

  // the last rule with the name is the one CSS uses
  // see: https://drafts.csswg.org/css-animations/#keyframes
  const foundRule = foundRules.at(-1);
  if (foundRule === undefined)
    return

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

  // the last rule with the name is the one CSS uses
  // see: https://drafts.csswg.org/css-animations/#keyframes
  const rule = cssRules.findLast((rule): rule is CSSKeyframesRule =>
    rule instanceof CSSKeyframesRule &&
    rule.name === ruleName
  );

  return rule;

}
