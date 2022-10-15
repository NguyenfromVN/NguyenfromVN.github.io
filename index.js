// CONSTANTS
const CELLS_PER_ROW = 25;
const CELLS_PER_ROW_MOBILE = 13;
const PROPAGATION_DELAY = 31;
const CELL_TOUCH_ANIMATION_LENGTH = 500;
const CELL_TOUCH_ANIMATION_FPS = 20;
const DISTANCE_OF_DESTRUCTION = 3;
const TIME_BETWEEN_DOT_GENERATE = 8000;
const MIN_DOT_SIZE = 6; // relative size in percentage
const MAX_DOT_SIZE = 8; // relative size in percentage
const MIN_DOT_SIZE_MOBILE = 20;
const MAX_DOT_SIZE_MOBILE = 25;
const DOT_ANIMATION_LENGTH = 1000;
const MAX_DOTS = 3;
const MAX_DOT_EXISTING_TIME = MAX_DOTS * TIME_BETWEEN_DOT_GENERATE;
const TRACKS = [
  {
    path: './tracks/1.hex',
    name: 'Devil Eyes',
    artist: 'Hippie Sabotage',
  },
  {
    path: './tracks/2.hex',
    name: 'Heartbreak Anniversary',
    artist: 'Giveon',
  },
  {
    path: './tracks/3.hex',
    name: 'The Other Side Of Paradise',
    artist: 'Glass Animals',
  },
  { path: './tracks/4.hex', name: 'Loverboy', artist: 'A-Wall' },
  {
    path: './tracks/5.hex',
    name: '50 Feet',
    artist: 'SoMo',
  },
  {
    path: './tracks/6.hex',
    name: 'Can We Kiss Forever',
    artist: 'Kina',
  },
  {
    path: './tracks/7.hex',
    name: 'Fashion Week',
    artist: 'Blackbear',
  },
  {
    path: './tracks/8.hex',
    name: 'Gang Shit No Lame Shit',
    artist: 'Key Glock',
  },
  {
    path: './tracks/9.hex',
    name: 'Goodbyes',
    artist: 'Post Malone',
  },
  {
    path: './tracks/10.hex',
    name: 'Gravity',
    artist: 'Umpire',
  },
  {
    path: './tracks/11.hex',
    name: "I'm Not The Only One",
    artist: 'Sam Smith',
  },
  {
    path: './tracks/12.hex',
    name: 'in luv with u',
    artist: 'pxzvc',
  },
  {
    path: './tracks/13.hex',
    name: 'Industry Baby',
    artist: 'Lil Nas X',
  },
  {
    path: './tracks/14.hex',
    name: 'Infinite',
    artist: 'Valence',
  },
  {
    path: './tracks/15.hex',
    name: 'Life Is Over',
    artist: 'Anikdote',
  },
  {
    path: './tracks/16.hex',
    name: 'Mine',
    artist: 'Bazzi',
  },
  {
    path: './tracks/17.hex',
    name: 'No Stylist',
    artist: 'French Montana & Drake',
  },
  {
    path: './tracks/18.hex',
    name: 'Ocean Eyes',
    artist: 'Billie Eilish',
  },
  {
    path: './tracks/19.hex',
    name: 'One More Night',
    artist: 'Maroon 5',
  },
  {
    path: './tracks/20.hex',
    name: 'Perfect Time',
    artist: 'Toby Tranter',
  },
  {
    path: './tracks/21.hex',
    name: 'Roses',
    artist: 'The Chainsmokers',
  },
  {
    path: './tracks/22.hex',
    name: 'Run Away With Me',
    artist: 'Carly Rae Jepsen',
  },
  {
    path: './tracks/23.hex',
    name: 'Save Your Tears',
    artist: 'The Weeknd',
  },
  {
    path: './tracks/24.hex',
    name: 'Stay',
    artist: 'The Kid LAROI, Justin Bieber',
  },
  {
    path: './tracks/25.hex',
    name: 'Still D.R.E.',
    artist: 'Dr. Dre',
  },
  {
    path: './tracks/26.hex',
    name: 'Wasted',
    artist: 'Jerry Purpdrank',
  },
  {
    path: './tracks/27.hex',
    name: 'White Gold',
    artist: 'Tommy Ljungberg',
  },
  {
    path: './tracks/28.hex',
    name: 'Why We Lose',
    artist: 'Cartoon',
  },
  {
    path: './tracks/29.hex',
    name: "I Ain't Worried",
    artist: 'OneRepublic',
  },
];
const LOADING_FADE_OUT_TIME = 1000;
const MIN_LOADING_TIME = 4000;
const MAIN_CONTENT_SIZE = 20; // relative size in percentage
const MAIN_CONTENT_SIZE_MOBILE = 15; // relative size in percentage
const FFT_SIZE = 64;
const VISUALIZATION_UPDATE_TIME = 27; // ~37fps
const TRACK_INFO_HEIGHT = 0.8; // relative size compared to main content
const TRACK_INFO_TRAVEL_TIME = 40000;
const BTCUSDT_STREAM_NAME = 'btcusdt@aggTrade';
const BTCUSDT_STATISTIC_STREAM_NAME = 'btcusdt@ticker';
const ETHUSDT_STREAM_NAME = 'ethusdt@aggTrade';
const ETHUSDT_STATISTIC_STREAM_NAME = 'ethusdt@ticker';
const WS_CRYPTO_SUBSCRIBE_MESSAGE = {
  method: 'SUBSCRIBE',
  params: [
    BTCUSDT_STREAM_NAME,
    BTCUSDT_STATISTIC_STREAM_NAME,
    ETHUSDT_STREAM_NAME,
    ETHUSDT_STATISTIC_STREAM_NAME,
  ],
  id: 1,
};
const PONG_MESSAGE_TIME_INTERVAL = 5 * 60 * 1000;
const TOP_CELLS_EFFECT_COLORS = [
  [0, 255, 255], [255, 0, 255], [255, 255, 0],
  [255, 255, 255], [255, 127, 0], [255, 0, 127],
  [127, 255, 0], [0, 255, 127], [127, 0, 255], [0, 127, 255]];

