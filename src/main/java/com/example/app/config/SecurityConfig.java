package com.example.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 설정 클래스
 * 
 * 이 클래스는 애플리케이션의 보안 정책을 정의합니다.
 * 
 * 현재 상태:
 * - JWT 인증은 아직 구현되지 않았습니다.
 * - 나중에 JWT 필터를 추가할 예정입니다.
 * - CORS 설정이 이 클래스에 직접 포함되어 있습니다.
 * 
 * 향후 추가 예정:
 * - JWT 토큰 기반 인증 필터
 * - 로그인 엔드포인트 (/api/auth/login)
 * - 토큰 검증 및 사용자 인증 처리
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * CORS 설정을 정의하는 빈
     * 
     * CORS (Cross-Origin Resource Sharing)는 다른 도메인(포트 포함)에서 실행되는
     * 웹 애플리케이션이 이 백엔드 API를 호출할 수 있도록 허용하는 메커니즘입니다.
     * 
     * 예를 들어, React 프론트엔드가 http://localhost:5173에서 실행되고
     * 백엔드가 http://localhost:8080에서 실행될 때 필요합니다.
     * 
     * @Primary: 여러 개의 CorsConfigurationSource 빈이 있을 때
     * 이 빈을 우선적으로 사용하도록 지정합니다.
     * 
     * @return CorsConfigurationSource
     */
    @Bean
    @Primary
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

    /**
     * SecurityFilterChain을 정의하여 HTTP 요청에 대한 보안 규칙을 설정합니다.
     * 
     * @param http HttpSecurity 객체
     * @return SecurityFilterChain
     * @throws Exception 설정 중 발생할 수 있는 예외
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // CORS 설정을 직접 생성 (빈 주입 없이)
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        http
            // CSRF 보호 비활성화 (API 서버이므로, 나중에 JWT 사용 시 필요 없음)
            .csrf(csrf -> csrf.disable())
            
            // CORS 설정 적용 (인라인으로 직접 생성한 설정 사용)
            .cors(cors -> cors.configurationSource(source))
            
            // 세션을 사용하지 않음 (JWT 기반 인증을 사용할 예정)
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // 요청에 대한 인가 규칙 설정
            .authorizeHttpRequests(auth -> auth
                // 공개 엔드포인트 (인증 없이 접근 가능)
                .requestMatchers("/api/auth/health", "/h2-console/**").permitAll()
                
                // 나머지 모든 요청은 인증 필요
                // TODO: JWT 인증 구현 후 활성화
                // .requestMatchers("/api/**").authenticated()
                
                // 현재는 모든 요청 허용 (개발 단계)
                .anyRequest().permitAll()
            );
        
        // H2 콘솔 사용을 위한 프레임 옵션 허용 (개발용)
        http.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));
        
        return http.build();
    }
}

