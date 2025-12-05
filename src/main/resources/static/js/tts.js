function resetSpeakerButtonState() {
    const t = getTranslationFunction();
    if (appState.tts.speakingButton) {
        const prevImg = appState.tts.speakingButton.querySelector('img');
        prevImg.src = ICON_PLAY_URL;
        prevImg.alt = t('tts_play_title');
        appState.tts.speakingButton.title = t('tts_play_title');
        appState.tts.speakingButton.classList.remove('stop');
        appState.tts.speakingButton.classList.add('play');
        appState.tts.speakingButton = null;

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

function speakText(text, langCode, buttonEl) {
    if (!('speechSynthesis' in window)) return;
    const t = getTranslationFunction();

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
    const t = getTranslationFunction();
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
