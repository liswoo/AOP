package com.example.app.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
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
 * 인증(Authentication) vs 인가(Authorization):
 * - 인증(Authentication): "이 사용자가 누구인가?" - 사용자 신원 확인
 *   예: 로그인하여 JWT 토큰을 발급받는 과정
 * - 인가(Authorization): "이 사용자가 무엇을 할 수 있는가?" - 권한 확인
 *   예: ADMIN 권한이 있는 사용자만 /api/admin/** 접근 가능
 * 
 * 보안 흐름:
 * 1. 클라이언트가 HTTP 요청 전송
 * 2. JwtAuthenticationFilter가 요청을 가로채서 JWT 토큰 검증
 * 3. 유효한 토큰이면 SecurityContext에 인증 정보 설정
 * 4. SecurityConfig의 authorizeHttpRequests에서 권한 확인
 * 5. 권한이 있으면 요청 허용, 없으면 403 Forbidden 반환
 * 
 * @Configuration: Spring 설정 클래스로 인식
 * @EnableWebSecurity: Spring Security 활성화
 * @EnableMethodSecurity: 메서드 레벨 보안 활성화 (예: @PreAuthorize)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;
    private final com.example.app.domain.auth.JwtTokenProvider jwtTokenProvider;
    private final com.example.app.domain.auth.CustomUserDetailsService customUserDetailsService;

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
        // 환경 변수에서 읽거나 기본값 사용
        String allowedOrigins = System.getenv("CORS_ALLOWED_ORIGINS");
        if (allowedOrigins != null && !allowedOrigins.isEmpty()) {
            // 쉼표로 구분된 여러 오리진 지원
            configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        } else {
            // 기본값: 로컬 개발 서버
            configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        }
        
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
     * AuthenticationManager 빈 생성
     * 
     * AuthenticationManager는 사용자 인증을 담당합니다.
     * 로그인 시 사용자명과 비밀번호를 검증하는 데 사용됩니다.
     * 
     * @param config AuthenticationConfiguration
     * @return AuthenticationManager
     * @throws Exception 설정 중 발생할 수 있는 예외
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * DaoAuthenticationProvider 빈 생성
     * 
     * UserDetailsService와 PasswordEncoder를 사용하여
     * 사용자 인증을 처리하는 Provider입니다.
     * 
     * @return DaoAuthenticationProvider
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    /**
     * SecurityFilterChain을 정의하여 HTTP 요청에 대한 보안 규칙을 설정합니다.
     * 
     * 필터 체인 순서:
     * 1. CORS 필터
     * 2. JwtAuthenticationFilter (JWT 토큰 검증)
     * 3. UsernamePasswordAuthenticationFilter (기본 로그인 필터)
     * 4. 기타 Security 필터들
     * 
     * 인가 규칙:
     * - /api/auth/** : 모두 허용 (로그인, 회원가입 등)
     * - /api/admin/** : ADMIN 권한 필요
     * - /api/** : 인증된 사용자만 접근 가능
     * 
     * @param http HttpSecurity 객체
     * @return SecurityFilterChain
     * @throws Exception 설정 중 발생할 수 있는 예외
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // CORS 설정을 직접 생성 (corsConfigurationSource 빈 사용)
        CorsConfigurationSource source = corsConfigurationSource();
        
        http
            // CSRF 보호 비활성화 (JWT 기반 API 서버이므로 불필요)
            .csrf(csrf -> csrf.disable())
            
            // CORS 설정 적용
            .cors(cors -> cors.configurationSource(source))
            
            // 세션을 사용하지 않음 (STATELESS)
            // JWT 토큰 기반 인증이므로 서버에 세션을 저장하지 않습니다.
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // 요청에 대한 인가 규칙 설정
            .authorizeHttpRequests(auth -> auth
                // CORS 프리플라이트 요청(OPTIONS)은 모두 허용
                .requestMatchers(org.springframework.web.bind.annotation.RequestMethod.OPTIONS.name()).permitAll()
                
                // 공개 엔드포인트 (인증 없이 접근 가능)
                .requestMatchers("/api/auth/login", "/api/auth/health").permitAll()
                
                // 현재 사용자 정보 조회는 인증 필요
                .requestMatchers("/api/auth/me").authenticated()
                
                // 관리자 엔드포인트는 ADMIN 권한 필요
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // H2 콘솔 (개발용)
                .requestMatchers("/h2-console/**").permitAll()
                
                // 그 외 모든 /api/** 엔드포인트는 인증된 사용자만 접근 가능
                .requestMatchers("/api/**").authenticated()
                
                // 나머지 요청은 허용 (정적 리소스 등)
                .anyRequest().permitAll()
            )
            
            // AuthenticationProvider 설정
            .authenticationProvider(authenticationProvider())
            
            // 인증 실패 시 401 Unauthorized 반환
            // 토큰이 없거나 잘못된 토큰인 경우 이 EntryPoint가 호출됩니다.
            .exceptionHandling(exceptions -> exceptions
                    .authenticationEntryPoint(jwtAuthenticationEntryPoint)  // 401 반환
                    .accessDeniedHandler(jwtAccessDeniedHandler)  // 403 반환
            )
            
            // JWT 인증 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
            // 이렇게 하면 모든 요청이 JWT 필터를 먼저 거치게 됩니다.
            // 필터를 직접 생성하여 순서 문제를 해결합니다.
            .addFilterBefore(
                    new com.example.app.domain.auth.JwtAuthenticationFilter(jwtTokenProvider, customUserDetailsService),
                    UsernamePasswordAuthenticationFilter.class);
        
        // H2 콘솔 사용을 위한 프레임 옵션 허용 (개발용)
        http.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));
        
        return http.build();
    }
}

