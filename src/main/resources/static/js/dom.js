const chatContainer = document.getElementById('chat-container');
const modeMenuButton = document.getElementById('mode-menu-button');
const modeDropdown = document.getElementById('mode-dropdown');
const langMenuButton = document.getElementById('lang-menu-button');
const langDropdown = document.getElementById('lang-dropdown');
const micKo = document.getElementById('mic-ko');
const micUk = document.getElementById('mic-uk');

const _textMeasureSpan = document.createElement('span');
_textMeasureSpan.style.fontFamily = 'Pretendard';
_textMeasureSpan.style.fontWeight = 'bold';
_textMeasureSpan.style.position = 'absolute';
_textMeasureSpan.style.whiteSpace = 'nowrap';
_textMeasureSpan.style.visibility = 'hidden';
document.body.appendChild(_textMeasureSpan);
