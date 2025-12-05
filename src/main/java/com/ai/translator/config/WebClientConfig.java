package com.ai.translator.config;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import lombok.RequiredArgsConstructor;
import reactor.netty.http.client.HttpClient;

@Configuration
@RequiredArgsConstructor
public class WebClientConfig {

    private static final int CONNECT_TIMEOUT_MILLIS = 10000;
    private static final int RESPONSE_TIMEOUT_SECONDS = 30;
    private static final int READ_TIMEOUT_SECONDS = 30;
    private static final int MAX_IN_MEMORY_SIZE = 1024 * 1024;

    private final TranslatorProperties properties;

    @Bean
    HttpClient sharedHttpClient() {
        return HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MILLIS)
                .responseTimeout(Duration.ofSeconds(RESPONSE_TIMEOUT_SECONDS))
                .doOnConnected(conn -> conn.addHandlerLast(new ReadTimeoutHandler(READ_TIMEOUT_SECONDS)));
    }

    private WebClient.Builder createCommonWebClientBuilder(HttpClient sharedHttpClient) {
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(sharedHttpClient))
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE));
    }

    @Bean("geminiWebClient")
    WebClient geminiWebClient(HttpClient sharedHttpClient) {
        return createCommonWebClientBuilder(sharedHttpClient)
                .baseUrl(properties.gemini().endpoint())
                .defaultHeader("x-goog-api-key", properties.gemini().apiKey())
                .build();
    }

    @Bean("googleTranslateWebClient")
    WebClient googleTranslateWebClient(HttpClient sharedHttpClient) {
        return createCommonWebClientBuilder(sharedHttpClient)
                .baseUrl(properties.googleTranslate().endpoint())
                .defaultHeader("X-goog-api-key", properties.googleTranslate().apiKey())
                .build();
    }
}