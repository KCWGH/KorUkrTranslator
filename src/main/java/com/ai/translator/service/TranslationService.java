package com.ai.translator.service;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.ai.translator.dto.GeminiRequestDTO;
import com.ai.translator.dto.GeminiResponseDTO;
import com.ai.translator.dto.GoogleTranslateRequestDTO;
import com.ai.translator.dto.GoogleTranslateResponseDTO;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class TranslationService {

    @Qualifier("geminiWebClient")
    private final WebClient geminiWebClient;

    @Qualifier("googleTranslateWebClient")
    private final WebClient googleTranslateWebClient;

    public Mono<String> translate(String sourceText, TranslationMode mode, TranslationDirection direction) {
        String processedText = preprocessText(sourceText);

        return switch (mode) {
            case ACCURATE -> translateWithGemini(processedText, direction);
            case FAST -> translateWithGoogleTranslate(processedText, direction);
        };
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

    private Mono<String> translateWithGemini(String sourceText, TranslationDirection direction) {
        if (sourceText.length() > 10000) {
            return Mono.error(new TranslationException("입력 텍스트가 너무 깁니다. 최대 10,000자를 지원합니다."));
        }

        String prompt = direction.getGeminiPrompt(sourceText);

        GeminiRequestDTO.Part part = new GeminiRequestDTO.Part(prompt);
        GeminiRequestDTO.Content content = new GeminiRequestDTO.Content(Collections.singletonList(part));
        GeminiRequestDTO requestDTO = new GeminiRequestDTO(Collections.singletonList(content));

        String uriPath = "";

        return geminiWebClient.post()
            .uri(uriPath)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestDTO)
            .retrieve()
            .bodyToMono(GeminiResponseDTO.class)
            .map(this::extractGeminiTranslatedText)
            .doOnNext(result -> {
                if (result.length() > 20000) {
                    throw new TranslationException("번역 결과가 너무 깁니다.");
                }
            })
            .onErrorMap(WebClientResponseException.class,
                e -> new TranslationException("Gemini 번역 실패: HTTP " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e));
    }

    private String extractGeminiTranslatedText(GeminiResponseDTO response) {
        return response.getCandidates().stream().findFirst()
            .map(GeminiResponseDTO.Candidate::getContent)
            .flatMap(c -> c.getParts().stream().findFirst())
            .map(GeminiResponseDTO.Part::getText)
            .orElseThrow(() -> new TranslationException("Gemini 응답에서 번역된 텍스트를 찾을 수 없습니다."));
    }

    private Mono<String> translateWithGoogleTranslate(String sourceText, TranslationDirection direction) {
        if (sourceText.length() > 10000) {
            return Mono.error(new TranslationException("입력 텍스트가 너무 깁니다. 최대 10,000자를 지원합니다."));
        }

        GoogleTranslateRequestDTO requestDTO = new GoogleTranslateRequestDTO(
            sourceText,
            direction.getSourceLang(),
            direction.getTargetLang(),
            "text"
        );

        String uriPath = "";

        return googleTranslateWebClient.post()
            .uri(uriPath)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestDTO)
            .retrieve()
            .bodyToMono(GoogleTranslateResponseDTO.class)
            .map(this::extractGoogleTranslatedText)
            .doOnNext(result -> {
                if (result.length() > 20000) {
                    throw new TranslationException("번역 결과가 너무 깁니다.");
                }
            })
            .onErrorMap(WebClientResponseException.class,
                e -> new TranslationException("Google Translate 번역 실패: HTTP " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e));
    }

    private String extractGoogleTranslatedText(GoogleTranslateResponseDTO response) {
        return response.getData().getTranslations().stream().findFirst()
            .map(GoogleTranslateResponseDTO.Translation::getTranslatedText)
            .orElseThrow(() -> new TranslationException("Google Translate 응답에서 번역된 텍스트를 찾을 수 없습니다."));
    }

    public enum TranslationMode {
        ACCURATE, FAST
    }

    public enum TranslationDirection {
        KO_UK("ko", "uk") {
            @Override
            public String getGeminiPrompt(String text) {
                return "Translate the following Korean sentence into Ukrainian.\n\n" +
                        "Assume that the speaker is male and the listener is female. " +
                        "Reflect gender-specific forms in the translation if applicable.\n" +
                        "Only provide the translated sentence without any explanation.\n\n" +
                        "Korean text to translate:\n" + text;
            }
        },
        UK_KO("uk", "ko") {
            @Override
            public String getGeminiPrompt(String text) {
                return "Translate the following Ukrainian sentence into Korean.\n\n" +
                        "Only provide the translated sentence without any explanation.\n\n" +
                        "Ukrainian text to translate:\n" + text;
            }
        };

        private final String sourceLang;
        private final String targetLang;

        TranslationDirection(String sourceLang, String targetLang) {
            this.sourceLang = sourceLang;
            this.targetLang = targetLang;
        }

        public String getSourceLang() {
            return sourceLang;
        }

        public String getTargetLang() {
            return targetLang;
        }

        public abstract String getGeminiPrompt(String text);
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