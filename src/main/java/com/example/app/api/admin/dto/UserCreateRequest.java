package com.example.app.api.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 생성 요청 DTO
 * 
 * 어드민이 새 사용자 계정을 생성할 때 사용하는 요청 데이터를 담는 클래스입니다.
 */
@Getter
@Setter
public class UserCreateRequest {

    /**
     * 로그인 아이디 (필수, 고유값)
     */
    @NotBlank(message = "사용자명은 필수입니다.")
    private String username;

    /**
     * 비밀번호 (필수)
     * 평문으로 전달되며, 서비스에서 BCrypt로 암호화됩니다.
     */
    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;

    /**
     * 이메일 주소 (필수, 고유값)
     */
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    /**
     * 사용자 이름 (필수)
     */
    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    /**
     * 역할 (필수)
     * "ADMIN" 또는 "USER" 중 하나
     */
    @NotBlank(message = "역할은 필수입니다.")
    @Pattern(regexp = "^(ADMIN|USER)$", message = "역할은 ADMIN 또는 USER만 가능합니다.")
    private String role;
}












