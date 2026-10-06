import { describe, it, expect, assert } from 'vitest';
import { convertAllStyleSheetKeyframesRules, ConvertedKeyframes } from '../../../src/index';
import { createStyleSheet } from './createStyleSheet-helper';
import { appendUnreadableStyleSheet } from './appendUnreadableStyleSheet-helper';


describe('convertAllStyleSheetKeyframesRules', () => {

  it('extracts all keyframes rules from a stylesheet', async () => {
    const sheet = await createStyleSheet(`
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes slideUp {
        0% { transform: translateY(100px); }
        100% { transform: translateY(0px); }
      }
      .some-class { color: red; }
    `);

    const result = convertAllStyleSheetKeyframesRules({ in: sheet });

    expect(result.size).toBe(2);
    expect(result.get('fadeIn')).toBeInstanceOf(ConvertedKeyframes);
    expect(result.get('slideUp')).toBeInstanceOf(ConvertedKeyframes);
  });

  it('returns empty object when no keyframes rules exist', async () => {
    const sheet = await createStyleSheet('.foo { color: red; }');

    const result = convertAllStyleSheetKeyframesRules({ in: sheet });
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('works with StyleSheetList', async () => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
    `;
    document.head.appendChild(style);

    try {
      const result = convertAllStyleSheetKeyframesRules({
        in: document.styleSheets
      });
      expect(result.get('bounce')).toBeInstanceOf(ConvertedKeyframes);
    } finally {
      document.head.removeChild(style);
    }
  });

  it('throws TypeError for invalid source', () => {
    expect(() => {
      convertAllStyleSheetKeyframesRules({ in: 'bad' as any });
    }).toThrow(TypeError);
  });

  it('skips unreadable stylesheets in a StyleSheetList', () => {
    const unreadableStyle = appendUnreadableStyleSheet(`
      @keyframes unreadable { 0% { opacity: 0; } 100% { opacity: 1; } }
    `);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
    `;
    document.head.appendChild(style);

    try {
      const result = convertAllStyleSheetKeyframesRules({
        in: document.styleSheets
      });

      expect(result.get('fadeIn')).toBeInstanceOf(ConvertedKeyframes);
      expect(result.has('unreadable')).toBe(false);
    } finally {
      unreadableStyle.remove();
      style.remove();
    }
  });

  it('throws SecurityError for an unreadable CSSStyleSheet', () => {
    const unreadableStyle = appendUnreadableStyleSheet(`
      @keyframes unreadable { 0% { opacity: 0; } 100% { opacity: 1; } }
    `);

    try {
      assert(unreadableStyle.sheet);
      const sheet = unreadableStyle.sheet;

      expect(() => {
        convertAllStyleSheetKeyframesRules({ in: sheet });
      }).toThrow(expect.objectContaining({ name: 'SecurityError' }));
    } finally {
      unreadableStyle.remove();
    }
  });

});