// GLOBAL VARS
let rows;
let cols;
const AppContainer = document.getElementById('app');
const btcPriceTrackingContainer = document.querySelector('#widgets .btc-tracking');
const ethPriceTrackingContainer = document.querySelector('#widgets .eth-tracking');
const cells = [];
const intervalIds = [];
const isCellExisted = [];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let currentTrackIndex = 0;
const visualizationBars = document.getElementsByClassName('bar');
let widgetsExpanded = false;
let trackBuffer = null;
let wsInstance = null;
let wsEventID = 3;
let lastPongMessageTime = 0;
let lastBTCPrice = null;
let lastETHPrice = null;
let lastMessageTime = 0;
const weatherAppIds = [];
const weatherInfo = {};
// Marina Bay coordinates
let lat = 1.2878;
let long = 103.8666;

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

function addUniversalSensitiveClickListener(element, handler, options = {}) {
  // for mobile
  element.addEventListener('touchstart', (event) => {
    if (!isMobileDevice()) {
      return;
    }
    handler(event);
  }, options);
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
  }, options);
}

function roundToOddNumber(value) {
  const lower = Math.floor(value);
  const upper = lower + 1;
  return lower % 2 !== 0 ? lower : upper;
}

function formatCryptoNumber(number, {
  hasDollarSign = true,
  alwaysShowSign = false,
  fractionDigits = 2,
} = {}) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: hasDollarSign ? 'currency' : undefined,
    currency: hasDollarSign ? 'USD' : undefined,
    signDisplay: alwaysShowSign ? 'always' : undefined,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return formatter.format(number);
}

