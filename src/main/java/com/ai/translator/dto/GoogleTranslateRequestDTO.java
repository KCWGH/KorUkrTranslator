package com.ai.translator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleTranslateRequestDTO {
    private String q; // The text to translate
    private String source; // Source language code (e.g., "ko")
    private String target; // Target language code (e.g., "uk")
    private String format = "text"; // "text" or "html"
}