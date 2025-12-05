package com.ai.translator.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.ai.translator.config.TranslatorProperties;
import com.ai.translator.dto.GoogleTranslateRequestDTO;
import com.ai.translator.dto.GoogleTranslateResponseDTO;
import com.ai.translator.model.TranslationDirection;
import com.ai.translator.model.TranslationMode;
import com.ai.translator.service.TranslationService.TranslationException;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class GoogleTranslator implements Translator {

    @Qualifier("googleTranslateWebClient")
    private final WebClient googleTranslateWebClient;

    private final TranslatorProperties properties;

    @Override
    public TranslationMode getMode() {
        return TranslationMode.FAST;
    }

    @Override
    public Mono<String> translate(String sourceText, TranslationDirection direction) {
        GoogleTranslateRequestDTO requestDTO = new GoogleTranslateRequestDTO(
                sourceText,
                direction.getSourceLang(),
                direction.getTargetLang(),
                "text");

        return googleTranslateWebClient.post()
                .uri(properties.googleTranslate().endpoint())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestDTO)
                .retrieve()
                .bodyToMono(GoogleTranslateResponseDTO.class)
                .map(this::extractTranslatedText)
                .onErrorMap(WebClientResponseException.class,
                        e -> new TranslationException("Google Translate 번역 실패: HTTP " + e.getStatusCode() + " - "
                                + e.getResponseBodyAsString(), e));
    }

    private String extractTranslatedText(GoogleTranslateResponseDTO response) {
        return response.getTranslatedText()
                .orElseThrow(() -> new TranslationException("Google Translate 응답에서 번역된 텍스트를 찾을 수 없습니다."));
    }
}