function shuffleArray(arr = []) {
  const sz = arr.length;
  for (let i = 0; i < sz; i++) {
    const newIndex = getRandom(0, sz - 1);
    const temp = arr[i];
    arr[i] = arr[newIndex];
    arr[newIndex] = temp;
  }
}

// LOGIC
function makeCellAnimation(
  row,
  col,
  {
    distance, triggeredByCode = false, colorOpacity, color = [255, 255, 255],
  },
) {
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
  clearInterval(intervalIds[row][col]);
  const delta = colorOpacity / CELL_TOUCH_ANIMATION_FPS / CELL_TOUCH_ANIMATION_LENGTH * 1000;
  let count = 0;
  const delay = 1000 / CELL_TOUCH_ANIMATION_FPS;
  // first frame
  cell.style.backgroundColor = `rgba(${color[0]},${color[1]},${color[2]},${colorOpacity})`;
  // the rest of the frames
  intervalIds[row][col] = setInterval(() => {
    count++;
    const opacity = colorOpacity - delta * count;
    cell.style.backgroundColor = `rgba(${color[0]},${color[1]},${color[2]},${opacity})`;
    if (count === CELL_TOUCH_ANIMATION_FPS * CELL_TOUCH_ANIMATION_LENGTH / 1000) {
      clearInterval(intervalIds[row][col]);
    }
  }, delay);
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
      47, 47, 47, 47, 47, 47, 47, 47, 47, 47, 47, 47, 1013, 97, 1013, 97, 1511,
    ]);
  }
  makeEffect();
}

