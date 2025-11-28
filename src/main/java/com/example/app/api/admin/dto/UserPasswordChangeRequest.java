package com.example.app.api.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 비밀번호 변경 요청 DTO
 * 
 * 어드민이 사용자의 비밀번호를 변경할 때 사용하는 요청 데이터를 담는 클래스입니다.
 */
@Getter
@Setter
public class UserPasswordChangeRequest {

    /**
     * 새 비밀번호 (필수)
     * 평문으로 전달되며, 서비스에서 BCrypt로 암호화됩니다.
     */
    @NotBlank(message = "새 비밀번호는 필수입니다.")
    private String newPassword;
}









