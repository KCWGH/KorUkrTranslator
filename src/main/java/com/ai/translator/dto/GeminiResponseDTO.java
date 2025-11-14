package com.ai.translator.dto;

import java.util.List;
import java.util.Optional;

import lombok.Data;

@Data
public class GeminiResponseDTO {
    private List<Candidate> candidates;

    public Optional<String> getTranslatedText() {
        return Optional.ofNullable(this.candidates)
                .flatMap(list -> list.stream().findFirst())
                .map(Candidate::getContent)
                .flatMap(content -> Optional.ofNullable(content.parts))
                .flatMap(list -> list.stream().findFirst())
                .map(Part::getText);
    }

    @Data
    public static class Candidate {
        private Content content;
    }

    @Data
    public static class Content {
        private List<Part> parts;
    }

    @Data
    public static class Part {
        private String text;
    }
}