function topCellsEffect() {
  const colorsLength = TOP_CELLS_EFFECT_COLORS.length;
  const propagationDelay = PROPAGATION_DELAY * 0.5;
  const commonOptions = {
    triggeredByCode: true,
    colorOpacity: 0.7,
  };
  makeCellAnimation(0, Math.floor(cols / 2), {
    color: TOP_CELLS_EFFECT_COLORS[getRandom(0, colorsLength - 1)],
    ...commonOptions,
  });
  for (let distance = 1; distance <= Math.floor(cols / 2); distance++) {
    const delay = distance * propagationDelay;
    setTimeout(() => {
      makeCellAnimation(0, Math.floor(cols / 2) - distance, {
        color: TOP_CELLS_EFFECT_COLORS[getRandom(0, colorsLength - 1)],
        ...commonOptions,
      });
      makeCellAnimation(0, Math.floor(cols / 2) + distance, {
        color: TOP_CELLS_EFFECT_COLORS[getRandom(0, colorsLength - 1)],
        ...commonOptions,
      });
    }, delay);
  }
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
    const top = getRandom(appHeight / rows, appHeight / 8);
    const left = getRandom(0, appWidth - dotSize);
    const dot = createDot(dotSize, top, left);
    addUniversalSensitiveClickListener(dot, () => {
      dot.remove();
      topCellsEffect();
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

function onCellTouch(row, col, triggeredByCode = false, transparentMode = false) {
  const options = {
    triggeredByCode,
    colorOpacity: transparentMode ? 0.02 : 0.4,
  };
  makeCellAnimation(row, col, { distance: 0, ...options });
  // wave effect, similar to how bfs works
  const maxDistance = rows + cols;
  for (let distance = 1; distance <= maxDistance; distance++) {
    const delay = PROPAGATION_DELAY * distance;
    const commonOptions = { distance, ...options };
    setTimeout(() => {
      // create the ring
      for (let k = 0; k < distance; k++) {
        makeCellAnimation(row - distance + k, col + k, commonOptions);
        makeCellAnimation(row + k, col + distance - k, commonOptions);
        makeCellAnimation(row + distance - k, col - k, commonOptions);
        makeCellAnimation(row - k, col - distance + k, commonOptions);
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
        trackBuffer = {
          path,
          name,
          artist,
          buffer: audioBuffer,
        };
        resolve();
      },
      () => resolve(),
    );
  };
  ajaxRequest.send();
});

const loadTracks = () => new Promise((resolve) => {
  shuffleArray(TRACKS);
  // load first track
  loadSingleTrack(TRACKS[0]).then(resolve);
  // load next tracks
  setInterval(() => {
    if (trackBuffer !== null) {
      return;
    }
    currentTrackIndex = (currentTrackIndex + 1) % TRACKS.length;
    loadSingleTrack(TRACKS[currentTrackIndex]);
  }, 30000);
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
  decoPattern.src = './images/deco.png?k=b70b6a44328a84b96708b88e2d135b9d';
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
  const fontSize = 0.75 * trackInfoHeight;
  const content = `${name} - ${artist}`;
  const dummySpan = addSpanToTrackInfo(content, fontSize, trackInfoContainer);
  const spanWidth = dummySpan.offsetWidth;
  const spanHeight = dummySpan.offsetHeight;
  const spanTransitionTime = (TRACK_INFO_TRAVEL_TIME
    * (trackInfoWidth + spanWidth - 2 * trackInfoHeight))
    / trackInfoWidth;
  const timeBetWeenSpan = (TRACK_INFO_TRAVEL_TIME * spanWidth) / trackInfoWidth;
  function addNewSpan() {
    const span = addSpanToTrackInfo(content, fontSize, trackInfoContainer);
    // optimization
    span.style.willChange = 'transform';
    setTimeout(() => {
      if (span?.style?.willChange) {
        span.style.willChange = 'auto';
      }
    }, spanTransitionTime);
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
      const barWidth = bar.offsetWidth;
      const newWidth = (dataArray[i] / 255) * 3 * diskSize;
      bar.style.transform = `scaleX(${newWidth / barWidth})`;
    }
    const dBBass = dataArray[0];
    const dBTreble = dataArray[6];
    bassCircle.style.transform = `scaleX(${Math.min(1, dBBass / 230) * 1.25})`;
    trebleCircle.style.transform = `scaleY(${Math.min(1, dBTreble / 140) * 1.25
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
      bar.style.transform = 'scaleX(0)';
    }
    // stop visualization
    clearInterval(musicVisualizationIntervalID);
  };
}

async function startMusic() {
  if (trackBuffer === null) {
    return;
  }
  const currentTrack = trackBuffer;
  trackBuffer = null;
  const analyser = audioCtx.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;
  const source = audioCtx.createBufferSource();
  const audioBuffer = currentTrack.buffer;
  source.buffer = audioBuffer;
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  source.start();
  // animation at the beginning of the song
  // delay to avoid heavy load
  setTimeout(
    () => onCellTouch(Math.floor(rows / 2), Math.floor(cols / 2), true),
    37,
  );
  analyser.fftSize = FFT_SIZE;
  const stopVisualizationHandler = startMusicVisualization(analyser);
  // delay to avoid heavy load
  await sleep(601);
  const stopTrackInfoHandler = createTrackInfo(currentTrack);
  source.onended = async () => {
    stopVisualizationHandler();
    stopTrackInfoHandler(true);
    await sleep(1000);
    // play next track
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
    const nullArray = [];
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      addUniversalSensitiveClickListener(cell, () => onCellTouch(i, j));
      AppContainer.append(cell);
      cellsInRow.push(cell);
      boolArray.push(true);
      nullArray.push(null);
    }
    cells.push(cellsInRow);
    isCellExisted.push(boolArray);
    intervalIds.push(nullArray);
  }
}

function showMainPanel(mainContainerSizeAfterScaling) {
  // styling for the main panel according to the screen size
  const mainContainer = document.getElementById('main');
  const mainContainerSize = mainContainer.offsetWidth;
  mainContainer.style.transform = `scale(${mainContainerSizeAfterScaling / mainContainerSize
  })`;
  // show the main panel
  mainContainer.style.opacity = '1';
  window.cid += 'y-nguye';
  // show signature and apply animations for the main panel
  const signature = document.getElementById('signature');
  signature.style.strokeDashoffset = '0';
  const signatureContainer = document.getElementById('signature-container');
  signatureContainer.style.transform = `scale(${isMobileDevice() ? 3.5 : 5.5})`;
  setTimeout(() => {
    signatureContainer.style.transition = 'transform 3s ease-in-out';
    signatureContainer.style.transform = 'scale(1)';
  }, 5000);
  const diskContainer = document.getElementById('disk');
  diskContainer.classList.add('disk-animation');
  // make mask fade after signature's animation is done
  const mask = document.getElementById('mask');
  mask.classList.add('faded-effect');
  // remove mask after 2s from starting time, to avoid heavy load
  setTimeout(() => mask.remove(), 10000);
  // styling for bars
  for (let i = 0; i < visualizationBars.length; i++) {
    const bar = visualizationBars[i];
    bar.style.width = `${mainContainerSize * (2 - i / (visualizationBars.length - 1))
    }px`;
    bar.style.transform = 'scaleX(0)';
  }
}

function showMiniLogo() {
  const translateAnimationLength = 0.08;
  const hobbiesAnimationLength = 2 + translateAnimationLength;
  // animation for hobbies
  const hobbiesDiv = document.querySelectorAll('#mini-logo .hobbies div');
  for (let i = 0; i < hobbiesDiv.length; i++) {
    hobbiesDiv[i].style.animation = `hobbiesAnimation ${(hobbiesAnimationLength - translateAnimationLength) * hobbiesDiv.length
    }s ${(hobbiesAnimationLength - translateAnimationLength) * i
    }s linear infinite`;
  }
  // show mini logo
  const miniLogoContainer = document.getElementById('mini-logo');
  miniLogoContainer.style.transition = 'opacity 1s linear';
  miniLogoContainer.style.opacity = '1';
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

function showWidgets() {
  const widgetsContainer = document.getElementById('widgets');
  const widgetsIcon = document.querySelectorAll('#widgets img');
  const widgetContents = document.querySelectorAll(
    '#widgets .wrapper .content',
  );
  function makeWidgetsAnimation(willExpand) {
    widgetsExpanded = willExpand;
    // animation for widget icons
    for (let i = 0; i < widgetsIcon.length; i++) {
      const widgetIcon = widgetsIcon[i];
      const addedClassName = willExpand
        ? 'widget-icon-expand'
        : 'widget-icon-collapse';
      const removedClassName = willExpand
        ? 'widget-icon-collapse'
        : 'widget-icon-expand';
      widgetIcon.classList.remove(removedClassName);
      makeAnimation(widgetIcon, addedClassName);
    }
    // animation for widget containers
    for (let i = 0; i < widgetContents.length; i++) {
      const widgetContent = widgetContents[i];
      const addedClassName = willExpand
        ? 'widget-content-expand'
        : 'widget-content-collapse';
      const removedClassName = willExpand
        ? 'widget-content-collapse'
        : 'widget-content-expand';
      widgetContent.classList.remove(removedClassName);
      makeAnimation(widgetContent, addedClassName);
    }
    // animation for widgets container
    const addedClassName = willExpand ? 'widgets-expand' : 'widgets-collapse';
    const removedClassName = willExpand ? 'widgets-collapse' : 'widgets-expand';
    widgetsContainer.classList.remove(removedClassName);
    makeAnimation(widgetsContainer, addedClassName);
  }
  addUniversalSensitiveClickListener(widgetsContainer, () => {
    makeWidgetsAnimation(!widgetsExpanded);
  });
  // show widgets
  widgetsContainer.style.transition = 'opacity 1s linear';
  widgetsContainer.style.opacity = '1';
}

function killWSConnection() {
  wsInstance?.close();
  wsInstance = null;
}

function updatePriceTracking(element, {
  previousPrice,
  currentPrice,
  priceChange,
  priceChangePercent,
}, for24hStatistic = false) {
  if (!for24hStatistic) {
    const priceStr = formatCryptoNumber(currentPrice);
    const diff = currentPrice - previousPrice;
    const diffStr = formatCryptoNumber(diff, { alwaysShowSign: true, fractionDigits: 4 });
    const row1 = element.querySelector('.column-1 .row-1');
    const row2 = element.querySelector('.column-1 .row-2');
    const color = diff >= 0 ? '#0ecb83' : '#f6465d';
    row1.textContent = priceStr;
    row2.textContent = diffStr;
    row2.style.color = color;
  } else {
    const row2 = element.querySelector('.column-2 .row-2');
    const priceChangeStr = formatCryptoNumber(
      priceChange,
      { hasDollarSign: false },
    );
    const priceChangePercentStr = formatCryptoNumber(
      priceChangePercent,
      { hasDollarSign: false, alwaysShowSign: true },
    );
    const str = `${priceChangeStr} ${priceChangePercentStr}%`;
    const color = priceChange >= 0 ? '#0ecb83' : '#f6465d';
    row2.textContent = str;
    row2.style.color = color;
  }
}

function sendPongMessage() {
  const currentTime = getTime();
  const diff = currentTime - lastPongMessageTime;
  if (diff >= PONG_MESSAGE_TIME_INTERVAL) {
    wsInstance.send(JSON.stringify({ ...WS_CRYPTO_SUBSCRIBE_MESSAGE, id: wsEventID }));
    wsEventID += 2;
    lastPongMessageTime = currentTime;
  }
}

function createWSConnection() {
  killWSConnection();
  // create a new WS instance
  wsInstance = new WebSocket('wss://stream.binance.com/stream');
  wsInstance.addEventListener('open', () => {
    // subscribe to streams
    wsInstance.send(JSON.stringify(WS_CRYPTO_SUBSCRIBE_MESSAGE));
  });
  const messageHandlers = {
    [BTCUSDT_STREAM_NAME]: ({ price }) => {
      lastBTCPrice = lastBTCPrice ?? price;
      updatePriceTracking(btcPriceTrackingContainer, {
        previousPrice: lastBTCPrice, currentPrice: price,
      });
      lastBTCPrice = price;
    },
    [BTCUSDT_STATISTIC_STREAM_NAME]: ({
      price: priceChange,
      priceChangePercent,
    }) => {
      updatePriceTracking(btcPriceTrackingContainer, {
        priceChange, priceChangePercent,
      }, true);
    },
    [ETHUSDT_STREAM_NAME]: ({ price }) => {
      lastETHPrice = lastETHPrice ?? price;
      updatePriceTracking(ethPriceTrackingContainer, {
        previousPrice: lastETHPrice, currentPrice: price,
      });
      lastETHPrice = price;
    },
    [ETHUSDT_STATISTIC_STREAM_NAME]: ({
      price: priceChange,
      priceChangePercent,
    }) => {
      updatePriceTracking(ethPriceTrackingContainer, {
        priceChange,
        priceChangePercent,
      }, true);
    },
  };
  wsInstance.addEventListener('message', ({ data: message }) => {
    lastMessageTime = getTime();
    const { data = {}, stream = 'unhandled_stream' } = JSON.parse(message);
    const price = Number(data.p);
    const priceChangePercent = Number(data.P);
    messageHandlers[stream]?.({ price, priceChangePercent });
    sendPongMessage();
  });
}

function startCryptoPriceTracking() {
  createWSConnection();
  // check health every 10s
  setInterval(() => {
    const status = wsInstance?.readyState;
    const timeWithoutPingMessage = getTime() - lastMessageTime;
    if (status === 0 || (status === 1 && timeWithoutPingMessage < 10000)) {
      return;
    }
    // try to open a new WS connection
    createWSConnection();
  }, 10000);
}

function getWeatherDescription(description, weatherId) {
  let result = description;
  function check(start, end, value) {
    if (weatherId >= start && weatherId <= end) {
      result = value;
    }
  }
  check(200, 202, 'thunderstorm & rain');
  check(230, 232, 'thunderstorm & drizzle');
  check(310, 312, 'drizzle rain');
  check(313, 314, 'shower rain & drizzle');
  check(520, 522, 'shower rain');
  if (weatherId >= 801) {
    result = description.split(':')[0];
  }
  return result;
}

async function getWeatherInfo() {
  Array.from(document.getElementsByTagName('img')).forEach(({ src: str }) => {
    weatherAppIds.push(str.split('=')[1]);
  });
  shuffleArray(weatherAppIds);
  for (let i = 0; i < weatherAppIds.length; i++) {
    const appId = weatherAppIds[i];
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${appId}&units=metric`);
      const data = await response.json();
      const {
        main: { temp, temp_min: minTemp, temp_max: maxTemp },
        name: city, sys: { country }, weather,
      } = data;
      Object.assign(weatherInfo, {
        temp,
        minTemp,
        maxTemp,
        city,
        country,
        description: getWeatherDescription(weather[0].description, weather[0].id),
      });
      break;
    } catch (_) {
      // try to make another call if applicable
    }
  }
}

async function startWeatherWidget() {
  await getWeatherInfo();
  if (Object.keys(weatherInfo).length === 0) {
    return;
  }
  const {
    temp: _temp, minTemp: _minTemp, maxTemp: _maxTemp, city, country, description,
  } = weatherInfo;
  const temp = Math.round(_temp);
  const minTemp = Math.round(_minTemp);
  const maxTemp = Math.round(_maxTemp);
  const mainTempElement = document.querySelector('#widgets .weather .main-temp div');
  const minTempElement = document.querySelector('#widgets .weather .min');
  const maxTempElement = document.querySelector('#widgets .weather .max');
  const locationElement = document.querySelector('#widgets .weather .location');
  const descriptionElement = document.querySelector('#widgets .weather .weather-description');
  mainTempElement.textContent = temp;
  minTempElement.textContent = `${minTemp}°`;
  maxTempElement.textContent = `${maxTemp}°`;
  locationElement.textContent = `${city}, ${country}`;
  descriptionElement.textContent = description;
}

function requireGeoInfo() {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition((position) => {
      lat = position.coords.latitude;
      long = position.coords.longitude;
      resolve();
    }, resolve);
  });
}

