import { describe, it, expect } from 'vitest';
import { KeyframeEffectParameters } from '../src/index';


describe('KeyframeEffectParameters', () => {

  it('stores keyframes and parses number options as duration', () => {
    const kf = [{ offset: 0, opacity: '0' }, { offset: 1, opacity: '1' }];
    const params = new KeyframeEffectParameters({ keyframes: kf, options: 1000 });

    expect(params.keyframes).toBe(kf);
    expect(params.options).toEqual({ duration: 1000 });
  });

  it('stores object options directly', () => {
    const kf = [{ offset: 0 }, { offset: 1 }];
    const params = new KeyframeEffectParameters({
      keyframes: kf,
      options: { duration: 500, iterations: 3 }
    });

    expect(params.options).toEqual({ duration: 500, iterations: 3 });
  });

  it('defaults options to empty object', () => {
    const kf = [{ offset: 0 }, { offset: 1 }];
    const params = new KeyframeEffectParameters({ keyframes: kf });
    expect(params.options).toEqual({});
  });

  it('does not modify the options object', () => {
    const options = { duration: 500 };
    new KeyframeEffectParameters({ keyframes: [], options });
    expect(options).toEqual({ duration: 500 });
  });

  it('leaves the effect easing to the Web Animations API default', () => {
    const params = new KeyframeEffectParameters({ keyframes: [], options: 500 });

    const anim = params.toAnimation({ target: document.createElement('div') });
    expect(anim.effect!.getTiming().easing).toBe('linear');
  });

  it('toAnimation creates an Animation object', () => {
    const kf = [{ offset: 0, opacity: '0' }, { offset: 1, opacity: '1' }];
    const params = new KeyframeEffectParameters({ keyframes: kf, options: 500 });

    const el = document.createElement('div');
    const anim = params.toAnimation({ target: el });

    expect(anim).toBeInstanceOf(Animation);
    expect(anim.effect).toBeInstanceOf(KeyframeEffect);
  });

  it('toAnimation merges additional options', () => {
    const kf = [{ offset: 0, opacity: '0' }, { offset: 1, opacity: '1' }];
    const params = new KeyframeEffectParameters({
      keyframes: kf,
      options: { duration: 500, easing: 'ease-in' }
    });

    const el = document.createElement('div');
    const anim = params.toAnimation({
      target: el,
      options: { duration: 1000 }
    });

    // Additional options override
    const effect = anim.effect as KeyframeEffect;
    const timing = effect.getTiming();
    expect(timing.duration).toBe(1000);
    expect(timing.easing).toBe('ease-in');
  });

  it('toAnimation with number as additional options', () => {
    const kf = [{ offset: 0, opacity: '0' }, { offset: 1, opacity: '1' }];
    const params = new KeyframeEffectParameters({ keyframes: kf, options: 500 });

    const el = document.createElement('div');
    const anim = params.toAnimation({ target: el, options: 1000 });

    const timing = (anim.effect as KeyframeEffect).getTiming();
    expect(timing.duration).toBe(1000);
  });

  it('toAnimation with null target', () => {
    const kf = [{ offset: 0, opacity: '0' }, { offset: 1, opacity: '1' }];
    const params = new KeyframeEffectParameters({ keyframes: kf, options: 500 });

    const anim = params.toAnimation({ target: null });
    expect(anim).toBeInstanceOf(Animation);
  });

});
