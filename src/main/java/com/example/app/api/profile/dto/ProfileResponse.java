package com.example.app.api.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 내 정보 조회/수정 응답 DTO
 * 
 * GET /api/profile과 PUT /api/profile 엔드포인트에서 반환하는 사용자 정보를 담는 클래스입니다.
 * 
 * 프론트에서 "내 정보" 화면을 만들 때 사용할 응답 구조입니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Long id;
    private String username;
    private String email;
    private String name;
    private String role;  // 주요 역할 (예: "ADMIN", "USER")
}

