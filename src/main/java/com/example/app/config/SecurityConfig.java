package com.example.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security 설정 클래스
 * 
 * 이 클래스는 애플리케이션의 보안 정책을 정의합니다.
 * 
 * 현재 상태:
 * - JWT 인증은 아직 구현되지 않았습니다.
 * - 나중에 JWT 필터를 추가할 예정입니다.
 * 
 * 향후 추가 예정:
 * - JWT 토큰 기반 인증 필터
 * - 로그인 엔드포인트 (/api/auth/login)
 * - 토큰 검증 및 사용자 인증 처리
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;

    /**
     * 생성자를 통한 의존성 주입
     * CorsConfig에서 정의한 CORS 설정을 주입받습니다.
     */
    public SecurityConfig(CorsConfigurationSource corsConfigurationSource) {
        this.corsConfigurationSource = corsConfigurationSource;
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
        http
            // CSRF 보호 비활성화 (API 서버이므로, 나중에 JWT 사용 시 필요 없음)
            .csrf(csrf -> csrf.disable())
            
            // CORS 설정 적용 (CorsConfig에서 정의한 설정 사용)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            
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

