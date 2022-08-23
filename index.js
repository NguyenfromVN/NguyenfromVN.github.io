// CONSTANTS
const CELLS_PER_ROW = 25;
const CELLS_PER_ROW_MOBILE = 13;
const PROPAGATION_DELAY = 30;
const CELL_TOUCH_ANIMATION_LENGTH = 500;
const DISTANCE_OF_DESTRUCTION = 3;
const TIME_BETWEEN_DOT_GENERATE = 8000;
const MIN_DOT_SIZE = 6; // relative size in percentage
const MAX_DOT_SIZE = 10; // relative size in percentage
const MIN_DOT_SIZE_MOBILE = 20;
const MAX_DOT_SIZE_MOBILE = 25;
const DOT_ANIMATION_LENGTH = 1000;
const MAX_DOTS = 3;
const MAX_DOT_EXISTING_TIME = MAX_DOTS * TIME_BETWEEN_DOT_GENERATE;
const TRACKS = [
  {
    path: './tracks/devil-eyes.mp3',
    name: 'Devil Eyes',
    artist: 'Hippie Sabotage',
  },
  {
    path: './tracks/giveon-heartbreak-anniversary.mp3',
    name: 'Heartbreak Anniversary',
    artist: 'Giveon',
  },
  {
    path: './tracks/glass-animals-the-other-side-of-paradise.mp3',
    name: 'The Other Side Of Paradise',
    artist: 'Glass Animals',
  },
  { path: './tracks/loverboy.mp3', name: 'Loverboy', artist: 'A-Wall' },
];
const LOADING_FADE_OUT_TIME = 1000;
const MIN_LOADING_TIME = 4000;
const MAIN_CONTENT_SIZE = 20; // relative size in percentage
const MAIN_CONTENT_SIZE_MOBILE = 15; // relative size in percentage
const FFT_SIZE = 64;
const VISUALIZATION_UPDATE_TIME = 20; // 50fps
const TRACK_INFO_HEIGHT = 0.7; // relative size compared to main content
const TRACK_INFO_TRAVEL_TIME = 40000;
const TIME_BETWEEN_TRACK_INFO_SPAN = 0;
const TIME_BETWEEN_FLICKERING_ANIMATION = 11000;

// GLOBAL VARS
let rows;
let cols;
const AppContainer = document.getElementById('app');
const cells = [];
const isCellExisted = [];
const tracksBuffer = [];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let currentTrackIndex = 0;
const visualizationBars = document.getElementsByClassName('bar');
const root = document.querySelector(':root');

// UTILS
function square(number) {
  return number * number;
}

function createFrString(num) {
  let res = '1fr';
  for (let i = 1; i < num; i++) {
    res += ' 1fr';
  }
  return res;
}

function getRandom(min, max) {
  return (Math.floor(Math.random() * 1000000000) % (max - min + 1)) + min;
}

function makeAnimation(element, className) {
  element.classList.remove(className);
  // 2 consecutive classList operations will be merged into one
  // trigger reflow, in order to make it work
  element.offsetHeight;
  element.classList.add(className);
}

function isMobileDevice() {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];
  return toMatch.some((toMatchItem) => navigator.userAgent.match(toMatchItem));
}

function getTime() {
  return new Date().getTime();
}

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

function addUniversalSensitiveClickListener(element, handler) {
  // for mobile
  element.addEventListener('touchstart', (event) => {
    if (!isMobileDevice()) {
      return;
    }
    handler(event);
  });
  // for PC
  element.addEventListener('mousedown', (event) => {
    if (isMobileDevice()) {
      return;
    }
    // only run with left click event
    if (event.buttons !== 1) {
      return;
    }
    handler(event);
  });
}

function roundToOddNumber(value) {
  const lower = Math.floor(value);
  const upper = lower + 1;
  return lower % 2 !== 0 ? lower : upper;
}

// LOGIC
function makeCellAnimation(row, col, distance, triggeredByCode) {
  if (row < 0 || row >= rows) {
    return;
  }
  if (col < 0 || col >= cols) {
    return;
  }
  if (!isCellExisted[row][col] && !triggeredByCode) {
    return;
  }
  const cell = cells[row][col];
  makeAnimation(cell, 'cell-touch');
  if (triggeredByCode) {
    return;
  }
  // destroy this cell after the animation is done if it is inside the area of destruction
  if (distance <= DISTANCE_OF_DESTRUCTION) {
    setTimeout(() => {
      if (!isCellExisted[row][col]) {
        return;
      }
      cells[row][col].style.zIndex = '0';
      isCellExisted[row][col] = false;
    }, CELL_TOUCH_ANIMATION_LENGTH);
  }
}

