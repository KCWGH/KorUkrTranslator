// API and Asset URLs
const ICON_PLAY_URL = '../image/tts.png';
const ICON_STOP_URL = '../image/tts_stop.png';
const API_URL = '/api/translate';
const ICON_MIC_URL = '../image/mic.png';

// Translation Modes
const MODE_FAST = 'FAST';
const MODE_ACCURATE = 'ACCURATE';

// Timing Constants
let SILENCE_TIMEOUT = 2000; // 사파리에서는 동적으로 조정됨
const LOADING_DOT_INTERVAL = 500;
const COPY_FEEDBACK_DURATION = 800;
const FONT_SIZE_STEP = 0.05;
const MIN_FONT_SIZE = 0.6;
const INITIAL_FONT_SIZE = 0.9;

// UI Constants
const DROPDOWN_BASE_WIDTH = 150;
const DROPDOWN_PADDING_X = 15;
const DROPDOWN_BUFFER = 5;
const MAX_MODE_DROPDOWN_WIDTH = DROPDOWN_BASE_WIDTH - (DROPDOWN_PADDING_X * 2) - DROPDOWN_BUFFER;

// Locale Constants
const LOCALE_KO = 'ko-KR';
const LOCALE_UK = 'uk-UA';

// Error Message Limits
const MAX_ERROR_MESSAGE_LENGTH = 100;
const MAX_ERROR_PREVIEW_LENGTH = 50;

// Chat Message Limits
const MAX_CHAT_MESSAGES = 50;

