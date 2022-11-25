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
const LOADING_FADE_OUT_TIME = 1000;
const MIN_LOADING_TIME = 4000;
const MAIN_CONTENT_SIZE = 20; // relative size in percentage
const MAIN_CONTENT_SIZE_MOBILE = 15; // relative size in percentage
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
const CRYPTO_UPDATE_RATE = 4;
const TOP_CELLS_EFFECT_COLORS = [
  [0, 255, 255], [255, 0, 255], [255, 255, 0],
  [255, 255, 255], [255, 127, 0], [255, 0, 127],
  [127, 255, 0], [0, 255, 127], [127, 0, 255], [0, 127, 255]];
const DATE_ABBREVIATION = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
  Jan: 'January',
  Feb: 'February',
  Mar: 'March',
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December',
};

// GLOBAL VARS
let rows;
let cols;
const AppContainer = document.getElementById('app');
const btcPriceTrackingContainer = document.querySelector('#widgets .btc-tracking');
const ethPriceTrackingContainer = document.querySelector('#widgets .eth-tracking');
const cells = [];
const intervalIds = [];
const isCellExisted = [];
let audioCtx = null;
const audioOutput = document.getElementById('audio-output');
let audioSource = null;
let audioAnalyser = null;
let tracks = [];
let currentTrackIndex = -1;
let trackData = null;
const visualizationBars = document.getElementsByClassName('bar');
let widgetsExpanded = false;
let wsInstance = null;
let wsEventID = 3;
let lastPongMessageTime = 0;
let lastBTCPrice = null;
let lastETHPrice = null;
let lastMessageTime = 0;
const weatherInfo = {};
// Marina Bay coordinates
let lat = 1.2878;
let long = 103.8666;
const pageLoadPromise = new Promise((resolve) => {
  window.addEventListener('load', resolve);
});

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
  if (navigator.userAgentData) {
    return navigator.userAgentData.mobile;
  }
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
  const numStr = number.toFixed(fractionDigits);
  let result = '';
  if (alwaysShowSign) {
    result += number >= 0 ? '+' : '-';
  } else if (number < 0) {
    result += '-';
  }
  if (hasDollarSign) {
    result += '$';
  }
  const integral = `${Math.trunc(Math.abs(number))}`;
  const integralLen = integral.length;
  for (let i = 0; i < integralLen; i++) {
    result += integral[i];
    if ((i + 1) % 3 === integralLen % 3 && i !== integralLen - 1) {
      result += ',';
    }
  }
  if (fractionDigits === 0) {
    return result;
  }
  result += '.';
  const dotPos = numStr.indexOf('.');
  for (let i = 0; i < fractionDigits; i++) {
    result += numStr[dotPos + 1 + i];
  }
  return result;
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

function getDataFromClass(className) {
  const element = document.querySelector(`.${className}`);
  let str = '';
  for (let i = 0; ; i++) {
    const s = getComputedStyle(element).getPropertyValue(`--prop${i}`);
    if (!s) {
      break;
    }
    str += s;
  }
  element.remove();
  return JSON.parse(window.atob(str));
}

function getStreamNameFromWebSocketMessage(message = '') {
  const msgLen = message.length;
  const token = 'stream":';
  let current = -1;
  let index;
  for (index = 0; index < msgLen && current < 7; index++) {
    if (message[index] === token[current + 1]) {
      current++;
    } else {
      current = message[index] === token[0] ? 0 : -1;
    }
  }
  if (current < 7) {
    return 'unhandled_stream';
  }
  let stream = '';
  for (let i = index + 1; i < msgLen && message[i] !== '"'; i++) {
    stream += message[i];
  }
  return stream;
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

function createDot(dotSize, top, left, imgSrc, linkElement) {
  const dot = document.createElement('div');
  dot.style.height = `${dotSize}px`;
  dot.style.width = `${dotSize}px`;
  dot.style.borderRadius = `${dotSize}px`;
  dot.style.top = `${top}px`;
  dot.style.left = `${left}px`;
  dot.style.opacity = '0';
  dot.classList.add('randy');
  if (!imgSrc) {
    return dot;
  }
  dot.style.display = 'flex';
  dot.style.justifyContent = 'center';
  dot.style.alignItems = 'center';
  const img = document.createElement('img');
  img.src = imgSrc;
  img.style.width = '65%';
  img.style.height = '65%';
  dot.append(img);
  addUniversalSensitiveClickListener(dot, () => linkElement.click());
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
      103, 103, 103, 103, 103, 103, 103, 103, 103, 103, 103, 103, 1409, 127, 1409, 127, 1801,
    ]);
  }
  makeEffect();
}

