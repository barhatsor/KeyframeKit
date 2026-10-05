import { describe, it, expect } from 'vitest';
import { ConvertedKeyframes, KeyframeEffectParameters } from '../../../src/index';


describe('ParsedKeyframes', () => {

  it('stores keyframes array', () => {
    const keyframes = [
      { offset: 0, opacity: '0' },
      { offset: 1, opacity: '1' }
    ];
    const parsed = new ConvertedKeyframes(keyframes);
    expect(parsed.keyframes).toBe(keyframes);
  });

  it('toKeyframeEffect returns KeyframeEffectParameters with options', () => {
    const parsed = new ConvertedKeyframes([
      { offset: 0, opacity: '0' },
      { offset: 1, opacity: '1' }
    ]);

    const effect = parsed.toKeyframeEffect({ duration: 500, easing: 'ease-in' });
    expect(effect).toBeInstanceOf(KeyframeEffectParameters);
    expect(effect.keyframes).toBe(parsed.keyframes);
    expect(effect.options).toEqual({ duration: 500, easing: 'ease-in' });
  });

  it('toKeyframeEffect with number option uses it as duration', () => {
    const parsed = new ConvertedKeyframes([{ offset: 0 }, { offset: 1 }]);
    const effect = parsed.toKeyframeEffect(300);
    expect(effect.options).toEqual({ duration: 300, easing: 'ease' });
  });

  it('toKeyframeEffect with null creates effect with the default easing option', () => {
    const parsed = new ConvertedKeyframes([{ offset: 0 }, { offset: 1 }]);
    const effect = parsed.toKeyframeEffect(null);
    expect(effect).toBeInstanceOf(KeyframeEffectParameters);
    expect(effect.options).toEqual({ easing: 'ease' });
  });

});
