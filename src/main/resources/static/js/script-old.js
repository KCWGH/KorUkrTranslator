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

const i18n = {
    ko: {
        title: '번역기',
        mode_fast: '빠른 번역',
        mode_accurate: '정확한 번역',
        lang_ko: '🇰🇷 한국어',
        lang_uk: '🇺🇦 Українська',
        status_wait_trans_base: '번역 요청 중',
        chat_initial_ko: '안녕하세요! 이 앱은 한국어-우크라이나어 실시간 통역 앱입니다.',
        chat_initial_uk: 'Привіт! Цей додаток є програмою для перекладу в режимі реального часу з корейської на українську.',
        chat_example_uk: 'Скільки коштує квиток до Сеула?',
        chat_example_ko: '서울까지 티켓은 얼마예요?',
        alert_no_speech: '⚠️ 죄송합니다. 이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 또는 Edge 브라우저 사용을 권장합니다.)',
        error_mic_perm: '마이크 사용 권한을 허용해주세요.',
        error_server: '서버 연결 오류 또는 번역 실패: ',
        error_secure: '브라우저 보안 설정 오류 또는 HTTPS 접속이 아닙니다.',
        edit_tip: ' (클릭하여 편집)',
        copy_tip: ' (클릭하여 복사)',
        tts_play_title: '음성 재생',
        tts_stop_title: '음성 중지',
        clear_text_title: '텍스트 지우기',
        tooltip_mode_set: '번역 모드 설정',
        tooltip_lang_set: '언어 설정',
        mic_alt_recording: '녹음 중',
        mic_alt_ready: '마이크',
        copy_success: '✅ 복사 완료!',
        copy_fail: '❌ 복사 실패',
        error_http: 'HTTP 오류',
        error_translation: '번역'
    },
    uk: {
        title: 'Перекладач',
        mode_fast: 'Швидкий переклад',
        mode_accurate: 'Точний переклад',
        lang_ko: '🇰🇷 한국어',
        lang_uk: '🇺🇦 Українська',
        status_wait_trans_base: 'Запит на переклад',
        chat_initial_ko: '안녕하세요! 이 앱은 한국어-우크라이나어 실시간 통역 앱입니다.',
        chat_initial_uk: 'Привіт! Цей додаток є програмою для перекладу в режимі реального часу з корейської на українську.',
        chat_example_uk: 'Скільки коштує квиток до Сеула?',
        chat_example_ko: '서울까지 티켓은 얼마예요?',
        alert_no_speech: '⚠️ Вибачте. Ваш браузер не підтримує розпізнавання мови. (Рекомендовано використовувати Chrome або Edge.)',
        error_mic_perm: 'Будь ласка, дозвольте використання мікрофона.',
        error_server: 'Помилка підключення до сервера або невдалий переклад: ',
        error_secure: 'Помилка безпеки браузер або немає HTTPS-з\'єднання.',
        edit_tip: ' (Натисніть для редагування)',
        copy_tip: ' (Натисніть для копіювання)',
        tts_play_title: 'Відтворити аудіо',
        tts_stop_title: 'Зупинити аудіо',
        clear_text_title: 'Очистити текст',
        tooltip_mode_set: 'Налаштування режиму перекладу',
        tooltip_lang_set: 'Налаштування мови',
        mic_alt_recording: 'Запис...',
        mic_alt_ready: 'Мікрофон',
        copy_success: '✅ Скопійовано!',
        copy_fail: '❌ Помилка копіювання',
        error_http: 'HTTP помилка',
        error_translation: 'переклад'
    }
};

const appState = {
    currentMode: MODE_FAST,
    currentLang: 'ko',
    tts: {
        speakingButton: null,
        utterance: null,
    },
    loading: {
        interval: null,
    },
    recognition: {
        instance: null,
        liveMessageElements: null,
        silenceTimer: null,
        finalTranscript: '', // iOS Safari에서 우크라이나어 음성 인식 결과 누적을 위해 추가
        allResults: [], // 모든 결과를 저장하여 iOS Safari 문제 해결
    },
    // 메모리 누수 방지를 위한 이벤트 리스너 추적
    eventListeners: new Set(),
    // DOM 요소 참조 정리를 위한 WeakMap 사용
    elementRefs: new WeakMap()
};

let availableVoices = [];

const t = (key) => i18n[appState.currentLang][key] || key;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// 브라우저 감지 및 디버깅
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isMacOS = /Mac OS X/.test(navigator.userAgent);

console.log('Browser detection:', {
    userAgent: navigator.userAgent,
    isSafari,
    isIOS,
    isMacOS,
    speechRecognitionSupported: !!SpeechRecognition
});

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

const measureTextWidth = (text, fontSize) => {
    _textMeasureSpan.textContent = text;
    _textMeasureSpan.style.fontSize = fontSize + 'em';
    return _textMeasureSpan.offsetWidth;
};