function topCellsEffect() {
  const colorsLength = TOP_CELLS_EFFECT_COLORS.length;
  const isMobile = isMobileDevice();
  const propagationDelay = PROPAGATION_DELAY * 0.6 * (isMobile ? 1.5 : 1);
  const commonOptions = {
    triggeredByCode: true,
    colorOpacity: isMobile ? 0.9 : 0.7,
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
  const links = [
    {
      imgSrc: './images/github.png',
      linkElement: document.getElementById('a-github'),
    },
    {
      imgSrc: './images/gmail.png',
      linkElement: document.getElementById('a-gmail'),
    },
    {
      imgSrc: './images/linkedin.png',
      linkElement: document.getElementById('a-linkedin'),
    },
    {
      imgSrc: './images/whatsapp.png',
      linkElement: document.getElementById('a-whatsapp'),
    },
  ];
  let currentIndex = -1;
  setInterval(() => {
    // skip generating when the tab is out of focus
    if (!document.hasFocus()) {
      return;
    }
    // generate dot
    const appWidth = AppContainer.offsetWidth;
    const appHeight = AppContainer.offsetHeight;
    const isMobile = isMobileDevice();
    const minDotSize = isMobile ? MIN_DOT_SIZE_MOBILE : MIN_DOT_SIZE;
    const maxDotSize = isMobile ? MAX_DOT_SIZE_MOBILE : MAX_DOT_SIZE;
    const dotSize = (getRandom(minDotSize, maxDotSize) / 100) * appWidth;
    const top = getRandom(appHeight / rows, appHeight / 8);
    const left = getRandom(0, appWidth - dotSize);
    currentIndex++;
    const hasLink = currentIndex % 2 === 0;
    const dot = createDot(
      dotSize,
      top,
      left,
      hasLink && links[(currentIndex / 2) % links.length].imgSrc,
      hasLink && links[(currentIndex / 2) % links.length].linkElement,
    );
    addUniversalSensitiveClickListener(dot, () => {
      dot.remove();
      if (!hasLink) {
        topCellsEffect();
      }
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

function onCellTouch(
  row,
  col,
  triggeredByCode = false,
  colorOpacity = 0.4,
  color = [255, 255, 255],
) {
  const options = {
    triggeredByCode,
    colorOpacity,
    color,
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

const loadTrack = (index) => new Promise((resolve) => {
  const { path, name, artist } = tracks[index];
  const ajaxRequest = new XMLHttpRequest();
  ajaxRequest.open('GET', path, true);
  ajaxRequest.responseType = 'blob';
  ajaxRequest.onload = () => {
    const blobData = ajaxRequest.response;
    const nextTrackIndex = (currentTrackIndex + 1) % tracks.length;
    if (index !== nextTrackIndex || trackData !== null) {
      return;
    }
    trackData = {
      path,
      name,
      artist,
      audioUrl: URL.createObjectURL(blobData),
    };
    resolve();
  };
  ajaxRequest.send();
});

async function loadFirstTrack() {
  tracks = getDataFromClass('tracks-info');
  shuffleArray(tracks);
  await loadTrack(0);
  currentTrackIndex = 0;
}

function prepareMusic() {
  audioOutput.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
  audioOutput.play();
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioSource = audioCtx.createMediaElementSource(audioOutput);
  audioAnalyser = audioCtx.createAnalyser();
  audioAnalyser.minDecibels = -90;
  audioAnalyser.maxDecibels = -10;
  audioAnalyser.smoothingTimeConstant = 0.85;
  audioAnalyser.fftSize = 64;
  audioSource.connect(audioAnalyser);
  audioAnalyser.connect(audioCtx.destination);
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Randy\'s music radio',
      artist: 'Tap to go to the radio',
      album: 'Tap to go to the radio',
    });
  }
  function reloadOnVisiblePause() {
    if (audioOutput.src?.indexOf('blob') !== -1 && audioOutput.paused) {
      window.location.reload();
    }
  }
  document.onvisibilitychange = () => {
    if (document.visibilityState === 'visible') {
      reloadOnVisiblePause();
    }
  };
  window.addEventListener('focus', reloadOnVisiblePause);
}

function prepareTrack(index) {
  // avoid heavy load
  setTimeout(() => loadTrack(index), 2003);
  return setInterval(() => {
    if (trackData !== null) {
      return;
    }
    loadTrack(index);
  }, 30000);
}

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
  decoPattern.src = './images/deco.png';
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
    clearInterval(intervalID);
    clearOldSpans(trackInfoContainer);
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
      const newWidth = (dataArray[i] / 255) * 3 * diskSize;
      bar.style.transform = `scaleX(${newWidth / bar._width_})`;
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

async function startMusic(fallback = null) {
  if (trackData === null) {
    if (fallback) {
      trackData = fallback;
    } else {
      return;
    }
  } else if (fallback) {
    // delay to avoid heavy load
    setTimeout(() => URL.revokeObjectURL(fallback.audioUrl), 20000);
  }
  // animation at the beginning of the song
  onCellTouch(Math.floor(rows / 2), Math.floor(cols / 2), true);
  const currentTrack = trackData;
  trackData = null;
  const intervalId = prepareTrack((currentTrackIndex + 1) % tracks.length);
  audioOutput.src = currentTrack.audioUrl;
  const stopVisualizationHandler = startMusicVisualization(audioAnalyser);
  // delay to avoid heavy load
  await sleep(1213);
  const stopTrackInfoHandler = createTrackInfo(currentTrack);
  audioOutput.onended = async () => {
    audioOutput.src = '';
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    clearInterval(intervalId);
    stopVisualizationHandler();
    stopTrackInfoHandler(true);
    await sleep(1000);
    // play next track
    startMusic(currentTrack);
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

function resetGrid() {
  onCellTouch(Math.floor(rows / 2), Math.floor(cols / 2), true, 0.5, [255, 0, 255]);
  setTimeout(() => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        cells[i][j].style.zIndex = '3';
        isCellExisted[i][j] = true;
      }
    }
  }, 1013);
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
  setTimeout(() => addUniversalSensitiveClickListener(diskContainer, resetGrid), 8000);
  diskContainer.classList.add('disk-animation');
  // make mask fade after signature's animation is done
  const mask = document.getElementById('mask');
  mask.classList.add('faded-effect');
  // remove mask after 3s from starting time, to avoid heavy load
  setTimeout(() => mask.remove(), 11000);
  // styling for bars
  for (let i = 0; i < visualizationBars.length; i++) {
    const bar = visualizationBars[i];
    const width = mainContainerSize * (2 - i / (visualizationBars.length - 1));
    bar._width_ = width;
    bar.style.width = `${width}px`;
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
  if (!widgetsExpanded) {
    return;
  }
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

function sendPongMessage(currentTime) {
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
    _limitUpdateRate_: (currentTime, self, message) => {
      const timeDiff = currentTime - (self._lastUpdate_ ?? 0);
      if (timeDiff < 1000 / CRYPTO_UPDATE_RATE) {
        return null;
      }
      const { data = {} } = JSON.parse(message);
      const price = Number(data.p);
      const priceChangePercent = Number(data.P);
      self._lastUpdate_ = currentTime;
      return { price, priceChangePercent };
    },
    [BTCUSDT_STREAM_NAME]: function (currentTime, message) {
      const data = this._limitUpdateRate_(currentTime, this[BTCUSDT_STREAM_NAME], message);
      if (!data) {
        return;
      }
      updatePriceTracking(btcPriceTrackingContainer, {
        previousPrice: lastBTCPrice ?? data.price, currentPrice: data.price,
      });
      lastBTCPrice = data.price;
    },
    [BTCUSDT_STATISTIC_STREAM_NAME]: function (currentTime, message) {
      const data = this._limitUpdateRate_(
        currentTime,
        this[BTCUSDT_STATISTIC_STREAM_NAME],
        message,
      );
      if (!data) {
        return;
      }
      updatePriceTracking(btcPriceTrackingContainer, {
        priceChange: data.price, priceChangePercent: data.priceChangePercent,
      }, true);
    },
    [ETHUSDT_STREAM_NAME]: function (currentTime, message) {
      const data = this._limitUpdateRate_(currentTime, this[ETHUSDT_STREAM_NAME], message);
      if (!data) {
        return;
      }
      updatePriceTracking(ethPriceTrackingContainer, {
        previousPrice: lastETHPrice ?? data.price, currentPrice: data.price,
      });
      lastETHPrice = data.price;
    },
    [ETHUSDT_STATISTIC_STREAM_NAME]: function (currentTime, message) {
      const data = this._limitUpdateRate_(
        currentTime,
        this[ETHUSDT_STATISTIC_STREAM_NAME],
        message,
      );
      if (!data) {
        return;
      }
      updatePriceTracking(ethPriceTrackingContainer, {
        priceChange: data.price,
        priceChangePercent: data.priceChangePercent,
      }, true);
    },
  };
  wsInstance.addEventListener('message', ({ data: message }) => {
    const currentTime = getTime();
    lastMessageTime = currentTime;
    sendPongMessage(currentTime);
    const stream = getStreamNameFromWebSocketMessage(message);
    messageHandlers[stream]?.(currentTime, message);
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
  const { appIds, url } = getDataFromClass('weather-app-ids');
  shuffleArray(appIds);
  for (let i = 0; i < appIds.length; i++) {
    const appId = appIds[i];
    try {
      const response = await fetch(`${url}?lat=${lat}&lon=${long}&appid=${appId}&units=metric`);
      const data = await response.json();
      const {
        main: { temp, temp_min: minTemp, temp_max: maxTemp },
        name: city, weather,
      } = data;
      Object.assign(weatherInfo, {
        temp,
        minTemp,
        maxTemp,
        city,
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
    temp: _temp, minTemp: _minTemp, maxTemp: _maxTemp, city, description,
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
  locationElement.textContent = `${city}`;
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

function startClock() {
  const clockFirstRow = document.querySelector('#widgets .clock .row-1');
  const clockSecondRow = document.querySelector('#widgets .clock .row-2');
  function updateTime(dateObj) {
    const str = dateObj.toString();
    const tokens = str.split(' ');
    const temp = `${tokens[4]} ${tokens[5]}`;
    const firstRowText = `${temp.slice(0, 15)}:${temp.slice(15, 17)}`;
    const secondRowText = `${DATE_ABBREVIATION[tokens[0]]}, ${tokens[2]} ${DATE_ABBREVIATION[tokens[1]]} ${tokens[3]}`;
    clockFirstRow.textContent = firstRowText;
    clockSecondRow.textContent = secondRowText;
  }
  function tick() {
    const dateObj = new Date();
    const time = dateObj.getTime();
    const nextTime = Math.floor((time + 1000) / 1000) * 1000;
    const delay = nextTime - time;
    updateTime(dateObj);
    setTimeout(tick, delay);
  }
  tick();
}

// INIT FUNCTION
async function init() {
  const appWidth = AppContainer.offsetWidth;
  const appHeight = AppContainer.offsetHeight;
  const startTime = getTime();
  createGridSystem(appWidth, appHeight);
  startCryptoPriceTracking();
  startClock();
  await loadFirstTrack();
  // wait more if loading time is way too fast
  const currentTime = getTime();
  if (currentTime - startTime < MIN_LOADING_TIME) {
    await sleep(MIN_LOADING_TIME - (currentTime - startTime));
  }
  await pageLoadPromise;
  // show alert
  const alertText = document.getElementById('start-alert');
  alertText.style.opacity = '1';
  alertText.style.transition = 'opacity 0.5s';
  const loadingScreen = document.getElementById('loading');
  loadingScreen.addEventListener('click', async () => {
    prepareMusic();
    await requireGeoInfo();
    startWeatherWidget();
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
