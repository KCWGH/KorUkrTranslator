package com.ai.translator.service;

import java.util.Collections;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.ai.translator.config.TranslatorProperties;
import com.ai.translator.dto.GeminiRequestDTO;
import com.ai.translator.dto.GeminiResponseDTO;
import com.ai.translator.dto.GoogleTranslateRequestDTO;
import com.ai.translator.dto.GoogleTranslateResponseDTO;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class TranslationService {

    private final WebClient webClient;
    private final TranslatorProperties properties;

    public Mono<String> translate(String sourceText, TranslationMode mode, TranslationDirection direction) {
        // 텍스트 전처리
        String processedText = preprocessText(sourceText);
        
        return switch (mode) {
            case ACCURATE -> translateWithGemini(processedText, direction);
            case FAST -> translateWithGoogleTranslate(processedText, direction);
        };
    }
    
    /**
     * 번역을 위한 텍스트 전처리
     * - 줄바꿈 문자 정규화
     * - 연속된 공백 제거
     * - 앞뒤 공백 제거
     */
    private String preprocessText(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        
        return text
            .trim()                           // 앞뒤 공백 제거
            .replaceAll("\\r\\n|\\r", "\\n")  // 윈도우/맥 줄바꿈을 유닉스 형식으로 통일
            .replaceAll("\\n+", "\\n")        // 연속된 줄바꿈을 하나로 축약
            .replaceAll("[ \\t]+", " ");      // 연속된 공백/탭을 하나의 공백으로 축약
    }

    // --- Gemini 번역 ---
    private Mono<String> translateWithGemini(String sourceText, TranslationDirection direction) {
        // 입력 텍스트 길이 제한으로 메모리 보호
        if (sourceText.length() > 10000) {
            return Mono.error(new TranslationException("입력 텍스트가 너무 깁니다. 최대 10,000자를 지원합니다."));
        }

        String prompt = direction.getGeminiPrompt(sourceText);

        GeminiRequestDTO.Part part = new GeminiRequestDTO.Part(prompt);
        GeminiRequestDTO.Content content = new GeminiRequestDTO.Content(Collections.singletonList(part));
        GeminiRequestDTO requestDTO = new GeminiRequestDTO(Collections.singletonList(content));

        String url = properties.gemini().endpoint() + "?key=" + properties.gemini().apiKey();

        return webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestDTO)
                .retrieve()
                .bodyToMono(GeminiResponseDTO.class)
                .map(this::extractGeminiTranslatedText)
                .doOnNext(result -> {
                    // 결과 텍스트 길이 검증
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

    // --- Google Translate 번역 ---
    private Mono<String> translateWithGoogleTranslate(String sourceText, TranslationDirection direction) {
        // 입력 텍스트 길이 제한으로 메모리 보호
        if (sourceText.length() > 10000) {
            return Mono.error(new TranslationException("입력 텍스트가 너무 깁니다. 최대 10,000자를 지원합니다."));
        }

        GoogleTranslateRequestDTO requestDTO = new GoogleTranslateRequestDTO(
                sourceText,
                direction.getSourceLang(),
                direction.getTargetLang(),
                "text"
        );

        String url = properties.googleTranslate().endpoint() + "?key=" + properties.googleTranslate().apiKey();

        return webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestDTO)
                .retrieve()
                .bodyToMono(GoogleTranslateResponseDTO.class)
                .map(this::extractGoogleTranslatedText)
                .doOnNext(result -> {
                    // 결과 텍스트 길이 검증
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

    // --- 번역 모드 Enum ---
    public enum TranslationMode {
        ACCURATE, FAST
    }

    // --- 번역 방향 Enum ---
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

    // --- 커스텀 예외 ---
    public static class TranslationException extends RuntimeException {

        private static final long serialVersionUID = 1L; // ← serialVersionUID 추가

        public TranslationException(String message) {
            super(message);
        }

        public TranslationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
