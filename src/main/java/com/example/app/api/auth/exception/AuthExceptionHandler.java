package com.example.app.api.auth.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 인증 관련 예외 처리 핸들러
 * 
 * 이 클래스는 인증/인가 과정에서 발생하는 예외를 처리하여
 * 적절한 HTTP 상태 코드와 메시지를 반환합니다.
 * 
 * @RestControllerAdvice: 모든 컨트롤러에서 발생하는 예외를 처리
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@RestControllerAdvice
public class AuthExceptionHandler {

    /**
     * 잘못된 자격 증명 예외 처리 (401 Unauthorized)
     * 
     * 사용자명 또는 비밀번호가 잘못된 경우 발생합니다.
     * 
     * @param e BadCredentialsException
     * @return 401 Unauthorized 응답
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentialsException(
            BadCredentialsException e) {
        log.warn("인증 실패: 잘못된 자격 증명");

        Map<String, String> error = new HashMap<>();
        error.put("error", "UNAUTHORIZED");
        error.put("message", "사용자명 또는 비밀번호가 올바르지 않습니다.");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * 인증 서비스 내부 예외 처리 (401 Unauthorized)
     * 
     * 사용자를 찾을 수 없거나 비활성화된 경우 발생합니다.
     * 
     * @param e InternalAuthenticationServiceException
     * @return 401 Unauthorized 응답
     */
    @ExceptionHandler(InternalAuthenticationServiceException.class)
    public ResponseEntity<Map<String, String>> handleInternalAuthenticationServiceException(
            InternalAuthenticationServiceException e) {
        log.warn("인증 실패: {}", e.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("error", "UNAUTHORIZED");
        error.put("message", "인증에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * 일반 인증 예외 처리 (401 Unauthorized)
     * 
     * @param e AuthenticationException
     * @return 401 Unauthorized 응답
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthenticationException(
            AuthenticationException e) {
        log.warn("인증 실패: {}", e.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("error", "UNAUTHORIZED");
        error.put("message", "인증에 실패했습니다.");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
}