function createDot(dotSize, top, left) {
  const dot = document.createElement('div');
  dot.style.height = `${dotSize}px`;
  dot.style.width = `${dotSize}px`;
  dot.style.borderRadius = `${dotSize}px`;
  dot.style.top = `${top}px`;
  dot.style.left = `${left}px`;
  dot.style.opacity = '0';
  dot.classList.add('randy');
  return dot;
}

function startSignatureNeonEffect() {
  const signatureContainer = document.getElementById('signature-container');
  window.cid += 'tfolio';
  function makeEffect() {
    let delay = 0;
    function makeFlickeringEffect(delays) {
      // delays must have an odd length
      // first flickering
      signatureContainer.classList.remove('neon-effect');
      // the rest
      delays.forEach((time, index) => {
        delay += time;
        setTimeout(
          () => signatureContainer.classList[index % 2 === 0 ? 'add' : 'remove'](
            'neon-effect',
          ),
          delay,
        );
      });
    }
    makeFlickeringEffect([
      50, 50, 50, 50, 50, 50, 500, 300, 500, 50, 100, 50, 800,
    ]);
  }
  makeEffect();
  setInterval(makeEffect, TIME_BETWEEN_FLICKERING_ANIMATION);
}

function startDotGame() {
  setInterval(() => {
    // skip generating when the tab is out of focus
    if (!document.hasFocus()) {
      return;
    }
    // generate dot
    const appWidth = AppContainer.offsetWidth;
    const appHeight = AppContainer.offsetHeight;
    const minDotSize = isMobileDevice() ? MIN_DOT_SIZE_MOBILE : MIN_DOT_SIZE;
    const maxDotSize = isMobileDevice() ? MAX_DOT_SIZE_MOBILE : MAX_DOT_SIZE;
    const dotSize = (getRandom(minDotSize, maxDotSize) / 100) * appWidth;
    const top = getRandom(0, Math.floor((appHeight - dotSize) / 4));
    const left = getRandom(0, appWidth - dotSize);
    const dot = createDot(dotSize, top, left);
    addUniversalSensitiveClickListener(dot, () => {
      dot.remove();
    });
    AppContainer.append(dot);
    makeAnimation(dot, 'dot');
    dot.style.opacity = '1';
    dot.style.transform = `translateY(${appHeight - top}px)`;
    setTimeout(() => {
      dot.style.opacity = '0';
      setTimeout(() => dot.remove(), DOT_ANIMATION_LENGTH);
    }, MAX_DOT_EXISTING_TIME);
  }, TIME_BETWEEN_DOT_GENERATE);
}

function onCellTouch(row, col, triggeredByCode = false) {
  makeCellAnimation(row, col, 0, triggeredByCode);
  // wave effect, similar to how bfs works
  const maxDistance = rows + cols;
  for (let distance = 1; distance <= maxDistance; distance++) {
    const delay = PROPAGATION_DELAY * distance;
    setTimeout(() => {
      // create the ring
      for (let k = 0; k < distance; k++) {
        makeCellAnimation(
          row - distance + k,
          col + k,
          distance,
          triggeredByCode,
        );
        makeCellAnimation(
          row + k,
          col + distance - k,
          distance,
          triggeredByCode,
        );
        makeCellAnimation(
          row + distance - k,
          col - k,
          distance,
          triggeredByCode,
        );
        makeCellAnimation(
          row - k,
          col - distance + k,
          distance,
          triggeredByCode,
        );
      }
    }, delay);
  }
}

const loadSingleTrack = ({ path, name, artist }) => new Promise((resolve) => {
  const ajaxRequest = new XMLHttpRequest();
  ajaxRequest.open('GET', path, true);
  ajaxRequest.responseType = 'arraybuffer';
  ajaxRequest.onload = () => {
    const audioData = ajaxRequest.response;
    audioCtx.decodeAudioData(
      audioData,
      (audioBuffer) => {
        tracksBuffer.push({
          path,
          name,
          artist,
          buffer: audioBuffer,
        });
        resolve();
      },
      () => resolve(),
    );
  };
  ajaxRequest.send();
});

