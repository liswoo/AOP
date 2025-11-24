package com.example.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS (Cross-Origin Resource Sharing) 설정 클래스
 * 
 * CORS는 다른 도메인(포트 포함)에서 실행되는 웹 애플리케이션이
 * 이 백엔드 API를 호출할 수 있도록 허용하는 메커니즘입니다.
 * 
 * 예를 들어, React 프론트엔드가 http://localhost:5173에서 실행되고
 * 백엔드가 http://localhost:8080에서 실행될 때 필요합니다.
 */
@Configuration
public class CorsConfig {

    /**
     * CORS 설정을 정의합니다.
     * 
     * @return CorsConfigurationSource
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 허용할 오리진(프론트엔드 주소)
        // React 개발 서버 주소
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        
        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // 허용할 HTTP 헤더
        configuration.setAllowedHeaders(List.of("*"));
        
        // 인증 정보(쿠키, Authorization 헤더 등) 허용
        // JWT 토큰을 Authorization 헤더로 전송할 예정이므로 true
        configuration.setAllowCredentials(true);
        
        // 프리플라이트 요청의 캐시 시간(초)
        configuration.setMaxAge(3600L);
        
        // 모든 경로에 CORS 설정 적용
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}

