// Main Application Initialization
function initializeApp() {
    const t = (key) => i18n[appState.currentLang][key] || key;
    setTranslationFunction(t);

    window.speechSynthesis.onvoiceschanged = () => {
        availableVoices = window.speechSynthesis.getVoices();
    };

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

    window.addEventListener('beforeunload', () => {
        cleanupAllTimers();
        stopSpeaking();
        clearRecognitionUI(true);

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    });

    updateUI();
}