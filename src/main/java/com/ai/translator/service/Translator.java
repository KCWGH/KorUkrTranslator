package com.ai.translator.service;

import com.ai.translator.service.TranslationService.TranslationDirection;
import com.ai.translator.service.TranslationService.TranslationMode;

import reactor.core.publisher.Mono;

public interface Translator {
    Mono<String> translate(String sourceText, TranslationDirection direction);
    TranslationMode getMode();
}