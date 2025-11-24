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

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {

        log.warn("인증되지 않은 요청: {} - {}", request.getRequestURI(), authException.getMessage());

        // 응답 설정
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);  // 401

        // 에러 응답 본문 생성
        Map<String, String> error = new HashMap<>();
        error.put("error", "UNAUTHORIZED");
        error.put("message", "인증이 필요합니다. 유효한 JWT 토큰을 제공해주세요.");
        error.put("path", request.getRequestURI());

        // JSON 응답 작성
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.writeValue(response.getOutputStream(), error);
    }
}

