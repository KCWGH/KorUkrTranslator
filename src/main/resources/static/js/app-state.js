// Application State
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

