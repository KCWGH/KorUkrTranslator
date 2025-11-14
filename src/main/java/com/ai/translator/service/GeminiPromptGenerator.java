package com.ai.translator.service;

import org.springframework.stereotype.Component;

import com.ai.translator.service.TranslationService.TranslationDirection;

@Component
public class GeminiPromptGenerator {

    /**
     * 주어진 텍스트와 번역 방향에 맞춰 Gemini 모델에 전달할 프롬프트를 생성합니다.
     * * @param text 원본 텍스트
     * @param direction 번역 방향 (예: KO_UK)
     * @return 생성된 프롬프트 문자열
     */
    public String generatePrompt(String text, TranslationDirection direction) {
        if (direction == TranslationDirection.KO_UK) {
            return "Translate the following Korean sentence into Ukrainian.\n\n" +
                   "Assume that the speaker is male and the listener is female. " +
                   "Reflect gender-specific forms in the translation if applicable.\n" +
                   "Only provide the translated sentence without any explanation.\n\n" +
                   "Korean text to translate:\n" + text;
        } else if (direction == TranslationDirection.UK_KO) {
            return "Translate the following Ukrainian sentence into Korean.\n\n" +
                   "Only provide the translated sentence without any explanation.\n\n" +
                   "Ukrainian text to translate:\n" + text;
        }
        
        // 지원하지 않는 번역 방향에 대한 예외 처리
        throw new UnsupportedOperationException("Unsupported translation direction for Gemini: " + direction);
    }
}