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

    const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        } else if (node.nodeName === 'BR') {
            text += '\n';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('clear-text-button')) {
                return;
            }

            const isBlock = ['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName);

            if (isBlock && text && !text.endsWith('\n')) {
                text += '\n';
            }

            node.childNodes.forEach(walk);

            if (isBlock && text && !text.endsWith('\n')) {
                text += '\n';
            }
        }
    };

    walk(element);
    return text.trim();
};

const normalizeTextForTranslation = (text) => {
    return text.replace(/[ \t]+/g, ' ').trim();
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
