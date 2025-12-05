function setMicButtonState(micButton, isActive, isRecording = false) {
    const t = getTranslationFunction();
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
    appState.recognition.finalTranscript = '';
    appState.recognition.allResults = [];
}

function handleRecognitionEnd(recognizedText, direction, elements) {
    const t = getTranslationFunction();
    const { messageEl, originalTextEl, translationEl } = elements;

    if (recognizedText && recognizedText.trim().length > 0) {
        originalTextEl.textContent = recognizedText;
        originalTextEl.classList.remove('is-live-text');

        processTranslation(recognizedText, direction, messageEl, originalTextEl, translationEl);

        originalTextEl.setAttribute('contenteditable', 'false');
        originalTextEl.title = t('edit_tip');
        originalTextEl.setAttribute('data-initial-text', recognizedText);

        addEditListeners(originalTextEl, recognizedText, direction, messageEl, translationEl);
        addCopyListener(translationEl);

        clearRecognitionUI(false);
    } else if (appState.recognition.liveMessageElements) {
        clearRecognitionUI(true);
    }
}

function startNewRecognition(direction) {
    const isKorean = direction === 'ko-uk';
    const langCode = isKorean ? LOCALE_KO : LOCALE_UK;

    const activeMicButton = isKorean ? micKo : micUk;
    const inactiveMicButton = isKorean ? micUk : micKo;

    appState.recognition.liveMessageElements = createLiveMessage(direction);
    const elements = appState.recognition.liveMessageElements;
    const { originalTextEl } = elements;

    appState.recognition.instance = new SpeechRecognition();

    if (isSafari && !isKorean) {
        appState.recognition.instance.lang = 'uk-UA';
    } else {
        appState.recognition.instance.lang = langCode;
    }

    appState.recognition.instance.continuous = false;
    appState.recognition.instance.interimResults = true;

    if (isSafari) {
        appState.recognition.instance.maxAlternatives = 1;
        SILENCE_TIMEOUT = 3000;
    }

    setMicButtonState(activeMicButton, false, true);
    setMicButtonState(inactiveMicButton, false, false);

    const resetSilenceTimer = () => {
        if (appState.recognition.silenceTimer) {
            clearTimeout(appState.recognition.silenceTimer);
            appState.recognition.silenceTimer = null;
        }

        appState.recognition.silenceTimer = setTimeout(() => {
            if (appState.recognition.instance) {
                appState.recognition.instance.stop();
            }
            appState.recognition.silenceTimer = null;
        }, SILENCE_TIMEOUT);
    };

    appState.recognition.finalTranscript = '';
    appState.recognition.allResults = [];

    appState.recognition.instance.onstart = () => {
        appState.recognition.finalTranscript = '';
        appState.recognition.allResults = [];
        resetSilenceTimer();
    };

    appState.recognition.instance.onresult = (event) => {
        resetSilenceTimer();

        let interimTranscript = '';
        let currentFinalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const isFinal = event.results[i].isFinal;

            appState.recognition.allResults.push({
                transcript: transcript,
                isFinal: isFinal,
                index: i
            });

            if (isFinal) {
                currentFinalTranscript += transcript;
                appState.recognition.finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        const displayText = (appState.recognition.finalTranscript + interimTranscript).trim() || "...";

        originalTextEl.textContent = displayText;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    appState.recognition.instance.onend = () => {
        if (appState.recognition.silenceTimer) {
            clearTimeout(appState.recognition.silenceTimer);
            appState.recognition.silenceTimer = null;
        }

        if (!appState.recognition.instance) {
            return;
        }

        let recognizedText = appState.recognition.finalTranscript.trim();

        if ((isSafari || isIOS) && !isKorean && !recognizedText) {
            if (appState.recognition.allResults.length > 0) {
                const lastResult = appState.recognition.allResults[appState.recognition.allResults.length - 1];
                recognizedText = lastResult.transcript.trim();
            }
        }

        if (!recognizedText) {
            const lastDisplayText = originalTextEl.textContent;
            if (lastDisplayText && lastDisplayText !== "..." && lastDisplayText.trim().length > 0) {
                recognizedText = lastDisplayText.trim();
            }
        }

        handleRecognitionEnd(recognizedText, direction, elements);
    };

    appState.recognition.instance.onerror = (event) => {
        const t = getTranslationFunction();

        if (appState.recognition.silenceTimer) {
            clearTimeout(appState.recognition.silenceTimer);
            appState.recognition.silenceTimer = null;
        }

        if (event.error === 'not-allowed') {
            alert(t('error_mic_perm'));
        } else if (event.error === 'no-speech') {
            let recognizedText = '';

            if (appState.recognition.finalTranscript) {
                recognizedText = appState.recognition.finalTranscript.trim();
            }

            if (!recognizedText && (isSafari || isIOS) && !isKorean) {
                if (appState.recognition.allResults.length > 0) {
                    const lastResult = appState.recognition.allResults[appState.recognition.allResults.length - 1];
                    recognizedText = lastResult.transcript.trim();
                }
            }

            if (!recognizedText) {
                const lastText = originalTextEl.textContent;
                if (lastText && lastText !== "..." && lastText.trim().length > 0) {
                    recognizedText = lastText.trim();
                }
            }

            if (recognizedText) {
                handleRecognitionEnd(recognizedText, direction, elements);
                return;
            }
        }

        clearRecognitionUI(true);
    };

    appState.recognition.instance.start();
}

function startVoiceInput(direction) {
    const t = getTranslationFunction();

    if (!SpeechRecognition) {
        alert(t('alert_no_speech'));
        return;
    }

    if (isSafari && direction === 'uk-ko') {
        const testRecognition = new SpeechRecognition();
        testRecognition.lang = 'uk-UA';
        testRecognition.onerror = (event) => {
            if (event.error === 'language-not-supported') {
                alert('사파리에서는 우크라이나어 음성 인식이 제한적으로 지원됩니다. Chrome 또는 Edge 브라우저 사용을 권장합니다.');
                return;
            }
        };
        testRecognition.onstart = () => {
            testRecognition.stop();
        };
        testRecognition.start();
    }

    stopSpeaking();

    if (appState.recognition.instance) {
        const activeDirection = appState.recognition.instance.lang.startsWith('ko') ? 'ko-uk' : 'uk-ko';

        if (activeDirection === direction) {
            appState.recognition.instance.stop();
            return;
        }

        appState.recognition.instance.stop();
        clearRecognitionUI(true);
    }

    startNewRecognition(direction);
}