// 메모리 누수 방지를 위한 이벤트 리스너 관리 유틸리티
const addManagedEventListener = (element, event, handler, options = {}) => {
    element.addEventListener(event, handler, options);
    const listenerId = `${element.constructor.name}_${event}_${Date.now()}`;
    appState.eventListeners.add({
        element,
        event,
        handler,
        options,
        id: listenerId
    });
    return listenerId;
};

const removeManagedEventListener = (element, event, handler) => {
    element.removeEventListener(event, handler);
    // Set에서 해당 리스너 제거
    for (const listener of appState.eventListeners) {
        if (listener.element === element && listener.event === event && listener.handler === handler) {
            appState.eventListeners.delete(listener);
            break;
        }
    }
};

const cleanupAllEventListeners = () => {
    appState.eventListeners.forEach(listener => {
        listener.element.removeEventListener(listener.event, listener.handler);
    });
    appState.eventListeners.clear();
};

// DOM 요소 정리를 위한 유틸리티
const cleanupElement = (element) => {
    if (element && element.parentNode) {
        // 모든 자식 요소의 이벤트 리스너 정리
        const allElements = element.querySelectorAll('*');
        allElements.forEach(el => {
            const clonedEl = el.cloneNode(true);
            el.parentNode.replaceChild(clonedEl, el);
        });
        element.remove();
    }
};

// DOM Utility Functions
const createElement = (tag, className = '', textContent = '') => {
    const element = document.createElement(tag);
    if (className) element.classList.add(...className.split(' '));
    if (textContent) element.textContent = textContent;
    return element;
};

const removeAllChildren = (element, excludeClass = '') => {
    Array.from(element.childNodes).forEach(node => {
        if (!excludeClass || !node.classList || !node.classList.contains(excludeClass)) {
            node.remove();
        }
    });
};

const getTextContent = (element) => {
    // contenteditable 요소에서 줄바꿈을 포함한 텍스트 정확히 추출
    let text = '';
    
    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        } else if (node.nodeName === 'BR') {
            text += '\n';
        } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
            // 블록 요소는 줄바꿈으로 처리
            if (text && !text.endsWith('\n')) {
                text += '\n';
            }
            text += node.textContent;
        }
    }
    
    return text.trim();
};

// 텍스트 정규화: 줄바꿈을 공백으로 변환하고 연속된 공백을 하나로 합침
const normalizeTextForTranslation = (text) => {
    return text.replace(/\s+/g, ' ').trim();
};

const scrollToBottom = (container) => {
    container.scrollTop = container.scrollHeight;
};

function startTranslationLoading(translationEl) {
    stopTranslationLoading();

    const baseText = t('status_wait_trans_base');
    let dotCount = 0;

    translationEl.textContent = baseText + '...';
    translationEl.classList.add('is-loading');

    // 기존 인터벌 정리 후 새로 설정
    if (appState.loading.interval) {
        clearInterval(appState.loading.interval);
    }
    
    appState.loading.interval = setInterval(() => {
        dotCount = (dotCount % 3) + 1;
        const dots = '.'.repeat(dotCount);
        translationEl.textContent = baseText + dots;
    }, LOADING_DOT_INTERVAL);
}

function stopTranslationLoading() {
    if (appState.loading.interval) {
        clearInterval(appState.loading.interval);
        appState.loading.interval = null;
    }
    document.querySelectorAll('.system-translation.is-loading').forEach(el => {
        el.classList.remove('is-loading');
    });
}

// 모든 타이머와 인터벌 정리
function cleanupAllTimers() {
    if (appState.loading.interval) {
        clearInterval(appState.loading.interval);
        appState.loading.interval = null;
    }
    if (appState.recognition.silenceTimer) {
        clearTimeout(appState.recognition.silenceTimer);
        appState.recognition.silenceTimer = null;
    }
}

function toggleDropdown(targetDropdown, targetButton) {
    const isShow = targetDropdown.classList.toggle('show');
    targetButton.setAttribute('aria-expanded', isShow);

    const allDropdowns = [modeDropdown, langDropdown];
    const allButtons = [modeMenuButton, langMenuButton];

    allDropdowns.forEach((dropdown, index) => {
        if (dropdown !== targetDropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            allButtons[index].setAttribute('aria-expanded', 'false');
        }
    });
}

function getModeText(mode) {
    return t(mode === MODE_FAST ? 'mode_fast' : 'mode_accurate');
}

function updateButtonTitles() {
    const micKoTitle = micKo.querySelector('.mic-title');
    const micUkTitle = micUk.querySelector('.mic-title');

    if (micKoTitle) micKoTitle.textContent = '한국어';
    if (micUkTitle) micUkTitle.textContent = 'Українська';

    const micImageHtml = `<img src="${ICON_MIC_URL}" alt="${t('mic_alt_ready')}">`;

    const micKoIcon = micKo.querySelector('.mic-icon');
    const micUkIcon = micUk.querySelector('.mic-icon');

    if (micKoIcon) micKoIcon.innerHTML = micImageHtml;
    if (micUkIcon) micUkIcon.innerHTML = micImageHtml;
}

