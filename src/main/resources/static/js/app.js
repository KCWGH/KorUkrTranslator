// Main Application Initialization
function initializeApp() {
    // Initialize translation function
    const t = (key) => i18n[appState.currentLang][key] || key;
    setTranslationFunction(t);
    
    // Initialize speech synthesis voices
    window.speechSynthesis.onvoiceschanged = () => {
        availableVoices = window.speechSynthesis.getVoices();
    };

    // Event Listeners
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

    // 페이지 언로드 시 모든 리소스 정리
    window.addEventListener('beforeunload', () => {
        cleanupAllTimers();
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

    // 메모리 사용량 모니터링 및 자동 정리
    if (performance.memory) {
        setInterval(() => {
            const memory = performance.memory;
            const memoryUsagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            
            if (memoryUsagePercent > 0.8) {
                // 메모리 사용량이 높을 때 채팅 메시지 정리
                limitChatMessages();
                
                // 가비지 컬렉션 강제 실행 (가능한 경우)
                if (window.gc) {
                    window.gc();
                }
            }
        }, 30000); // 30초마다 체크
    }

    // Initialize UI
    updateUI();
}