package com.example.app.api.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 정보 수정 요청 DTO
 * 
 * 어드민이 사용자 정보를 수정할 때 사용하는 요청 데이터를 담는 클래스입니다.
 * 비밀번호는 이 DTO에서 변경하지 않으며, 별도의 엔드포인트를 사용합니다.
 */
@Getter
@Setter
public class UserUpdateRequest {

    /**
     * 이메일 주소 (선택사항)
     */
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    /**
     * 사용자 이름 (선택사항)
     */
    private String name;

    /**
     * 역할 (선택사항)
     * "ADMIN" 또는 "USER" 중 하나
     */
    @Pattern(regexp = "^(ADMIN|USER)$", message = "역할은 ADMIN 또는 USER만 가능합니다.")
    private String role;

    /**
     * 활성화 여부 (선택사항)
     */
    private Boolean enabled;
}







