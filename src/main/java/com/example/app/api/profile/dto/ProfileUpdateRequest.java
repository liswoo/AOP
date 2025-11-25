package com.example.app.api.profile.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * 내 정보 수정 요청 DTO
 * 
 * PUT /api/profile 엔드포인트에서 사용하는 요청 데이터를 담는 클래스입니다.
 * 
 * 로그인한 사용자가 자신의 이름과 이메일을 수정할 때 사용합니다.
 */
@Getter
@Setter
public class ProfileUpdateRequest {

    /**
     * 이메일 주소 (필수)
     */
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    /**
     * 사용자 이름 (필수)
     */
    @NotBlank(message = "이름은 필수입니다.")
    private String name;
}

