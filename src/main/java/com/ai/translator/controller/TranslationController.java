package com.ai.translator.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ai.translator.service.TranslationService;
import com.ai.translator.service.TranslationService.TranslationDirection;
import com.ai.translator.service.TranslationService.TranslationMode;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/translate")
@RequiredArgsConstructor
public class TranslationController {

    private final TranslationService translationService;

    @PostMapping
    public Mono<String> translateText(@RequestBody TranslationRequest request) {
        // 텍스트 전처리: null 체크, 공백 제거, 빈 텍스트 검증
        String text = request.getText() == null ? "" : request.getText().trim();
        if (text.isBlank()) {
            return Mono.just("");
        }
        
        // 정규화된 텍스트로 요청 객체 업데이트
        request.setText(text);

        TranslationMode mode;
        try {
            mode = TranslationMode.valueOf(request.getMode().toUpperCase());
        } catch (IllegalArgumentException e) {
            return Mono.error(new RuntimeException("지원하지 않는 번역 모드: " + request.getMode()));
        }

        TranslationDirection direction;
        try {
            // "ko-uk" → "KO_UK" 형태로 변환
            direction = TranslationDirection.valueOf(request.getDirection().toUpperCase().replace("-", "_"));
        } catch (IllegalArgumentException e) {
            return Mono.error(new RuntimeException("지원하지 않는 번역 방향: " + request.getDirection()));
        }

        return translationService.translate(request.getText(), mode, direction);
    }

    @Data
    public static class TranslationRequest {
        private String text;
        private String direction;
        private String mode;
    }
}
