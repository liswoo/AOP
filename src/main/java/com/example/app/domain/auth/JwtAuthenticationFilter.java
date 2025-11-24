package com.example.app.domain.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT 인증 필터
 * 
 * 이 필터는 모든 HTTP 요청을 가로채서 JWT 토큰을 검증하고,
 * 유효한 토큰이면 SecurityContext에 인증 정보를 설정합니다.
 * 
 * 필터 실행 흐름:
 * 1. HTTP 요청이 들어옴
 * 2. Authorization 헤더에서 JWT 토큰 추출
 * 3. 토큰 유효성 검증 (JwtTokenProvider 사용)
 * 4. 토큰에서 사용자 정보 추출
 * 5. SecurityContext에 인증 정보 설정
 * 6. 다음 필터로 요청 전달
 * 
 * 인증(Authentication) vs 인가(Authorization):
 * - 인증(Authentication): "이 사용자가 누구인가?" - 사용자 신원 확인
 * - 인가(Authorization): "이 사용자가 무엇을 할 수 있는가?" - 권한 확인
 * 
 * 이 필터는 인증을 담당하며, 인가는 SecurityConfig의 authorizeHttpRequests에서 처리합니다.
 * 
 * @Component: Spring이 이 클래스를 빈으로 등록합니다.
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    /**
     * 필터의 핵심 로직을 구현하는 메서드
     * 
     * OncePerRequestFilter를 상속받아 한 요청당 한 번만 실행되도록 보장합니다.
     * 
     * @param request HTTP 요청
     * @param response HTTP 응답
     * @param filterChain 필터 체인 (다음 필터로 전달)
     * @throws ServletException 서블릿 예외
     * @throws IOException IO 예외
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // 1. HTTP 요청 헤더에서 JWT 토큰 추출
            String token = getTokenFromRequest(request);

            // 2. 토큰이 있고 유효한 경우
            if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                // 3. 토큰에서 사용자명 추출
                String username = jwtTokenProvider.getUsernameFromToken(token);

                // 4. 사용자 정보 로드 (이미 SecurityContext에 없을 때만)
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 5. UserDetails 조회
                    var userDetails = userDetailsService.loadUserByUsername(username);

                    // 6. 토큰에서 권한 정보 추출
                    String authoritiesString = jwtTokenProvider.getAuthoritiesFromToken(token);
                    List<SimpleGrantedAuthority> authorities = Arrays.stream(
                                    authoritiesString.split(","))
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    // 7. Authentication 객체 생성
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,  // credentials는 null (이미 인증됨)
                                    authorities);

                    // 8. 요청 정보 설정
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    // 9. SecurityContext에 인증 정보 설정
                    // 이렇게 설정하면 Controller에서 @AuthenticationPrincipal로 접근 가능
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("JWT 토큰 인증 성공: {}", username);
                }
            }
        } catch (Exception e) {
            log.error("JWT 토큰 인증 실패: {}", e.getMessage());
            // 인증 실패해도 요청은 계속 진행 (다른 필터나 SecurityConfig에서 처리)
        }

        // 10. 다음 필터로 요청 전달
        filterChain.doFilter(request, response);
    }

    /**
     * HTTP 요청 헤더에서 JWT 토큰을 추출합니다.
     * 
     * Authorization 헤더 형식: "Bearer {token}"
     * 
     * 주의사항:
     * - "Bearer "만 있고 실제 토큰이 없는 경우도 처리합니다.
     * - 빈 토큰은 null을 반환하여 필터가 인증을 시도하지 않도록 합니다.
     * 
     * @param request HTTP 요청
     * @return JWT 토큰 문자열 (없거나 빈 토큰이면 null)
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        
        // Authorization 헤더가 없거나 "Bearer "로 시작하지 않으면 null 반환
        if (!StringUtils.hasText(bearerToken) || !bearerToken.startsWith("Bearer ")) {
            return null;
        }
        
        // "Bearer " 접두사 제거하고 토큰만 추출
        String token = bearerToken.substring(7);
        
        // 토큰이 비어있으면 null 반환 (예: "Authorization: Bearer " 같은 경우)
        // 이렇게 하면 필터가 빈 토큰을 검증하려다 실패하는 것을 방지합니다.
        if (!StringUtils.hasText(token)) {
            return null;
        }
        
        return token;
    }
}

