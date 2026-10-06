
import type { Tab } from '../types'

// const isTouchDevice = window.matchMedia('(hover: none)').matches;
export function getDefaultExample({ isTouchDevice }: {
  isTouchDevice: boolean
}): Record<Tab, string> {

const jsAnimActivateEvent = isTouchDevice ? 'touchstart' : 'mouseenter';
const jsAnimDeactivateEvent = isTouchDevice ? 'touchend' : 'mouseleave';

const js = `import {
  getDocumentStyleSheetsOnLoad, convertStyleSheetKeyframes
} from 'keyframekit';

const documentStyleSheets = await getDocumentStyleSheetsOnLoad();

// get animation keyframes from the document's stylesheets
// and convert to Web Animations API keyframes
const rotateAnimKeyframes = convertStyleSheetKeyframes({
  of: 'rotate',
  in: documentStyleSheets
});

// then, define your animation
const rotateAnim = rotateAnimKeyframes.toKeyframeEffect({
  duration: 700
});

// finally, attach it to your elements:

let attachedAnims = [];
let animDelay = 0;

const spans = document.querySelectorAll('.text-anim span');

for (const span of spans) {

  const attachedAnim = rotateAnim.toAnimation({
    target: span,
    options: {
      delay: animDelay * 1000,
      endDelay: -animDelay * 1000
    }
  });

  attachedAnims.push(attachedAnim);

  animDelay += .02;

}

attachedAnims.forEach(anim => anim.play());


// the primary reason to play your animation with JS
// is because you get way more control over its playback:

const textAnimEl = document.querySelector('.text-anim');

textAnimEl.addEventListener('${jsAnimActivateEvent}', () => {
  attachedAnims.forEach(anim => {
    anim.playbackRate = 1;
    anim.play();
  });  
  updateProgressBar();
});

textAnimEl.addEventListener('${jsAnimDeactivateEvent}', () => {
  // reverse the animation
  attachedAnims.forEach(anim => anim.reverse());
  updateProgressBar();
});


const progressBar = document.querySelector('.progress-bar');

function updateProgressBar() {
  let progress = 0;
  for (const anim of attachedAnims) {
    progress += anim.overallProgress;
  }
  progress = progress / attachedAnims.length * 100;
  progressBar.style.setProperty(
    '--progress', progress + '%'
  );

  const isPlaying = attachedAnims.some(anim =>
    anim.playState === 'running'
  );
  if (!isPlaying) return;
  requestAnimationFrame(updateProgressBar);
}`;


const css = `@keyframes rotate {
  from {
    clip-path: inset(0 0 0 0);
    translate: 0 0;
  }
  49.99% {
    clip-path: inset(100% 0 0 0);
    translate: 0 -50px;
  }
  50% {
    clip-path: inset(0 0 100% 0);
    translate: 0 50px;
  }
  to {
    clip-path: inset(0 0 0 0);
    translate: 0 0;
  }
}


.text-anim {
  display: flex;
  font-size: 85px;
  font-weight: 600;
  color: #7ab6ff;
  cursor: pointer;
}

.progress-bar {
  width: ${isTouchDevice ? '180px' : '232px'};
  height: 3px;
  border-radius: 3px;
  background: #82868942;
  position: relative;
}

.progress-bar::before {
  content: '';
  height: 100%;
  width: var(--progress, 0%);
  border-radius: inherit;
  position: absolute;
  background: #7ab6ff;
}

body {
  font-family: 'Inter', system-ui;
  background: #f0f7ff;
  height: 100vh;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-flow: column;
  user-select: none;
  -webkit-user-select: none;
}`;


const htmlDesktop = `<div class="text-anim">
  <span>H</span>
  <span>o</span>
  <span>v</span>
  <span>e</span>
  <span>r</span>
</div>

<div class="progress-bar"></div>`;

const htmlMobile = `<div class="text-anim">
  <span>H</span>
  <span>o</span>
  <span>l</span>
  <span>d</span>
</div>

<div class="progress-bar"></div>`;

const html = isTouchDevice ? htmlMobile : htmlDesktop;


return { JS: js, CSS: css, HTML: html };

}