function resetSpeakerButtonState() {
    if (appState.tts.speakingButton) {
        const prevImg = appState.tts.speakingButton.querySelector('img');
        prevImg.src = ICON_PLAY_URL;
        prevImg.alt = t('tts_play_title');
        appState.tts.speakingButton.title = t('tts_play_title');
        appState.tts.speakingButton.classList.remove('stop');
        appState.tts.speakingButton.classList.add('play');
        appState.tts.speakingButton = null;
        
        // SpeechSynthesisUtterance 리소스 정리
        if (appState.tts.utterance) {
            appState.tts.utterance.onend = null;
            appState.tts.utterance.onerror = null;
            appState.tts.utterance = null;
        }
    }
}

function stopSpeaking() {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    resetSpeakerButtonState();
}

function renderModeDropdown() {
    modeDropdown.innerHTML = '';

    const modes = [
        { code: MODE_FAST, name: t('mode_fast') },
        { code: MODE_ACCURATE, name: t('mode_accurate') }
    ];

    modes.forEach(mode => {
        const optionEl = createElement('div', 'mode-option');
        optionEl.dataset.mode = mode.code;

        const nameEl = createElement('div', '', mode.name);
        nameEl.style.fontWeight = 'bold';

        optionEl.appendChild(nameEl);

        if (mode.code === appState.currentMode) {
            optionEl.classList.add('selected');
        }

        let currentFontSize = INITIAL_FONT_SIZE;
        let textWidth = measureTextWidth(mode.name, currentFontSize);

        while (textWidth > MAX_MODE_DROPDOWN_WIDTH && currentFontSize > MIN_FONT_SIZE) {
            currentFontSize -= FONT_SIZE_STEP;
            textWidth = measureTextWidth(mode.name, currentFontSize);
        }

        optionEl.style.fontSize = currentFontSize + 'em';

        optionEl.addEventListener('click', () => {
            appState.currentMode = mode.code;
            updateUI();
            modeDropdown.classList.remove('show');
            modeMenuButton.setAttribute('aria-expanded', 'false');
        });

        modeDropdown.appendChild(optionEl);
    });
}

function renderLangDropdown() {
    langDropdown.innerHTML = '';

    const langs = [
        { code: 'ko', name: t('lang_ko') },
        { code: 'uk', name: t('lang_uk') }
    ];

    langs.forEach(lang => {
        const optionEl = createElement('div', 'lang-option', lang.name);
        optionEl.dataset.lang = lang.code;

        if (lang.code === appState.currentLang) {
            optionEl.classList.add('selected');
        }

        optionEl.addEventListener('click', () => {
            appState.currentLang = lang.code;
            updateUI();
            langDropdown.classList.remove('show');
            langMenuButton.setAttribute('aria-expanded', 'false');
        });

        langDropdown.appendChild(optionEl);
    });
}

function updateUI() {
    stopTranslationLoading();
    document.getElementById('doc-title').textContent = t('title');

    modeMenuButton.title = t('tooltip_mode_set');
    langMenuButton.title = t('tooltip_lang_set');

    modeMenuButton.setAttribute('aria-label', t('tooltip_mode_set'));
    langMenuButton.setAttribute('aria-label', t('tooltip_lang_set'));

    renderModeDropdown();
    renderLangDropdown();

    chatContainer.innerHTML = '';
    addMessage(t('chat_initial_ko'), 'ko-uk', t('chat_initial_uk'), false, true);
    addMessage(t('chat_example_uk'), 'uk-ko', t('chat_example_ko'), false, true);

    updateButtonTitles();
}

function speakText(text, langCode, buttonEl) {
    if (!('speechSynthesis' in window)) return;

    appState.tts.speakingButton = buttonEl;

    const utterance = new SpeechSynthesisUtterance(text);
    appState.tts.utterance = utterance;

    const voiceLang = langCode === 'ko' ? LOCALE_KO : LOCALE_UK;
    utterance.lang = voiceLang;

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.lang.startsWith(voiceLang));
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    const imgEl = buttonEl.querySelector('img');
    imgEl.src = ICON_STOP_URL;
    imgEl.alt = t('tts_stop_title');
    buttonEl.title = t('tts_stop_title');
    buttonEl.classList.remove('play');
    buttonEl.classList.add('stop');

    utterance.onend = resetSpeakerButtonState;
    utterance.onerror = resetSpeakerButtonState;

    window.speechSynthesis.speak(utterance);
}

function addSpeakerButton(translationWrapper, textToSpeak, direction, isDisabled = false) {
    const isKorean = direction === 'ko-uk';
    const targetLangCode = isKorean ? 'uk' : 'ko';

    let speakerButton = translationWrapper.querySelector('.speaker-button');
    if (speakerButton) speakerButton.remove();

    speakerButton = createElement('button', 'speaker-button play');
    speakerButton.title = t('tts_play_title');
    speakerButton.disabled = isDisabled;

    const iconImg = createElement('img');
    iconImg.src = ICON_PLAY_URL;
    iconImg.alt = t('tts_play_title');
    speakerButton.appendChild(iconImg);

    speakerButton.addEventListener('click', () => {
        const textToSpeakFinal = textToSpeak;
        const loadingText = t('status_wait_trans_base');

        if (appState.tts.speakingButton === speakerButton) {
            stopSpeaking();
            return;
        }

        stopSpeaking();

        if (textToSpeakFinal && textToSpeakFinal.substring(0, loadingText.length) !== loadingText) {
            speakText(textToSpeakFinal, targetLangCode, speakerButton);
        }
    });

    translationWrapper.appendChild(speakerButton);
    return speakerButton;
}

