package com.ai.translator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "translator")
public record TranslatorProperties(
    ApiConfig gemini,
    ApiConfig googleTranslate
) {
    public record ApiConfig(
        String apiKey,
        String endpoint
    ) {}
}