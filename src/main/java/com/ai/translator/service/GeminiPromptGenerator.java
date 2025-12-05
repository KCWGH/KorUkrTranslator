package com.ai.translator.service;

import org.springframework.stereotype.Component;

import com.ai.translator.service.TranslationService.TranslationDirection;

@Component
public class GeminiPromptGenerator {

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

        throw new UnsupportedOperationException("Unsupported translation direction for Gemini: " + direction);
    }
}