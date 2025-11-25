package com.example.app.api.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * 비밀번호 변경 요청 DTO
 * 
 * PATCH /api/profile/password 엔드포인트에서 사용하는 요청 데이터를 담는 클래스입니다.
 * 
 * 로그인한 사용자가 자신의 비밀번호를 변경할 때 사용합니다.
 */
@Getter
@Setter
public class ProfilePasswordChangeRequest {

    /**
     * 현재 비밀번호 (필수)
     * 
     * 비밀번호 변경 시 현재 비밀번호를 확인하기 위해 사용합니다.
     */
    @NotBlank(message = "현재 비밀번호는 필수입니다.")
    private String currentPassword;

    /**
     * 새 비밀번호 (필수)
     * 
     * 최소 8자 이상이어야 합니다.
     */
    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @Size(min = 8, message = "새 비밀번호는 최소 8자 이상이어야 합니다.")
    private String newPassword;
}