const loadTracks = () => new Promise((resolve) => {
  Promise.any(TRACKS.map((track) => loadSingleTrack(track))).then(resolve);
});

function clearOldSpans(trackInfoContainer) {
  while (trackInfoContainer.lastChild) {
    trackInfoContainer.removeChild(trackInfoContainer.lastChild);
  }
}

function addSpanToTrackInfo(content, fontSize, trackInfoContainer) {
  const span = document.createElement('span');
  span.className = 'span-for-track-info nguyen';
  const textSpan = document.createElement('span');
  textSpan.textContent = content;
  span.append(textSpan);
  textSpan.style.fontSize = `${fontSize}px`;
  trackInfoContainer.append(span);
  // deco pattern
  const decoPattern = document.createElement('img');
  const padding = span.offsetHeight / 8;
  decoPattern.src = './images/deco.png#nguyen';
  decoPattern.style.height = `${span.offsetHeight}px`;
  decoPattern.style.marginLeft = `${padding}px`;
  decoPattern.style.marginRight = `${padding}px`;
  decoPattern.style.transform = 'scale(0.9)';
  span.append(decoPattern);
  return span;
}

function createTrackInfo({ name, artist }) {
  const trackInfoContainer = document.getElementById('track-info');
  const trackInfoWidth = trackInfoContainer.offsetWidth;
  const trackInfoHeight = trackInfoContainer.offsetHeight;
  const fontSize = 0.8 * trackInfoHeight;
  const content = `${name} - ${artist}`;
  const dummySpan = addSpanToTrackInfo(content, fontSize, trackInfoContainer);
  const spanWidth = dummySpan.offsetWidth;
  const spanHeight = dummySpan.offsetHeight;
  const spanTransitionTime = (TRACK_INFO_TRAVEL_TIME
      * (trackInfoWidth + spanWidth - 2 * trackInfoHeight))
    / trackInfoWidth;
  const timeBetWeenSpan = (TRACK_INFO_TRAVEL_TIME * spanWidth) / trackInfoWidth
    + TIME_BETWEEN_TRACK_INFO_SPAN;
  function addNewSpan() {
    const span = addSpanToTrackInfo(content, fontSize, trackInfoContainer);
    span.style.top = `${(trackInfoHeight - spanHeight) / 2}px`;
    span.style.left = `${trackInfoWidth - 2 * trackInfoHeight}px`;
    span.style.transition = `transform ${spanTransitionTime}ms linear, opacity 1s`;
    makeAnimation(span, 'to-make-a-transition-for-left-property-randy');
    span.style.transform = `translateX(${-(
      trackInfoWidth
      - 2 * trackInfoHeight
      + spanWidth
    )}px)`;
  }
  let intervalID;
  function startTrackInfo() {
    // skip when the tab is out of focus
    if (!document.hasFocus()) {
      return;
    }
    // the first span
    addNewSpan();
    // the rest
    intervalID = setInterval(() => {
      addNewSpan();
    }, timeBetWeenSpan);
  }
  startTrackInfo();
  dummySpan.remove();
  function stopTrackInfo(endOfTrack = false) {
    clearInterval(intervalID);
    // remove old spans
    setTimeout(() => clearOldSpans(trackInfoContainer), endOfTrack ? 1000 : 0);
    if (!endOfTrack) {
      return;
    }
    // remove listeners
    window.onfocus = undefined;
    window.onblur = undefined;
    // faded animation for old spans
    const trackInfoSpans = document.getElementsByClassName(
      'span-for-track-info',
    );
    for (let i = 0; i < trackInfoSpans.length; i++) {
      const span = trackInfoSpans[i];
      makeAnimation(span, 'to-make-a-transition-for-opacity-property-nguyen');
      span.style.opacity = '0';
    }
  }
  // restart track info when the tab is focused
  window.onfocus = () => {
    startTrackInfo();
  };
  // stop track info when the tab is out of focus
  window.onblur = () => {
    stopTrackInfo();
  };
  return stopTrackInfo;
}

