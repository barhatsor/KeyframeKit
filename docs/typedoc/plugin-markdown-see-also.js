// @ts-check
import { Reflection, ReflectionKind } from 'typedoc';

/**
 * Recursively collect IDs of all reflections directly referenced by a type node.
 *
 * @param {import('typedoc').SomeType | undefined} type
 * @param {Set<number>} out
 */
function collectRefIds(type, out) {
  if (!type) return;
  switch (type.type) {
    case 'reference': {
      const r = type.reflection;
      if (r) out.add(r.id);
      for (const a of type.typeArguments ?? []) collectRefIds(a, out);
      break;
    }
    case 'union':
    case 'intersection':
      for (const t of type.types ?? []) collectRefIds(t, out);
      break;
    case 'array':
    case 'optional':
    case 'rest':
      collectRefIds(type.elementType, out);
      break;
    case 'tuple':
      for (const t of type.elements ?? []) collectRefIds(t, out);
      break;
    case 'namedTupleMember':
      collectRefIds(type.element, out);
      break;
    case 'conditional':
      collectRefIds(type.checkType, out);
      collectRefIds(type.extendsType, out);
      collectRefIds(type.trueType, out);
      collectRefIds(type.falseType, out);
      break;
    case 'typeOperator':
      collectRefIds(type.target, out);
      break;
    case 'mapped':
      collectRefIds(type.parameterType, out);
      collectRefIds(type.templateType, out);
      collectRefIds(type.nameType, out);
      break;
    case 'predicate':
      collectRefIds(type.targetType, out);
      break;
    case 'query':
      collectRefIds(type.queryType, out);
      break;
    case 'indexedAccess':
      collectRefIds(type.objectType, out);
      collectRefIds(type.indexType, out);
      break;
    case 'reflection':
      if (type.declaration) collectRefsInDecl(type.declaration, out);
      break;
    default:
      break;
  }
}

/**
 * Collect all referenced reflection IDs within a DeclarationReflection
 * (its own type, signatures, accessors, index signatures, type parameters).
 *
 * @param {import('typedoc').DeclarationReflection} decl
 * @param {Set<number>} out
 */
function collectRefsInDecl(decl, out) {
  collectRefIds(decl.type, out);

  for (const sig of decl.signatures ?? []) {
    collectRefIds(sig.type, out); // return type
    for (const p of sig.parameters ?? []) collectRefIds(p.type, out);
    for (const tp of sig.typeParameters ?? []) {
      collectRefIds(tp.type, out);
      collectRefIds(tp.default, out);
    }
  }

  if (decl.getSignature) collectRefIds(decl.getSignature.type, out);
  if (decl.setSignature) {
    collectRefIds(decl.setSignature.type, out);
    for (const p of decl.setSignature.parameters ?? []) collectRefIds(p.type, out);
  }

  for (const idx of decl.indexSignatures ?? []) {
    collectRefIds(idx.type, out);
    for (const p of idx.parameters ?? []) collectRefIds(p.type, out);
  }

  for (const tp of decl.typeParameters ?? []) {
    collectRefIds(tp.type, out);
    collectRefIds(tp.default, out);
  }
}

/**
 * @typedef {object} SeeAlsoEntry
 * @property {Map<number, Set<import('typedoc').DeclarationReflection>>} reverse
 *   Pages/members whose code references the current page's symbol.
 * @property {Map<number, Set<import('typedoc').DeclarationReflection>>} forward
 *   Symbols/pages that the current page's code references.
 */

/**
 * Build see-also maps with two directions computed in a single pass.
 *
 * For every type reference from referrer R (on page P) to symbol S (on page Q):
 *   Reverse — Q's see-also gets R  (the referenced type's page links to whoever uses it)
 *   Forward — P's see-also gets S  (the referrer's page links to the types it uses)
 *
 * @param {import('typedoc').ProjectReflection} project
 * @param {import('typedoc').Router} router
 * @returns {SeeAlsoEntry}
 */
