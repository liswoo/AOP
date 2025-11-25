package com.example.app.domain.user.exception;

/**
 * 사용자명 중복 예외
 * 
 * 사용자 생성 또는 수정 시 이미 존재하는 사용자명을 사용하려고 할 때 발생하는 예외입니다.
 * 
 * HTTP 응답: 400 Bad Request
 */
public class DuplicateUsernameException extends RuntimeException {

    public DuplicateUsernameException(String message) {
        super(message);
    }

    public DuplicateUsernameException(String username, String message) {
        super(message != null ? message : "이미 존재하는 사용자명입니다: " + username);
    }
}

