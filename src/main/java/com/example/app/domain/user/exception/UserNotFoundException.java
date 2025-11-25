package com.example.app.domain.user.exception;

/**
 * 사용자를 찾을 수 없을 때 발생하는 예외
 * 
 * 이 예외는 사용자 ID로 조회했을 때 해당 사용자가 존재하지 않을 때 발생합니다.
 * 
 * HTTP 응답: 404 Not Found
 */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException(Long userId) {
        super("사용자를 찾을 수 없습니다. ID: " + userId);
    }
}