function buildSeeAlsoMaps(project, router) {
  /** @type {Map<number, Set<import('typedoc').DeclarationReflection>>} */
  const reverse = new Map();
  /** @type {Map<number, Set<import('typedoc').DeclarationReflection>>} */
  const forward = new Map();

  /** @type {Map<number, import('typedoc').DeclarationReflection>} */
  const linkTargetMap = new Map();
  /** @type {Map<number, import('typedoc').DeclarationReflection>} */
  const pageOwnerMap = new Map();

  for (const target of router.getLinkTargets()) {
    if (!(target instanceof Reflection)) continue;
    if (target.isProject()) continue;
    const decl = /** @type {import('typedoc').DeclarationReflection} */ (target);
    linkTargetMap.set(decl.id, decl);
    if (router.hasOwnDocument(target)) {
      pageOwnerMap.set(decl.id, decl);
    }
  }

  /**
   * Walk up to the nearest Declaration with a URL that isn't a TypeLiteral.
   * Skips signatures and TypeLiteral (__type) nodes while keeping methods,
   * properties, constructors, and other user-facing declarations.
   *
   * @param {import('typedoc').Reflection} refl
   * @returns {import('typedoc').DeclarationReflection | undefined}
   */
  function findLinkTarget(refl) {
    /** @type {import('typedoc').Reflection | undefined} */
    let cursor = refl;
    while (cursor) {
      if (cursor instanceof Reflection && linkTargetMap.has(cursor.id)) {
        if (cursor.isDeclaration() && !cursor.kindOf(ReflectionKind.TypeLiteral)) {
          return linkTargetMap.get(cursor.id);
        }
      }
      cursor = cursor.parent;
    }
    return undefined;
  }

  /**
   * Walk up to the nearest page-owning reflection.
   * @param {import('typedoc').Reflection} refl
   * @returns {import('typedoc').DeclarationReflection | undefined}
   */
  function findPageOwner(refl) {
    /** @type {import('typedoc').Reflection | undefined} */
    let cursor = refl;
    while (cursor) {
      if (cursor instanceof Reflection && pageOwnerMap.has(cursor.id)) {
        return pageOwnerMap.get(cursor.id);
      }
      cursor = cursor.parent;
    }
    return undefined;
  }

  for (const refl of Object.values(project.reflections)) {
    if (refl.isProject()) continue;
    const decl = /** @type {import('typedoc').DeclarationReflection} */ (refl);

    const referrer = findLinkTarget(decl);
    if (!referrer || referrer.isProject()) continue;
    const referrerPage = findPageOwner(referrer);
    if (!referrerPage) continue;

    /** @type {Set<number>} */
    const refIds = new Set();
    collectRefsInDecl(decl, refIds);

    for (const refId of refIds) {
      const refRefl = project.getReflectionById(refId);
      if (!refRefl) continue;
      const refTarget = findLinkTarget(refRefl);
      if (!refTarget) continue;
      const refPage = findPageOwner(refTarget);
      if (!refPage || refPage.id === referrerPage.id) continue;

      if (!reverse.has(refPage.id)) reverse.set(refPage.id, new Set());
      reverse.get(refPage.id)?.add(referrer);

      if (!forward.has(referrerPage.id)) forward.set(referrerPage.id, new Set());
      forward.get(referrerPage.id)?.add(refTarget);
    }
  }

  return { reverse, forward };
}

// ─── Plugin entry point ───────────────────────────────────────────────────────

/** @param {import('typedoc-plugin-markdown').MarkdownApplication} app */
export function load(app) {

  /** @type {SeeAlsoEntry} */
  let seeAlso = { reverse: new Map(), forward: new Map() };

  app.renderer.preMarkdownRenderAsyncJobs.push(async (event) => {
    const router = app.renderer.router;
    if (!router || !event.project) return;
    seeAlso = buildSeeAlsoMaps(event.project, router);
  });

  app.renderer.markdownHooks.on('page.end', ({ page, router }) => {
    if (!page.isReflectionEvent()) return '';

    const model = /** @type {import('typedoc').DeclarationReflection} */ (page.model);
    const reverseRefs = seeAlso.reverse.get(model.id);
    const forwardRefs = seeAlso.forward.get(model.id);
    if (!reverseRefs?.size && !forwardRefs?.size) return '';

    const byName = (/** @type {import('typedoc').DeclarationReflection} */ a, /** @type {import('typedoc').DeclarationReflection} */ b) =>
      a.getFriendlyFullName().localeCompare(b.getFriendlyFullName());

    const seen = new Set();
    let linksText = '';

    /** @param {import('typedoc').DeclarationReflection} ref */
    const formatLink = (ref) => {
      if (ref.id === model.id || seen.has(ref.id)) return;
      seen.add(ref.id);
      const url = router.relativeUrl(model, ref);
      linksText += `\n- [${ref.getFriendlyFullName()}](${url})`;
    };

    /*
    if (forwardRefs) {
      linksText += '\n### Referenced Here';
      [...forwardRefs].sort(byName).forEach(formatLink);
    }
    */
    if (reverseRefs) {
      // linksText += '\n### References This';
      [...reverseRefs].sort(byName).forEach(formatLink);
    }

    if (!linksText) return '';
    return `\n## See Also\n${linksText}\n`;
  });
}