function startMusicVisualization(analyser) {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const bassCircle = document.getElementById('bass-effect');
  const trebleCircle = document.getElementById('treble-effect');
  const diskSize = document.getElementById('disk').offsetWidth;
  const updateVisualization = () => {
    analyser.getByteFrequencyData(dataArray);
    for (let i = 0; i < visualizationBars.length; i++) {
      const bar = visualizationBars[i];
      bar.style.width = `${(dataArray[i] / 255) * 3 * diskSize}px`;
    }
    const dBBass = dataArray[0];
    const dBTreble = dataArray[6];
    bassCircle.style.transform = `scaleX(${Math.min(1, dBBass / 230) * 1.25})`;
    trebleCircle.style.transform = `scaleY(${
      Math.min(1, dBTreble / 140) * 1.25
    })`;
  };
  const musicVisualizationIntervalID = setInterval(
    updateVisualization,
    VISUALIZATION_UPDATE_TIME,
  );
  return () => {
    // reset circles and bars
    bassCircle.style.transform = 'scale(1)';
    trebleCircle.style.transform = 'scale(1)';
    for (let i = 0; i < visualizationBars.length; i++) {
      const bar = visualizationBars[i];
      bar.style.width = '0px';
    }
    // stop visualization
    clearInterval(musicVisualizationIntervalID);
  };
}

function startMusic() {
  if (!tracksBuffer.length) {
    return;
  }
  const stopTrackInfoHandler = createTrackInfo(tracksBuffer[currentTrackIndex]);
  const analyser = audioCtx.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;
  const source = audioCtx.createBufferSource();
  const audioBuffer = tracksBuffer[currentTrackIndex].buffer;
  source.buffer = audioBuffer;
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  source.start();
  // animation at the beginning of the song
  onCellTouch(Math.floor(rows / 2), Math.floor(cols / 2), true);
  analyser.fftSize = FFT_SIZE;
  const stopVisualizationHandler = startMusicVisualization(analyser);
  source.onended = async () => {
    stopVisualizationHandler();
    stopTrackInfoHandler(true);
    // move to next track
    currentTrackIndex = (currentTrackIndex + 1) % tracksBuffer.length;
    await sleep(1000);
    startMusic();
  };
}

function createGridSystem(appWidth, appHeight) {
  cols = isMobileDevice() ? CELLS_PER_ROW_MOBILE : CELLS_PER_ROW;
  const cellSize = appWidth / cols;
  rows = roundToOddNumber(appHeight / cellSize);
  window.cid = 'rand';
  AppContainer.style.gridTemplateColumns = createFrString(cols);
  AppContainer.style.gridTemplateRows = createFrString(rows);
  for (let i = 0; i < rows; i++) {
    const cellsInRow = [];
    const boolArray = [];
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      addUniversalSensitiveClickListener(cell, () => onCellTouch(i, j));
      AppContainer.append(cell);
      cellsInRow.push(cell);
      boolArray.push(true);
    }
    cells.push(cellsInRow);
    isCellExisted.push(boolArray);
  }
}

function showMainPanel(mainContainerSizeAfterScaling) {
  // styling for the main panel according to the screen size
  const mainContainer = document.getElementById('main');
  const mainContainerSize = mainContainer.offsetWidth;
  mainContainer.style.transform = `scale(${
    mainContainerSizeAfterScaling / mainContainerSize
  })`;
  // show the main panel
  mainContainer.style.opacity = '1';
  window.cid += 'y-nguye';
  // show signature and apply animations for the main panel
  const signature = document.getElementById('signature');
  signature.style.strokeDashoffset = '0';
  const signatureContainer = document.getElementById('signature-container');
  signatureContainer.style.transform = `scale(${isMobileDevice() ? 3 : 6})`;
  setTimeout(() => {
    signatureContainer.style.transition = 'transform 3s ease-in-out';
    signatureContainer.style.transform = 'scale(1)';
  }, 5000);
  const diskContainer = document.getElementById('disk');
  diskContainer.classList.add('disk-animation');
  // remove mask after signature's animation is done
  const mask = document.getElementById('mask');
  mask.classList.add('faded-effect');
  // remove after 1 second of starting time, to avoid heavy load
  setTimeout(() => mask.remove(), 9000);
}

