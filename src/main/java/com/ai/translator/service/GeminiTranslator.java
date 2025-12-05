package com.ai.translator.service;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.ai.translator.config.TranslatorProperties;
import com.ai.translator.dto.GeminiRequestDTO;
import com.ai.translator.dto.GeminiResponseDTO;
import com.ai.translator.model.TranslationDirection;
import com.ai.translator.model.TranslationMode;
import com.ai.translator.service.TranslationService.TranslationException;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class GeminiTranslator implements Translator {

    @Qualifier("geminiWebClient")
    private final WebClient geminiWebClient;

    private final TranslatorProperties properties;

    @Override
    public TranslationMode getMode() {
        return TranslationMode.ACCURATE;
    }

    @Override
    public Mono<String> translate(String sourceText, TranslationDirection direction) {
        String prompt = generatePrompt(sourceText, direction);

        GeminiRequestDTO.Part part = new GeminiRequestDTO.Part(prompt);
        GeminiRequestDTO.Content content = new GeminiRequestDTO.Content(Collections.singletonList(part));
        GeminiRequestDTO requestDTO = new GeminiRequestDTO(Collections.singletonList(content));

        return geminiWebClient.post()
                .uri(properties.gemini().endpoint())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestDTO)
                .retrieve()
                .bodyToMono(GeminiResponseDTO.class)
                .map(this::extractTranslatedText)
                .onErrorMap(WebClientResponseException.class,
                        e -> new TranslationException(
                                "Gemini 번역 실패: HTTP " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e));
    }

    private String extractTranslatedText(GeminiResponseDTO response) {
        return response.getTranslatedText()
                .orElseThrow(() -> new TranslationException("Gemini 응답에서 번역된 텍스트를 찾을 수 없습니다."));
    }

    private String generatePrompt(String text, TranslationDirection direction) {
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