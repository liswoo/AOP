package com.example.app.api.profile.exception;

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
 * 프로필 API 관련 예외 처리 핸들러
 * 
 * 이 클래스는 프로필 API에서 발생하는 예외를 처리하여
 * 적절한 HTTP 상태 코드와 메시지를 반환합니다.
 * 
 * @RestControllerAdvice: 모든 컨트롤러에서 발생하는 예외를 처리
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@RestControllerAdvice
public class ProfileExceptionHandler {

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
     * 현재 비밀번호가 일치하지 않을 때 사용하는 예외 처리 (400 Bad Request)
     * 
     * 사용자가 비밀번호를 변경할 때, 현재 비밀번호를 입력했는데
     * 실제 저장된 비밀번호와 일치하지 않을 때 발생합니다.
     * 
     * @param e InvalidCurrentPasswordException
     * @return 400 Bad Request 응답
     */
    @ExceptionHandler(InvalidCurrentPasswordException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCurrentPasswordException(
            InvalidCurrentPasswordException e) {
        log.warn("현재 비밀번호 불일치: {}", e.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("error", "INVALID_CURRENT_PASSWORD");
        error.put("message", e.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * 잘못된 요청 데이터 예외 처리 (400 Bad Request)
     * 
     * 이메일 중복 등
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

