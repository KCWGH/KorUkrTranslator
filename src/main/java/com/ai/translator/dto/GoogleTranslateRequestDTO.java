package com.ai.translator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleTranslateRequestDTO {
    private String q;
    private String source;
    private String target;
    private String format = "text";
}