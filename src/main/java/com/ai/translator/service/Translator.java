package com.ai.translator.service;

import com.ai.translator.model.TranslationDirection;
import com.ai.translator.model.TranslationMode;

import reactor.core.publisher.Mono;

public interface Translator {
    TranslationMode getMode();

    Mono<String> translate(String sourceText, TranslationDirection direction);
}