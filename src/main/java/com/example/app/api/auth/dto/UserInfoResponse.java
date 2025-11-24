package com.example.app.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 현재 사용자 정보 응답 DTO
 * 
 * GET /api/auth/me 엔드포인트에서 반환하는 사용자 정보를 담는 클래스입니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoResponse {

    private Long id;
    private String username;
    private String email;
    private String name;
    private String role;  // 주요 역할 (예: "ADMIN", "USER")
}