function showMiniLogo() {
  const scalingBigRatio = 1.5;
  const scalingSmallRatio = 0.5;
  const nameAnimationLength = 2;
  const hobbiesAnimationLength = 2.08;
  // animation for name
  const characterWidth = document.querySelector('#mini-logo .R').offsetWidth;
  root.style.setProperty(
    '--scalingBigWidth',
    `${characterWidth * scalingBigRatio}px`,
  );
  root.style.setProperty(
    '--scalingSmallWidth',
    `${characterWidth * scalingSmallRatio}px`,
  );
  root.style.setProperty('--scalingBigRatio', `${scalingBigRatio}`);
  root.style.setProperty('--scalingSmallRatio', `${scalingSmallRatio}`);
  const rContainer = document.querySelector('#mini-logo .R');
  rContainer.style.animation = `rContainerScaling ${nameAnimationLength}s ease-in-out infinite alternate`;
  const dContainer = document.querySelector('#mini-logo .d');
  dContainer.style.animation = `dContainerScaling ${nameAnimationLength}s ease-in-out infinite alternate`;
  const rCharacter = document.querySelector('#mini-logo .R div');
  rCharacter.style.animation = `rScaling ${nameAnimationLength}s ease-in-out infinite alternate`;
  const dCharacter = document.querySelector('#mini-logo .d div');
  dCharacter.style.animation = `dScaling ${nameAnimationLength}s ease-in-out infinite alternate`;
  // animation for hobbies
  const hobbiesDiv = document.querySelectorAll('#mini-logo .hobbies div');
  for (let i = 0; i < hobbiesDiv.length; i++) {
    hobbiesDiv[i].style.animation = `hobbiesAnimation ${
      hobbiesAnimationLength * hobbiesDiv.length
    }s ${hobbiesAnimationLength * i}s linear infinite`;
  }
  // show after 1s to skip weird looking first state of elements
  const miniLogoContainer = document.getElementById('mini-logo');
  setTimeout(() => {
    miniLogoContainer.style.transition = 'opacity 1s';
    miniLogoContainer.style.opacity = '1';
  }, 1000);
}

function prepareTrackInfoLayout(
  appWidth,
  appHeight,
  mainContainerSizeAfterScaling,
) {
  // track info layout
  const trackInfoContainer = document.getElementById('track-info');
  const trackInfoHeight = mainContainerSizeAfterScaling * TRACK_INFO_HEIGHT;
  trackInfoContainer.style.height = `${trackInfoHeight}px`;
  const trackInfoWidth = Math.sqrt(square(appHeight) + square(appWidth)) + 4 * trackInfoHeight;
  trackInfoContainer.style.width = `${trackInfoWidth}px`;
  trackInfoContainer.style.left = `calc((100vw - ${trackInfoWidth}px) / 2)`;
  window.cid += 'n_por';
  // rotate track info according to the screen size
  const alpha = Math.atan((appHeight - trackInfoHeight) / appWidth);
  trackInfoContainer.style.transform = `rotate(${-alpha}rad)`;
}

// INIT FUNCTION
async function init() {
  const appWidth = AppContainer.offsetWidth;
  const appHeight = AppContainer.offsetHeight;
  const startTime = getTime();
  createGridSystem(appWidth, appHeight);
  await loadTracks();
  // wait more if loading time is way too fast
  const currentTime = getTime();
  if (currentTime - startTime < MIN_LOADING_TIME) {
    await sleep(MIN_LOADING_TIME - (currentTime - startTime));
  }
  // show alert
  const alertText = document.getElementById('start-alert');
  alertText.style.opacity = '1';
  const loadingScreen = document.getElementById('loading');
  addUniversalSensitiveClickListener(loadingScreen, async () => {
    const mainContainerSizeAfterScaling = (appHeight
        * (isMobileDevice() ? MAIN_CONTENT_SIZE_MOBILE : MAIN_CONTENT_SIZE))
      / 100;
    loadingScreen.style.opacity = '0';
    await sleep(LOADING_FADE_OUT_TIME);
    // remove loading screen after the user clicks
    loadingScreen.remove();
    showMainPanel(mainContainerSizeAfterScaling);
    startDotGame();
    prepareTrackInfoLayout(appWidth, appHeight, mainContainerSizeAfterScaling);
    await sleep(8000);
    startMusic();
    startSignatureNeonEffect();
    showMiniLogo();
  });
}

// APP INIT
init();
