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
        finalTranscript: '',
        allResults: [],
    }
};

let availableVoices = [];
