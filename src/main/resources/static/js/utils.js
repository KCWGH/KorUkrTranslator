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

const measureTextWidth = (text, fontSize) => {
    _textMeasureSpan.textContent = text;
    _textMeasureSpan.style.fontSize = fontSize + 'em';
    return _textMeasureSpan.offsetWidth;
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

// 메모리 누수 방지를 위한 이벤트 리스너 관리 유틸리티 (현재는 사용하지 않지만 호환성을 위해 유지)
function cleanupAllEventListeners() {
    // 이 함수는 현재 사용되지 않지만 app.js에서 호출되므로 호환성을 위해 유지
    if (appState.eventListeners) {
        appState.eventListeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        appState.eventListeners.clear();
    }
}

