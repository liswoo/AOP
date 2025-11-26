package com.example.app.api.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * 로그인 요청 DTO (Data Transfer Object)
 * 
 * 클라이언트로부터 받는 로그인 요청 데이터를 담는 클래스입니다.
 * 
 * @Getter, @Setter: Lombok이 자동으로 getter/setter 생성
 */
@Getter
@Setter
public class LoginRequest {

    /**
     * 로그인 아이디 (필수)
     */
    @NotBlank(message = "사용자명은 필수입니다.")
    private String username;

    /**
     * 비밀번호 (필수)
     */
    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;
}






