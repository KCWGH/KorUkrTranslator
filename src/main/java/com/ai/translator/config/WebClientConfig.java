package com.ai.translator.config;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

import io.netty.channel.ChannelOption;
import reactor.netty.http.client.HttpClient;

@Configuration
public class WebClientConfig {

    @Bean
    WebClient webClient() {
		HttpClient httpClient = HttpClient.create()
				.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000) // 10초 연결 타임아웃
				.responseTimeout(Duration.ofSeconds(30)) // 30초 응답 타임아웃
				.doOnConnected(conn -> 
					conn.addHandlerLast(new io.netty.handler.timeout.ReadTimeoutHandler(30)) // 30초 읽기 타임아웃
				);

		return WebClient.builder()
				.clientConnector(new org.springframework.http.client.reactive.ReactorClientHttpConnector(httpClient))
				.codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024)) // 1MB 메모리 제한
				.build();
	}
}