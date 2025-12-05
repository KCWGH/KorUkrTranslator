package com.ai.translator.model;

public enum TranslationDirection {
    KO_UK("ko", "uk"),
    UK_KO("uk", "ko");

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
}
