import { describe, it, expect, assert } from 'vitest';
import { convertStyleSheetKeyframes, ConvertedKeyframes } from '../../../src/index';
import { createStyleSheet } from './createStyleSheet-helper';
import { appendUnreadableStyleSheet } from './appendUnreadableStyleSheet-helper';


describe('convertStyleSheetKeyframes', () => {

  it('extracts a named keyframes rule from a CSSStyleSheet', async () => {
    const sheet = await createStyleSheet(`
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'fadeIn', in: sheet });

    assert(result);
    expect(result).toBeInstanceOf(ConvertedKeyframes);
    expect(result.keyframes).toHaveLength(2);
    expect(result.keyframes[0]).toMatchObject({ offset: 0, opacity: '0' });
    expect(result.keyframes[1]).toMatchObject({ offset: 1, opacity: '1' });
  });

  it('uses the last of multiple rules with the same name, like CSS', async () => {
    const sheet = await createStyleSheet(`
      @keyframes fade { 0% { opacity: 0.1; } 100% { opacity: 0.2; } }
      @keyframes fade { 0% { opacity: 0.8; } 100% { opacity: 0.9; } }
    `);

    const result = convertStyleSheetKeyframes({ of: 'fade', in: sheet });

    assert(result);
    expect(result.keyframes[0]).toMatchObject({ opacity: '0.8' });
  });

  it('returns undefined for a non-existent rule name', async () => {
    const sheet = await createStyleSheet(`
      @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
    `);

    const result = convertStyleSheetKeyframes({ of: 'doesNotExist', in: sheet });
    expect(result).toBeUndefined();
  });

  it('throws TypeError for non-string rule name', async () => {
    const sheet = await createStyleSheet('');

    expect(() => {
      convertStyleSheetKeyframes({ of: 123 as any, in: sheet });
    }).toThrow(TypeError);
  });

  it('throws TypeError for invalid source', () => {
    expect(() => {
      convertStyleSheetKeyframes({ of: 'test', in: {} as any });
    }).toThrow(TypeError);
  });

  it('searches through a StyleSheetList', async () => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        0% { transform: translateX(-100px); }
        100% { transform: translateX(0px); }
      }
    `;
    document.head.appendChild(style);

    try {
      const result = convertStyleSheetKeyframes({
        of: 'slideIn',
        in: document.styleSheets
      });

      assert(result);
      expect(result).toBeInstanceOf(ConvertedKeyframes);
      expect(result.keyframes).toHaveLength(2);
    } finally {
      document.head.removeChild(style);
    }
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
      const result = convertStyleSheetKeyframes({
        of: 'fadeIn',
        in: document.styleSheets
      });

      assert(result);
      expect(result.keyframes).toHaveLength(2);
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
        convertStyleSheetKeyframes({ of: 'unreadable', in: sheet });
      }).toThrow(expect.objectContaining({ name: 'SecurityError' }));
    } finally {
      unreadableStyle.remove();
    }
  });

});
