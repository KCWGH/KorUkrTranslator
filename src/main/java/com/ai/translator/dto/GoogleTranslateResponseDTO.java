package com.ai.translator.dto;

import lombok.Data;
import java.util.List;

@Data
public class GoogleTranslateResponseDTO {
    // Rename 'Data' to 'TranslationData' or something similar
    private TranslationData data; // Changed from private Data data;

    @Data
    // Rename the nested class
    public static class TranslationData { // Changed from public static class Data {
        private List<Translation> translations;
    }

    @Data
    public static class Translation {
        private String translatedText;
        private String detectedSourceLanguage;
    }
}