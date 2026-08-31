---
title: Get Started
---

# KeyframeKit

Unlock full playback control over your CSS animations with JavaScript.

[![NPM version][npm-version-src]][npm-version-href] 
[![NPM downloads][npm-downloads-src]][npm-downloads-href]
[![Minified size][minified-size-src]][minified-size-href] 
[![CI][ci-src]][ci-href]
{class=badges}

## What is this?

A lightweight TypeScript library that converts CSS `@keyframes` animations into [Web Animations API]-compatible animations, letting you play CSS-defined animations from JavaScript with full playback control and hardware-accelerated performance.  
[Read more][KeyframeKit article] | [Live Demo]

## Installation

::: code-group
```sh [npm]
npm install keyframekit
```
```js [CDN]
/* Import the module directly: */
import KeyframeKit from 'https://unpkg.com/keyframekit/dist/index.min.js'
```
:::

## Usage

### Playing CSS-defined animations with JS

In your CSS:
```css
@keyframes rotate-small { ... }
```

Then, in JS:
```js
import KeyframeKit from 'keyframekit';

const documentStyleSheets = await KeyframeKit.getDocumentStyleSheetsOnLoad();

// get animation keyframes from the document's stylesheets
// and convert to Web Animations API keyframes
const rotateSmallAnimKeyframes = KeyframeKit.getStyleSheetKeyframes({
  of: 'rotate-small',
  in: documentStyleSheets
});

// then, define your animation
const rotateSmallAnim = rotateSmallAnimKeyframes.toKeyframeEffect({
  duration: 700,
  easing: 'ease'
});

// finally, attach it to an element:
const attachedAnim = rotateSmallAnim.toAnimation({
  target: document.querySelector('.el')
});

attachedAnim.play();
```

The primary reason to play your animation with JS is because you get way more control over its playback:
```js
attachedAnim.pause();
attachedAnim.playbackRate = -1;
const progress = attachedAnim.overallProgress; // 0 to 1 (Baseline newly available)
await attachedAnim.finished;
```
[...and more.][Using the Web Animations API (MDN)]

### Importing animations directly from a CSS file

Instead of getting an animation from the document's stylesheets, you can also import it directly from a CSS file.

```js
import KeyframeKit from 'keyframekit';

const styleSheet = await KeyframeKit.importStyleSheet('./styles.css');
// note: on Chrome, Edge or Firefox (not Safari), you can just write:
// import styles from './styles.css' with { type: 'css' };

// get animation keyframes from stylesheet
// and convert to Web Animations API keyframes
const rotateSmallAnimKeyframes = KeyframeKit.getStyleSheetKeyframes({
  of: 'rotate-small',
  in: styleSheet
});
```

> Note: `@import` rules won't be resolved in imported stylesheets. [See more.][Imported stylesheet @import issue]

### Defining animations in JS

The [`KeyframeEffectParameters`] class provides a more convenient way to define your animations in JS than is offered natively.  
It's useful for when you want to have all your animation code in one place.

```js
import { KeyframeEffectParameters } from 'keyframekit';

// define your animation
const linkTextHoverAnim = new KeyframeEffectParameters({

  keyframes: {
    // 0 to 1. equivalent to CSS keyframe percentage values:
    offset: [0, 0.499, 0.5, 1],
    // respective CSS property keyframes:
    clipPath: ['inset(0 0 0 0)', 'inset(100% 0 0 0)', 'inset(0 0 100% 0)', 'inset(0 0 0 0)'],
    top: ['0', '-20px', '20px', '0']
  },

  options: {
    duration: 700,
    easing: 'ease'
  }
  
});

// then, attach it to an element:
const attachedAnim = linkTextHoverAnim.toAnimation({
  target: document.querySelector('.link')
});

attachedAnim.play();
```

## Reference

[See here.][KeyframeKit Reference]

## License

[MIT][KeyframeKit License]


<!-- References -->
[Web Animations API]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
[KeyframeKit article]: https://barhatsor.medium.com/99573ef4738b
[Live Demo]: https://codepen.io/barhatsor/pen/JoRPNmz
[Using the Web Animations API (MDN)]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API
[Imported stylesheet @import issue]: https://github.com/WICG/construct-stylesheets/issues/119#issuecomment-588352418
[`KeyframeEffectParameters`]: /reference/KeyframeEffectParameters
[KeyframeKit Reference]: /reference/
[KeyframeKit License]: https://github.com/barhatsor/KeyframeKit/blob/main/LICENSE

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/keyframekit.svg
[npm-version-href]: https://www.npmjs.com/package/keyframekit
[npm-downloads-src]: https://img.shields.io/npm/d18m/keyframekit
[npm-downloads-href]: https://www.npmjs.com/package/keyframekit
[minified-size-src]: https://img.shields.io/github/size/barhatsor/KeyframeKit/dist/index.min.js
[minified-size-href]: https://github.com/barhatsor/KeyframeKit/blob/main/dist/index.min.js
[ci-src]: https://github.com/barhatsor/KeyframeKit/actions/workflows/ci.yml/badge.svg
[ci-href]: https://github.com/barhatsor/KeyframeKit/actions/workflows/ci.yml
