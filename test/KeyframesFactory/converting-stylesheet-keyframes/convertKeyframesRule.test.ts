import { describe, it, expect, assert } from 'vitest';
import { convertStyleSheetKeyframes } from '../../../src/index';
import { createStyleSheet } from './createStyleSheet-helper';


describe('convertKeyframesRule - property name conversion', () => {

  it('converts kebab-case to camelCase', async () => {
    const sheet = await createStyleSheet(`
      @keyframes test {
        0% { background-color: red; }
        100% { background-color: blue; }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'test', in: sheet });
    assert(result);
    expect(result.keyframes[0]).toHaveProperty('backgroundColor');
  });

  it('converts float to cssFloat', async () => {
    const sheet = await createStyleSheet(`
      @keyframes test {
        0% { float: left; }
        100% { float: right; }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'test', in: sheet });
    assert(result);
    expect(result.keyframes[0]).toHaveProperty('cssFloat');
  });

  it('preserves custom properties (--*)', async () => {
    const sheet = await createStyleSheet(`
      @keyframes test {
        0% { --my-color: red; }
        100% { --my-color: blue; }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'test', in: sheet });
    assert(result);
    expect(result.keyframes[0]).toHaveProperty('--my-color');
  });

  it('handles -webkit- prefixed properties', async () => {
    const sheet = await createStyleSheet(`
      @keyframes test {
        0% { -webkit-text-stroke-width: 0px; }
        100% { -webkit-text-stroke-width: 2px; }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'test', in: sheet });
    assert(result);
    // Browser may normalize -webkit- properties; check that the result is valid camelCase
    const keys = Object.keys(result.keyframes[0]).filter(k => k !== 'offset');
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      // Should not contain hyphens (converted to camelCase)
      expect(key).not.toContain('-');
    }
  });

  it('handles multi-word kebab-case properties', async () => {
    const sheet = await createStyleSheet(`
      @keyframes test {
        0% { border-top-left-radius: 0px; }
        100% { border-top-left-radius: 10px; }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'test', in: sheet });
    assert(result);
    expect(result.keyframes[0]).toHaveProperty('borderTopLeftRadius');
  });

});


describe('convertKeyframesRule - offset conversion', () => {

  it('converts percentage to offset (0-1 range)', async () => {
    const sheet = await createStyleSheet(`
      @keyframes test {
        0% { opacity: 0; }
        25% { opacity: 0.25; }
        50% { opacity: 0.5; }
        75% { opacity: 0.75; }
        100% { opacity: 1; }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'test', in: sheet });
    assert(result);
    const offsets = result.keyframes.map(k => k.offset);
    expect(offsets).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('handles multiple properties per keyframe', async () => {
    const sheet = await createStyleSheet(`
      @keyframes test {
        0% { opacity: 0; transform: scale(0); }
        100% { opacity: 1; transform: scale(1); }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'test', in: sheet });
    assert(result);
    expect(result.keyframes[0]).toMatchObject({
      offset: 0,
      opacity: '0',
      transform: 'scale(0)'
    });
  });

});


describe('convertKeyframesRule - easing', () => {

  it('converts animation-timing-function to keyframe easing', async () => {
    const sheet = await createStyleSheet(`
      @keyframes test {
        0% { opacity: 0; animation-timing-function: steps(2); }
        100% { opacity: 1; }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'test', in: sheet });
    assert(result);
    expect(result.keyframes[0]).toEqual({ offset: 0, opacity: '0', easing: 'steps(2)' });
  });

  it('defaults keyframe easing to ease, like CSS', async () => {
    const sheet = await createStyleSheet(`
      @keyframes test {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
    `);

    const result = convertStyleSheetKeyframes({ of: 'test', in: sheet });
    assert(result);
    expect(result.keyframes.map(k => k.easing)).toEqual(['ease', 'ease']);
  });

  it('plays back like the CSS animation', async () => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes test {
        0% { opacity: 0; }
        49.99% { opacity: 1; animation-timing-function: ease-in; }
        50% { opacity: 0; }
        100% { opacity: 1; }
      }
      .css-anim { animation: test 1000ms paused; }
    `;
    document.head.appendChild(style);

    const cssEl = document.createElement('div');
    cssEl.className = 'css-anim';
    const convertedEl = document.createElement('div');
    document.body.append(cssEl, convertedEl);

    try {
      const cssAnim = cssEl.getAnimations()[0];
      assert(cssAnim);

      const result = convertStyleSheetKeyframes({ of: 'test', in: document.styleSheets });
      assert(result);
      const convertedAnim = result.toKeyframeEffect(1000).toAnimation({ target: convertedEl });
      convertedAnim.pause();

      const opacity = (el: Element) => Number(getComputedStyle(el).opacity);

      for (const time of [100, 250, 400, 499, 501, 600, 750, 900]) {
        cssAnim.currentTime = time;
        convertedAnim.currentTime = time;
        expect(opacity(convertedEl), `at ${time}ms`).toBeCloseTo(opacity(cssEl), 3);
      }
    } finally {
      style.remove();
      cssEl.remove();
      convertedEl.remove();
    }
  });

});
