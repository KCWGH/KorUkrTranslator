// Speech Recognition Functions
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
    const t = getTranslationFunction();
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
        const t = getTranslationFunction();
        
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
    const t = getTranslationFunction();

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