async function processTranslation(text, direction, messageEl, originalTextEl, translationEl) {
    console.log('processTranslation called:', { text, direction, isSafari });
    
    stopSpeaking();
    startTranslationLoading(translationEl);

    const oldSpeakerButton = messageEl.querySelector('.speaker-button');
    if (oldSpeakerButton) oldSpeakerButton.remove();

    // 줄바꿈을 공백으로 변환하여 번역 API에 전달
    const normalizedText = normalizeTextForTranslation(text);

    const requestData = {
        text: normalizedText,
        direction: direction,
        mode: appState.currentMode
    };

    const url = API_URL;
    console.log('Sending translation request:', requestData);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('Translation response received:', { status: response.status, ok: response.ok });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText.trim() || `${t('error_http')}: ${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const translatedText = await response.text();

        stopTranslationLoading();
        translationEl.textContent = translatedText;
        translationEl.classList.remove('translation-error');
        translationEl.title = t('copy_tip');
        addSpeakerButton(translationEl.parentElement, translatedText, direction, false);
        translationEl.parentElement.style.display = 'flex';

    } catch (error) {
        stopTranslationLoading();
        let displayMessage = error.message;

        if (displayMessage.startsWith(t('error_http')) || !displayMessage.includes(t('error_translation'))) {
            displayMessage = t('error_server') + displayMessage.substring(0, MAX_ERROR_PREVIEW_LENGTH);
        } else if (displayMessage.length > MAX_ERROR_MESSAGE_LENGTH) {
            displayMessage = displayMessage.substring(0, MAX_ERROR_MESSAGE_LENGTH) + '...';
        }

        translationEl.textContent = displayMessage;
        translationEl.classList.add('translation-error');
        translationEl.title = '';
        addSpeakerButton(translationEl.parentElement, "", direction, true);
        translationEl.parentElement.style.display = 'flex';
    }
}

function addEditListeners(originalTextEl, initialText, direction, messageEl, translationEl) {

    const createClearButton = (targetEl) => {
        let clearButton = targetEl.querySelector('.clear-text-button');
        if (clearButton) return clearButton;

        clearButton = createElement('button', 'clear-text-button', '×');
        clearButton.title = t('clear_text_title');
        clearButton.setAttribute('contenteditable', 'false');

        clearButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            const clearButton = e.target;
            removeAllChildren(targetEl, 'clear-text-button');
            
            targetEl.focus();
            removeClearButton(targetEl);
        });

        targetEl.appendChild(clearButton);
        return clearButton;
    };

    const removeClearButton = (targetEl) => {
        const clearButton = targetEl.querySelector('.clear-text-button');
        if (clearButton) {
            clearButton.remove();
        }
    };

    originalTextEl.addEventListener('click', (e) => {
        if (e.target.getAttribute('contenteditable') === 'true' && document.activeElement === e.target) {
            return;
        }
        e.target.setAttribute('contenteditable', 'true');
        e.target.focus();
    });

    originalTextEl.addEventListener('focus', (e) => {
        if (e.target.getAttribute('contenteditable') === 'true') {
        const textOnly = getTextContent(e.target);
            if (textOnly.length > 0) {
                createClearButton(e.target).style.display = 'flex';
            }
        }
    });

    originalTextEl.addEventListener('input', (e) => {
        const currentText = getTextContent(e.target);
        if (currentText.length > 0) {
            createClearButton(e.target).style.display = 'flex';
        } else {
            removeClearButton(e.target);
        }
    });

    originalTextEl.addEventListener('blur', (e) => {
        const clearButton = e.target.querySelector('.clear-text-button');
        if (clearButton) {
            clearButton.remove();
        }

        const currentText = getTextContent(e.target);
        const originalText = originalTextEl.getAttribute('data-initial-text');

        e.target.setAttribute('contenteditable', 'false');
        e.target.removeAttribute('data-example');

        if (!currentText) {
            e.target.textContent = originalText;
            return;
        }

        if (currentText !== originalText) {
            removeAllChildren(e.target, 'clear-text-button');
            e.target.prepend(document.createTextNode(currentText));

            processTranslation(currentText, direction, messageEl, originalTextEl, translationEl);
            originalTextEl.setAttribute('data-initial-text', currentText);
        } else {
            removeAllChildren(e.target, 'clear-text-button');
            e.target.prepend(document.createTextNode(originalText));
        }
    });

    originalTextEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift + Enter: 줄바꿈 허용 (기본 동작 유지)
                return;
            } else {
                // Enter만: 번역 실행
                e.preventDefault();
                e.target.blur();
                return;
            }
        }

        const isMac = navigator.userAgent.toUpperCase().includes('MAC');
        const isControlOrCommandA = (e.key === 'a' || e.key === 'A') && (e.ctrlKey || (isMac && e.metaKey));

        if (isControlOrCommandA) {
            e.preventDefault();

            const selection = window.getSelection();
            const range = document.createRange();

            let firstTextNode = null;
            let lastTextNode = null;
            let lastNodeLength = 0;

            for (const node of e.target.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (!firstTextNode) {
                        firstTextNode = node;
                    }
                    lastTextNode = node;
                    lastNodeLength = node.textContent.length;
                }
            }

            if (firstTextNode && lastTextNode) {
                range.setStart(firstTextNode, 0);
                range.setEnd(lastTextNode, lastNodeLength);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            return;
        }

        if (e.key === 'Backspace' || e.key === 'Delete') {

            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;
            const clearButton = e.target.querySelector('.clear-text-button');

            if (clearButton && selection.containsNode(clearButton, true)) {
                e.preventDefault();
                
                const clearButton = e.target.querySelector('.clear-text-button');
                Array.from(e.target.childNodes).forEach(node => {
                    if (node !== clearButton) {
                        node.remove();
                    }
                });
                
                e.target.focus();
                removeClearButton(e.target);
                return;
            }

            const rawTextFromNodes = Array.from(e.target.childNodes)
                .filter(n => n.nodeType === Node.TEXT_NODE)
                .map(n => n.textContent)
                .join('');

            const range = selection.getRangeAt(0);
            const selectedText = range.toString();

            if (rawTextFromNodes.length === 1 && selectedText.length === 0) {
                e.preventDefault();
                Array.from(e.target.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        node.textContent = '';
                    }
                });
                e.target.focus();
                removeClearButton(e.target);
                return;
            }
        }
	});
}

function addCopyListener(translationEl) {
    translationEl.addEventListener('click', async (e) => {
        if (translationEl.classList.contains('is-loading') || translationEl.classList.contains('translation-error')) {
            return;
        }

        const textToCopy = translationEl.textContent;
        if (!textToCopy.trim()) return;

        try {
            await navigator.clipboard.writeText(textToCopy);
            const originalTitle = translationEl.title;
            translationEl.title = t('copy_success');
            setTimeout(() => {
                translationEl.title = originalTitle;
            }, COPY_FEEDBACK_DURATION);

        } catch (err) {
            const originalTitle = translationEl.title;
            translationEl.title = t('copy_fail');
            setTimeout(() => {
                translationEl.title = originalTitle;
            }, COPY_FEEDBACK_DURATION);
        }
    });
}

function addMessage(text, direction, translatedText, isError = false, isExample = false) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message');

    const isKorean = direction === 'ko-uk';
    messageEl.classList.add(isKorean ? 'korean-user' : 'ukrainian-user');

    const translationWrapper = document.createElement('div');
    translationWrapper.classList.add('translation-wrapper');

    const translationEl = document.createElement('span');
    translationEl.classList.add('system-translation');

    if (isError) {
        translationEl.classList.add('translation-error');
        translationEl.textContent = translatedText;
        translationEl.title = '';
    } else {
        translationEl.textContent = translatedText;
        if (!isExample) {
            translationEl.title = t('copy_tip');
        }
    }
    translationWrapper.appendChild(translationEl);

    if (!isExample && translatedText) {
        addSpeakerButton(translationWrapper, translationEl.textContent, direction, false);
    }
    messageEl.appendChild(translationWrapper);

    const originalTextEl = document.createElement('div');
    originalTextEl.classList.add('original-text');
    originalTextEl.textContent = text;
    originalTextEl.dataset.direction = direction;
    originalTextEl.setAttribute('data-initial-text', text);

    if (!isExample) {
        originalTextEl.title = t('edit_tip');
        originalTextEl.setAttribute('contenteditable', 'false');

        addEditListeners(originalTextEl, text, direction, messageEl, translationEl);
        addCopyListener(translationEl);
    } else {
        originalTextEl.setAttribute('contenteditable', 'false');
        originalTextEl.setAttribute('data-example', 'true');
    }

    messageEl.appendChild(originalTextEl);
    chatContainer.appendChild(messageEl);

    // DOM 요소 참조를 WeakMap에 저장하여 메모리 누수 방지
    appState.elementRefs.set(messageEl, {
        originalTextEl,
        translationEl,
        translationWrapper,
        direction,
        isExample
    });

    // 메시지 수 제한 적용
    limitChatMessages();

    chatContainer.scrollTop = chatContainer.scrollHeight;

    return { messageEl, originalTextEl, translationEl };
}

function createLiveMessage(direction) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message');
    messageEl.classList.add(direction === 'ko-uk' ? 'korean-user' : 'ukrainian-user');

    const translationWrapper = document.createElement('div');
    translationWrapper.classList.add('translation-wrapper');
    const translationEl = document.createElement('span');
    translationEl.classList.add('system-translation');
    translationEl.textContent = '...';
    translationWrapper.appendChild(translationEl);
    messageEl.appendChild(translationWrapper);

    const originalTextEl = document.createElement('div');
    originalTextEl.classList.add('original-text');
    originalTextEl.textContent = '...';
    originalTextEl.dataset.direction = direction;
    originalTextEl.classList.add('is-live-text');
    messageEl.appendChild(originalTextEl);

    chatContainer.appendChild(messageEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return { messageEl, originalTextEl, translationEl };
}

function setMicButtonState(micButton, isActive, isRecording = false) {
    const micIcon = micButton.querySelector('.mic-icon');

    micButton.disabled = !isActive;
    micButton.style.opacity = isActive ? 1.0 : 0.5;

    if (isRecording) {
        micButton.classList.add('recording');
        micButton.classList.add('is-recognition-disabled');
        micIcon.innerHTML = `<img src="${ICON_MIC_URL}" alt="${t('mic_alt_recording')}">`;
    } else {
        micButton.classList.remove('recording');
        micButton.classList.remove('is-recognition-disabled');
        micIcon.innerHTML = `<img src="${ICON_MIC_URL}" alt="${t('mic_alt_ready')}">`;
    }
}

function clearRecognitionUI(removeLiveMessage = true) {
    setMicButtonState(micKo, true);
    setMicButtonState(micUk, true);

    if (appState.recognition.silenceTimer) {
        clearTimeout(appState.recognition.silenceTimer);
        appState.recognition.silenceTimer = null;
    }

    // SpeechRecognition 인스턴스 정리
    if (appState.recognition.instance) {
        appState.recognition.instance.onstart = null;
        appState.recognition.instance.onresult = null;
        appState.recognition.instance.onend = null;
        appState.recognition.instance.onerror = null;
        appState.recognition.instance = null;
    }

    if (appState.recognition.liveMessageElements && removeLiveMessage) {
        cleanupElement(appState.recognition.liveMessageElements.messageEl);
        stopTranslationLoading();
    }

    appState.recognition.liveMessageElements = null;
    // iOS Safari 문제 해결을 위한 상태 초기화
    appState.recognition.finalTranscript = '';
    appState.recognition.allResults = [];
}

function handleRecognitionEnd(recognizedText, direction, elements) {
    const { messageEl, originalTextEl, translationEl } = elements;

    console.log('handleRecognitionEnd called:', { recognizedText, direction, elements });

    if (recognizedText && recognizedText.trim().length > 0) {
        originalTextEl.textContent = recognizedText;
        originalTextEl.classList.remove('is-live-text');

        console.log('Starting translation for:', recognizedText);
        processTranslation(recognizedText, direction, messageEl, originalTextEl, translationEl);

        originalTextEl.setAttribute('contenteditable', 'false');
        originalTextEl.title = t('edit_tip');
        originalTextEl.setAttribute('data-initial-text', recognizedText);

        addEditListeners(originalTextEl, recognizedText, direction, messageEl, translationEl);
        addCopyListener(translationEl);

        clearRecognitionUI(false);
    } else if (appState.recognition.liveMessageElements) {
        console.log('No recognized text, clearing UI');
        clearRecognitionUI(true);
    }
}

function startNewRecognition(direction) {
    const isKorean = direction === 'ko-uk';
    const langCode = isKorean ? LOCALE_KO : LOCALE_UK;

    console.log('Starting recognition:', { direction, langCode, isSafari });

    const activeMicButton = isKorean ? micKo : micUk;
    const inactiveMicButton = isKorean ? micUk : micKo;

    appState.recognition.liveMessageElements = createLiveMessage(direction);
    const elements = appState.recognition.liveMessageElements;
    const { originalTextEl } = elements;

    appState.recognition.instance = new SpeechRecognition();
    
    // 사파리에서 우크라이나어 지원 확인
    if (isSafari && !isKorean) {
        console.log('Safari detected for Ukrainian recognition');
        // 사파리에서는 더 구체적인 언어 코드 사용
        appState.recognition.instance.lang = 'uk-UA';
    } else {
        appState.recognition.instance.lang = langCode;
    }
    
    appState.recognition.instance.continuous = false;
    appState.recognition.instance.interimResults = true;

    // 사파리에서 추가 설정
    if (isSafari) {
        appState.recognition.instance.maxAlternatives = 1;
        // 사파리에서는 더 긴 타임아웃 사용
        SILENCE_TIMEOUT = 3000;
    }

    console.log('SpeechRecognition configured:', {
        lang: appState.recognition.instance.lang,
        continuous: appState.recognition.instance.continuous,
        interimResults: appState.recognition.instance.interimResults
    });

    setMicButtonState(activeMicButton, false, true);
    setMicButtonState(inactiveMicButton, false, false);

    const resetSilenceTimer = () => {
        // 기존 타이머 정리
        if (appState.recognition.silenceTimer) {
            clearTimeout(appState.recognition.silenceTimer);
            appState.recognition.silenceTimer = null;
        }
        
        // 새 타이머 설정
        appState.recognition.silenceTimer = setTimeout(() => {
            if (appState.recognition.instance) {
                appState.recognition.instance.stop();
            }
            appState.recognition.silenceTimer = null;
        }, SILENCE_TIMEOUT);
    };

    // iOS Safari 문제 해결: 인식 시작 시 상태 초기화
    appState.recognition.finalTranscript = '';
    appState.recognition.allResults = [];

    appState.recognition.instance.onstart = () => {
        console.log('Speech recognition started');
        // 인식 시작 시 상태 초기화
        appState.recognition.finalTranscript = '';
        appState.recognition.allResults = [];
        resetSilenceTimer();
    };

    appState.recognition.instance.onresult = (event) => {
        console.log('Speech recognition result:', event);
        resetSilenceTimer();

        let interimTranscript = '';
        let currentFinalTranscript = '';

        // iOS Safari에서 우크라이나어 음성 인식 시 모든 결과를 수집
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const isFinal = event.results[i].isFinal;
            
            console.log(`Result ${i}:`, { transcript, isFinal, confidence: event.results[i][0].confidence });
            
            // 모든 결과를 저장 (iOS Safari 문제 해결을 위해)
            appState.recognition.allResults.push({
                transcript: transcript,
                isFinal: isFinal,
                index: i
            });
            
            if (isFinal) {
                currentFinalTranscript += transcript;
                // 누적된 최종 결과 업데이트
                appState.recognition.finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // iOS Safari에서 우크라이나어의 경우 isFinal이 제대로 설정되지 않을 수 있으므로
        // 마지막 결과도 고려
        const displayText = (appState.recognition.finalTranscript + interimTranscript).trim() || "...";
        console.log('Display text:', { 
            finalTranscript: appState.recognition.finalTranscript, 
            currentFinal: currentFinalTranscript,
            interimTranscript, 
            displayText,
            allResultsCount: appState.recognition.allResults.length
        });
        
        originalTextEl.textContent = displayText;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    appState.recognition.instance.onend = () => {
        console.log('Speech recognition ended');
        
        if (appState.recognition.silenceTimer) {
            clearTimeout(appState.recognition.silenceTimer);
            appState.recognition.silenceTimer = null;
        }

        if (!appState.recognition.instance) {
            console.log('No recognition instance, returning');
            return;
        }

        // iOS Safari에서 우크라이나어 음성 인식 문제 해결
        let recognizedText = appState.recognition.finalTranscript.trim();
        
        // iOS Safari에서 isFinal이 제대로 설정되지 않는 경우를 대비
        if ((isSafari || isIOS) && !isKorean && !recognizedText) {
            console.log('iOS Safari Ukrainian: No final transcript, checking all results');
            // 모든 결과에서 마지막 결과 사용
            if (appState.recognition.allResults.length > 0) {
                const lastResult = appState.recognition.allResults[appState.recognition.allResults.length - 1];
                recognizedText = lastResult.transcript.trim();
                console.log('Using last result as final:', recognizedText);
            }
        }
        
        // 여전히 비어있으면 화면에 표시된 텍스트 사용 (iOS Safari 대비책)
        if (!recognizedText) {
            const lastDisplayText = originalTextEl.textContent;
            if (lastDisplayText && lastDisplayText !== "..." && lastDisplayText.trim().length > 0) {
                console.log('Using displayed text as final:', lastDisplayText);
                recognizedText = lastDisplayText.trim();
            }
        }
        
        console.log('Final recognized text:', recognizedText);
        
        handleRecognitionEnd(recognizedText, direction, elements);
    };

    appState.recognition.instance.onerror = (event) => {
        console.error('Speech recognition error:', event);
        
        if (appState.recognition.silenceTimer) {
            clearTimeout(appState.recognition.silenceTimer);
            appState.recognition.silenceTimer = null;
        }

        if (event.error === 'not-allowed') {
            console.log('Microphone permission denied');
            alert(t('error_mic_perm'));
        } else if (event.error === 'no-speech') {
            console.log('No speech detected');
            // iOS Safari에서 우크라이나어 음성 인식 문제 해결
            let recognizedText = '';
            
            // 먼저 저장된 최종 결과 확인
            if (appState.recognition.finalTranscript) {
                recognizedText = appState.recognition.finalTranscript.trim();
                console.log('Using stored final transcript:', recognizedText);
            }
            
            // iOS Safari에서 우크라이나어의 경우 모든 결과 확인
            if (!recognizedText && (isSafari || isIOS) && !isKorean) {
                if (appState.recognition.allResults.length > 0) {
                    const lastResult = appState.recognition.allResults[appState.recognition.allResults.length - 1];
                    recognizedText = lastResult.transcript.trim();
                    console.log('iOS Safari Ukrainian: Using last result from allResults:', recognizedText);
                }
            }
            
            // 여전히 없으면 화면에 표시된 텍스트 사용
            if (!recognizedText) {
                const lastText = originalTextEl.textContent;
                if (lastText && lastText !== "..." && lastText.trim().length > 0) {
                    console.log('Using last displayed text:', lastText);
                    recognizedText = lastText.trim();
                }
            }
            
            if (recognizedText) {
                handleRecognitionEnd(recognizedText, direction, elements);
                return;
            }
        } else if (event.error === 'network') {
            console.log('Network error during speech recognition');
        } else {
            console.log('Other speech recognition error:', event.error);
        }

        clearRecognitionUI(true);
    };

    appState.recognition.instance.start();
}

function startVoiceInput(direction) {
    console.log('startVoiceInput called:', { direction, isSafari });

    if (!SpeechRecognition) {
        console.log('SpeechRecognition not supported');
        alert(t('alert_no_speech'));
        return;
    }

    // 사파리에서 우크라이나어 지원 확인
    if (isSafari && direction === 'uk-ko') {
        console.log('Safari Ukrainian recognition - checking support');
        // 사파리에서 우크라이나어 지원 여부를 미리 확인
        const testRecognition = new SpeechRecognition();
        testRecognition.lang = 'uk-UA';
        testRecognition.onerror = (event) => {
            console.log('Safari Ukrainian test error:', event.error);
            if (event.error === 'language-not-supported') {
                alert('사파리에서는 우크라이나어 음성 인식이 제한적으로 지원됩니다. Chrome 또는 Edge 브라우저 사용을 권장합니다.');
                return;
            }
        };
        testRecognition.onstart = () => {
            console.log('Safari Ukrainian test started successfully');
            testRecognition.stop();
        };
        testRecognition.start();
    }

    stopSpeaking();

    if (appState.recognition.instance) {
        const activeDirection = appState.recognition.instance.lang.startsWith('ko') ? 'ko-uk' : 'uk-ko';

        if (activeDirection === direction) {
            console.log('Stopping current recognition');
            appState.recognition.instance.stop();
            return;
        }

        appState.recognition.instance.stop();
        clearRecognitionUI(true);
    }

    startNewRecognition(direction);
}

modeMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleDropdown(modeDropdown, modeMenuButton);
});

langMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleDropdown(langDropdown, langMenuButton);
});

document.addEventListener('click', (event) => {
    const isClickInsideLang = langDropdown.contains(event.target) || langMenuButton.contains(event.target);
    const isClickInsideMode = modeDropdown.contains(event.target) || modeMenuButton.contains(event.target);

    if (langDropdown.classList.contains('show') && !isClickInsideLang) {
        langDropdown.classList.remove('show');
        langMenuButton.setAttribute('aria-expanded', 'false');
    }
    if (modeDropdown.classList.contains('show') && !isClickInsideMode) {
        modeDropdown.classList.remove('show');
        modeMenuButton.setAttribute('aria-expanded', 'false');
    }
});

micKo.addEventListener('click', () => {
    startVoiceInput('ko-uk');
});

micUk.addEventListener('click', () => {
    startVoiceInput('uk-ko');
});

window.speechSynthesis.onvoiceschanged = () => {
    availableVoices = window.speechSynthesis.getVoices();
};

// 페이지 언로드 시 모든 리소스 정리
window.addEventListener('beforeunload', () => {
    cleanupAllTimers();
    cleanupAllEventListeners();
    stopSpeaking();
    clearRecognitionUI(true);
    
    // SpeechSynthesis 정리
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    // 메모리 정리 강제 실행
    if (window.gc) {
        window.gc();
    }
});

// 채팅 메시지 수 제한으로 메모리 사용량 관리
const MAX_CHAT_MESSAGES = 50;

function limitChatMessages() {
    const messages = chatContainer.querySelectorAll('.message');
    if (messages.length > MAX_CHAT_MESSAGES) {
        const messagesToRemove = messages.length - MAX_CHAT_MESSAGES;
        for (let i = 0; i < messagesToRemove; i++) {
            const messageEl = messages[i];
            // WeakMap에서 참조 제거
            appState.elementRefs.delete(messageEl);
            cleanupElement(messageEl);
        }
    }
}

// 메모리 사용량 모니터링 및 자동 정리
if (performance.memory) {
    setInterval(() => {
        const memory = performance.memory;
        const memoryUsagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (memoryUsagePercent > 0.8) {
            console.warn('메모리 사용량이 높습니다:', {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
                usage: Math.round(memoryUsagePercent * 100) + '%'
            });
            
            // 메모리 사용량이 높을 때 채팅 메시지 정리
            limitChatMessages();
            
            // 가비지 컬렉션 강제 실행 (가능한 경우)
            if (window.gc) {
                window.gc();
            }
        }
    }, 30000); // 30초마다 체크
}

// 사파리 디버깅 정보 표시
if (isSafari) {
    console.log('Safari-specific debugging enabled');
    console.log('Available speech recognition languages:', navigator.languages);
    
    // 사파리에서 지원하는 언어 확인
    if (SpeechRecognition) {
        const testRecognition = new SpeechRecognition();
        console.log('SpeechRecognition properties:', {
            lang: testRecognition.lang,
            continuous: testRecognition.continuous,
            interimResults: testRecognition.interimResults,
            maxAlternatives: testRecognition.maxAlternatives
        });
    }
}

updateUI();