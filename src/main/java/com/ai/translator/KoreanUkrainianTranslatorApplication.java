package com.ai.translator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan; // 추가

@SpringBootApplication
@ConfigurationPropertiesScan
public class KoreanUkrainianTranslatorApplication {

	public static void main(String[] args) {
		SpringApplication.run(KoreanUkrainianTranslatorApplication.class, args);
	}

}