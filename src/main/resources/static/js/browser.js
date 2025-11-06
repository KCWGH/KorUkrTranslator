// Browser detection
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isMacOS = /Mac OS X/.test(navigator.userAgent);

console.log('Browser detection:', {
    userAgent: navigator.userAgent,
    isSafari,
    isIOS,
    isMacOS,
    speechRecognitionSupported: !!SpeechRecognition
});

