package com.example.app.api.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 활성/비활성 상태 변경 요청 DTO
 * 
 * 어드민이 사용자의 활성화 상태를 변경할 때 사용하는 요청 데이터를 담는 클래스입니다.
 */
@Getter
@Setter
public class UserStatusUpdateRequest {

    /**
     * 활성화 여부 (필수)
     * true: 활성화 (로그인 가능)
     * false: 비활성화 (로그인 불가)
     */
    @NotNull(message = "활성화 여부는 필수입니다.")
    private Boolean enabled;
}












