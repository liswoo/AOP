package com.example.app.api.auth.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
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

    /**
     * 요청 본문이 없거나 읽을 수 없는 경우 처리 (400 Bad Request)
     * 
     * @RequestBody가 필요한데 요청 본문이 없거나, JSON 파싱에 실패한 경우 발생합니다.
     * 
     * @param e HttpMessageNotReadableException
     * @return 400 Bad Request 응답
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException e) {
        log.warn("요청 본문 파싱 실패: {}", e.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("error", "BAD_REQUEST");
        
        // 에러 메시지에서 원인 파악
        String message = e.getMessage();
        if (message != null && message.contains("Required request body is missing")) {
            error.put("message", "요청 본문이 필요합니다. Content-Type을 application/json으로 설정하고 JSON 형식의 데이터를 전송해주세요.");
        } else if (message != null && message.contains("JSON parse error")) {
            error.put("message", "JSON 형식이 올바르지 않습니다. 요청 본문을 확인해주세요.");
        } else {
            error.put("message", "요청 본문을 읽을 수 없습니다. Content-Type과 데이터 형식을 확인해주세요.");
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * 요청 데이터 검증 실패 예외 처리 (400 Bad Request)
     * 
     * Bean Validation (@NotBlank, @Email 등) 실패 시
     * 
     * @param e MethodArgumentNotValidException
     * @return 400 Bad Request 응답
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException e) {
        log.warn("요청 데이터 검증 실패: {}", e.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("error", "BAD_REQUEST");
        
        // 첫 번째 검증 오류 메시지 추출
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fieldError -> fieldError.getDefaultMessage())
                .orElse("요청 데이터가 올바르지 않습니다.");
        
        error.put("message", message);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}




