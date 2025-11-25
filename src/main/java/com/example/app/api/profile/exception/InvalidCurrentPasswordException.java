package com.example.app.api.profile.exception;

/**
 * 현재 비밀번호가 일치하지 않을 때 사용하는 예외
 * 
 * 사용자가 비밀번호를 변경할 때, 현재 비밀번호를 입력했는데
 * 실제 저장된 비밀번호와 일치하지 않을 때 발생하는 예외입니다.
 * 
 * HTTP 응답: 400 Bad Request
 */
public class InvalidCurrentPasswordException extends RuntimeException {

    public InvalidCurrentPasswordException(String message) {
        super(message);
    }

    public InvalidCurrentPasswordException() {
        super("현재 비밀번호가 올바르지 않습니다.");
    }
}

