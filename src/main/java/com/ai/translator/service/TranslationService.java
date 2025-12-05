package com.ai.translator.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ai.translator.model.TranslationDirection;
import com.ai.translator.model.TranslationMode;

import reactor.core.publisher.Mono;

@Service
public class TranslationService {

    private final Map<TranslationMode, Translator> translators;
    private static final int MAX_INPUT_LENGTH = 10000;
    private static final int MAX_OUTPUT_LENGTH = 20000;

    public TranslationService(List<Translator> translatorList) {
        this.translators = translatorList.stream()
                .collect(Collectors.toMap(Translator::getMode, Function.identity()));
    }

    public Mono<String> translate(String sourceText, TranslationMode mode, TranslationDirection direction) {
        String processedText = preprocessText(sourceText);

        if (processedText.length() > MAX_INPUT_LENGTH) {
            return Mono.error(new TranslationException("입력 텍스트가 너무 깁니다. 최대 " + MAX_INPUT_LENGTH + "자를 지원합니다."));
        }

        Translator translator = translators.get(mode);
        if (translator == null) {
            return Mono.error(new IllegalArgumentException("Unsupported translation mode: " + mode));
        }

        return translator.translate(processedText, direction)
                .flatMap(this::validateTranslationResult);
    }

    private String preprocessText(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        return text
                .trim()
                .replaceAll("\\r\\n|\\r", "\\n")
                .replaceAll("\\n+", "\\n")
                .replaceAll("[ \\t]+", " ");
    }

    private Mono<String> validateTranslationResult(String result) {
        if (result.length() > MAX_OUTPUT_LENGTH) {
            return Mono.error(new TranslationException("번역 결과가 너무 깁니다. 최대 " + MAX_OUTPUT_LENGTH + "자를 초과했습니다."));
        }
        return Mono.just(result);
    }

    public static class TranslationException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public TranslationException(String message) {
            super(message);
        }

        public TranslationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}