// INIT FUNCTION
async function init() {
  const appWidth = AppContainer.offsetWidth;
  const appHeight = AppContainer.offsetHeight;
  const startTime = getTime();
  createGridSystem(appWidth, appHeight);
  startCryptoPriceTracking();
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
    await requireGeoInfo();
    startWeatherWidget();
    // first touching to trigger browser optimization on mobile
    onCellTouch(Math.floor(rows / 2), Math.floor(cols / 2), true, true);
    const mainContainerSizeAfterScaling = (appHeight
      * (isMobileDevice() ? MAIN_CONTENT_SIZE_MOBILE : MAIN_CONTENT_SIZE))
      / 100;
    loadingScreen.style.opacity = '0';
    await sleep(LOADING_FADE_OUT_TIME);
    // remove loading screen after the user clicks
    loadingScreen.remove();
    showMainPanel(mainContainerSizeAfterScaling);
    // delay to avoid heavy load
    setTimeout(startDotGame, 1409);
    prepareTrackInfoLayout(appWidth, appHeight, mainContainerSizeAfterScaling);
    await sleep(8000);
    startMusic();
    // delay to avoid heavy load
    setTimeout(() => {
      showMiniLogo();
      showWidgets();
      startSignatureNeonEffect();
    }, 1013);
  }, { once: true });
}

// APP INIT
init();
