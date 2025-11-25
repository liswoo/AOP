package com.example.app.api.admin.exception;

import com.example.app.domain.user.exception.DuplicateUsernameException;
import com.example.app.domain.user.exception.UserNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 어드민 API 관련 예외 처리 핸들러
 * 
 * 이 클래스는 어드민 API에서 발생하는 예외를 처리하여
 * 적절한 HTTP 상태 코드와 메시지를 반환합니다.
 * 
 * @RestControllerAdvice: 모든 컨트롤러에서 발생하는 예외를 처리
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@RestControllerAdvice
public class AdminExceptionHandler {

    /**
     * 사용자를 찾을 수 없을 때 발생하는 예외 처리 (404 Not Found)
     * 
     * @param e UserNotFoundException
     * @return 404 Not Found 응답
     */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFoundException(
            UserNotFoundException e) {
        log.warn("사용자를 찾을 수 없음: {}", e.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("error", "USER_NOT_FOUND");
        error.put("message", e.getMessage());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * 사용자명 중복 예외 처리 (400 Bad Request)
     * 
     * 사용자 생성 또는 수정 시 이미 존재하는 사용자명을 사용하려고 할 때 발생합니다.
     * 
     * @param e DuplicateUsernameException
     * @return 400 Bad Request 응답
     */
    @ExceptionHandler(DuplicateUsernameException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateUsernameException(
            DuplicateUsernameException e) {
        log.warn("사용자명 중복: {}", e.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("error", "DUPLICATE_USERNAME");
        error.put("message", e.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * 잘못된 요청 데이터 예외 처리 (400 Bad Request)
     * 
     * 이메일 중복, 잘못된 역할, 기본 관리자 계정 보호, 자기 자신 삭제 방지, 마지막 ADMIN 보호 등
     * 
     * @param e IllegalArgumentException
     * @return 400 Bad Request 응답
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(
            IllegalArgumentException e) {
        log.warn("잘못된 요청: {}", e.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("error", "BAD_REQUEST");
        error.put("message", e.getMessage());

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
    public ResponseEntity<Map<String, String>> handleValidationException(
            MethodArgumentNotValidException e) {
        log.warn("요청 데이터 검증 실패: {}", e.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("error", "VALIDATION_ERROR");
        
        // 첫 번째 검증 오류 메시지 추출
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fieldError -> fieldError.getDefaultMessage())
                .orElse("요청 데이터가 올바르지 않습니다.");
        
        error.put("message", message);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}



