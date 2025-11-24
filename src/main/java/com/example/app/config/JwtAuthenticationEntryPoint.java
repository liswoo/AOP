package com.example.app.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 인증 실패 시 401 Unauthorized 응답을 반환하는 EntryPoint
 * 
 * AuthenticationEntryPoint란?
 * - 인증되지 않은 사용자가 보호된 리소스에 접근하려고 할 때 호출됩니다.
 * - 인증 실패 시 401 Unauthorized 응답을 반환합니다.
 * 
 * 401 vs 403:
 * - 401 Unauthorized: 인증이 안 된 경우 (토큰 없음, 잘못된 토큰, 만료된 토큰)
 * - 403 Forbidden: 인증은 되었지만 권한이 없는 경우
 * 
 * @Component: Spring이 이 클래스를 빈으로 등록합니다.
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    /**
     * 인증 실패 시 호출되는 메서드
     * 
     * JwtAuthenticationFilter에서 설정한 exception attribute를 읽어서
     * 상황에 맞는 에러 메시지를 반환합니다.
     * 
     * @param request HTTP 요청 (JwtAuthenticationFilter에서 설정한 "exception" attribute 포함)
     * @param response HTTP 응답
     * @param authException 인증 예외
     * @throws IOException IO 예외
     */
    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {

        // JwtAuthenticationFilter에서 설정한 exception attribute 읽기
        String exception = (String) request.getAttribute("exception");

        log.warn("인증되지 않은 요청: {} - {} (exception: {})", 
                request.getRequestURI(), authException.getMessage(), exception);

        // 응답 설정
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);  // 401

        // 에러 응답 본문 생성
        Map<String, String> error = new HashMap<>();
        error.put("path", request.getRequestURI());

        // 예외 타입에 따라 응답 메시지 분기 처리
        if ("TOKEN_EXPIRED".equals(exception)) {
            // 토큰 만료
            error.put("error", "TOKEN_EXPIRED");
            error.put("message", "토큰이 만료되었습니다. 다시 로그인해주세요.");
        } else if ("TOKEN_INVALID".equals(exception)) {
            // 잘못된 토큰 (서명 오류, 형식 오류 등)
            error.put("error", "TOKEN_INVALID");
            error.put("message", "유효하지 않은 토큰입니다.");
        } else if ("TOKEN_MISSING".equals(exception)) {
            // 토큰 없음
            error.put("error", "TOKEN_MISSING");
            error.put("message", "JWT 토큰이 필요합니다. Authorization 헤더에 Bearer 토큰을 포함해주세요.");
        } else {
            // 기본값 (예외 식별 불가)
            error.put("error", "UNAUTHORIZED");
            error.put("message", "인증이 필요합니다.");
        }

        // JSON 응답 작성
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.writeValue(response.getOutputStream(), error);
    }
}

