package com.example.app.domain.auth;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
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
 * @Order: 필터 순서 지정 (낮은 숫자가 먼저 실행됨)
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
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

        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        // OPTIONS 요청(CORS 프리플라이트)은 필터를 건너뛰기
        if ("OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 로그인 요청은 JWT 필터를 건너뛰기 (토큰이 없으므로)
        if ("/api/auth/login".equals(requestURI) || "/api/auth/health".equals(requestURI)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 1. HTTP 요청 헤더에서 JWT 토큰 추출
            String token = getTokenFromRequest(request);

            // 2. 토큰이 없는 경우
            if (!StringUtils.hasText(token)) {
                // 토큰이 없음을 request attribute에 저장
                // JwtAuthenticationEntryPoint에서 이 값을 읽어서 응답을 세분화합니다.
                request.setAttribute("exception", "TOKEN_MISSING");
                filterChain.doFilter(request, response);
                return;
            }

            // 3. 토큰이 있는 경우 검증 및 인증 처리
            try {
                // 토큰 유효성 검증 (예외가 발생하면 catch 블록에서 처리)
                jwtTokenProvider.validateToken(token);
                
                // 검증 성공 시 인증 처리
                // 4. 토큰에서 사용자명 추출
                String username = jwtTokenProvider.getUsernameFromToken(token);

                // 5. 사용자 정보 로드 (이미 SecurityContext에 없을 때만)
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 6. UserDetails 조회 (DB에서 최신 권한 정보를 가져옴)
                    var userDetails = userDetailsService.loadUserByUsername(username);
                    
                    log.debug("JWT 필터: DB에서 로드한 권한 - username={}, authorities={}", 
                            username, userDetails.getAuthorities().stream()
                                    .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                                    .collect(Collectors.joining(", ")));

                    // 7. 토큰에서 권한 정보 추출 (참고용 로깅)
                    String authoritiesString = jwtTokenProvider.getAuthoritiesFromToken(token);
                    log.debug("JWT 토큰에서 추출한 권한 (참고용): {}", authoritiesString);

                    // 8. Authentication 객체 생성
                    // 중요: DB에서 최신 권한을 가져온 userDetails.getAuthorities()를 사용합니다.
                    // 이렇게 하면 토큰 발급 후 권한이 변경되어도 최신 권한이 반영됩니다.
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,  // credentials는 null (이미 인증됨)
                                    userDetails.getAuthorities());  // DB에서 가져온 최신 권한 사용

                    // 9. 요청 정보 설정
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    // 10. SecurityContext에 인증 정보 설정
                    // 이렇게 설정하면 Controller에서 @AuthenticationPrincipal로 접근 가능
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("JWT 토큰 인증 성공: {}", username);
                }
            } catch (ExpiredJwtException e) {
                // 토큰 만료 예외
                // JwtAuthenticationEntryPoint에서 이 값을 읽어서 "TOKEN_EXPIRED" 응답을 반환합니다.
                log.warn("JWT 토큰 만료: {}", e.getMessage());
                request.setAttribute("exception", "TOKEN_EXPIRED");
            } catch (JwtException e) {
                // 기타 JWT 예외 (잘못된 토큰, 서명 오류 등)
                // JwtAuthenticationEntryPoint에서 이 값을 읽어서 "TOKEN_INVALID" 응답을 반환합니다.
                log.warn("JWT 토큰 검증 실패: {}", e.getMessage());
                request.setAttribute("exception", "TOKEN_INVALID");
            } catch (Exception e) {
                // 기타 예외 (예: IllegalArgumentException 등)
                log.error("JWT 토큰 인증 중 예외 발생: {}", e.getMessage());
                request.setAttribute("exception", "TOKEN_INVALID");
            }
        } catch (Exception e) {
            log.error("JWT 필터 처리 중 예외 발생: {}", e.getMessage(), e);
            // 예외 발생 시에도 요청은 계속 진행 (다른 필터나 SecurityConfig에서 처리)
            // 요청 본문이 소진되지 않도록 예외를 잡아서 계속 진행
            request.setAttribute("exception", "TOKEN_INVALID");
        }

        // 10. 다음 필터로 요청 전달
        // 예외가 발생해도 요청은 계속 진행되어야 합니다.
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

