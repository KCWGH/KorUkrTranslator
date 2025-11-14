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
import com.ai.translator.service.TranslationService.TranslationDirection;
import com.ai.translator.service.TranslationService.TranslationException;
import com.ai.translator.service.TranslationService.TranslationMode;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class GeminiTranslator implements Translator {

    @Qualifier("geminiWebClient")
    private final WebClient geminiWebClient;

    private final GeminiPromptGenerator promptGenerator;
    
    private final TranslatorProperties properties;

    @Override
    public TranslationMode getMode() {
        return TranslationMode.ACCURATE;
    }

    @Override
    public Mono<String> translate(String sourceText, TranslationDirection direction) {
        String prompt = promptGenerator.generatePrompt(sourceText, direction);

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
                e -> new TranslationException("Gemini 번역 실패: HTTP " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e));
    }

    private String extractTranslatedText(GeminiResponseDTO response) {
        return response.getTranslatedText()
            .orElseThrow(() -> new TranslationException("Gemini 응답에서 번역된 텍스트를 찾을 수 없습니다."));
    }
}