package com.ai.translator.dto;

import java.util.List;
import java.util.Optional;

import lombok.Data;

@Data
public class GoogleTranslateResponseDTO {
    private TranslationData data;
    
    public Optional<String> getTranslatedText() {
        return Optional.ofNullable(this.data)
                .flatMap(d -> Optional.ofNullable(d.translations))
                .flatMap(list -> list.stream().findFirst())
                .map(Translation::getTranslatedText);
    }

    @Data
    public static class TranslationData {
        private List<Translation> translations;
    }

    @Data
    public static class Translation {
        private String translatedText;
        private String detectedSourceLanguage;
    }
}