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
    let text = '';

    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        } else if (node.nodeName === 'BR') {
            text += '\n';
        } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
            if (text && !text.endsWith('\n')) {
                text += '\n';
            }
            text += node.textContent;
        }
    }

    return text.trim();
};

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

const cleanupElement = (element) => {
    if (element && element.parentNode) {
        const allElements = element.querySelectorAll('*');
        allElements.forEach(el => {
            const clonedEl = el.cloneNode(true);
            el.parentNode.replaceChild(clonedEl, el);
        });
        element.remove();
    }
};

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
