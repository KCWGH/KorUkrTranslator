function startTranslationLoading(translationEl) {
    stopTranslationLoading();
    const t = getTranslationFunction();

    const baseText = t('status_wait_trans_base');
    let dotCount = 0;

    translationEl.textContent = baseText + '...';
    translationEl.classList.add('is-loading');

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

async function processTranslation(text, direction, messageEl, originalTextEl, translationEl) {
    const t = getTranslationFunction();

    stopSpeaking();
    startTranslationLoading(translationEl);

    const oldSpeakerButton = messageEl.querySelector('.speaker-button');
    if (oldSpeakerButton) oldSpeakerButton.remove();

    const normalizedText = normalizeTextForTranslation(text);

    const requestData = {
        text: normalizedText,
        direction: direction,
        mode: appState.currentMode
    };

    const url = API_URL;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(requestData)
        });

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

function addCopyListener(translationEl) {
    const t = getTranslationFunction();
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

function addEditListeners(originalTextEl, initialText, direction, messageEl, translationEl) {
    const t = getTranslationFunction();

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
                return;
            } else {
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

function addMessage(text, direction, translatedText, isError = false, isExample = false) {
    const t = getTranslationFunction();
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

function limitChatMessages() {
    const messages = chatContainer.querySelectorAll('.message');
    if (messages.length > MAX_CHAT_MESSAGES) {
        const messagesToRemove = messages.length - MAX_CHAT_MESSAGES;
        for (let i = 0; i < messagesToRemove; i++) {
            const messageEl = messages[i];
            cleanupElement(messageEl);
        }
    }
}