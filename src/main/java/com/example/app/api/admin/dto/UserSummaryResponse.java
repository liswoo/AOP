package com.example.app.api.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 사용자 목록 조회 및 단건 조회 응답 DTO
 * 
 * 어드민이 사용자 정보를 조회할 때 반환하는 데이터를 담는 클래스입니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {

    private Long id;
    private String username;
    private String email;
    private String name;
    private String role;  // 주요 역할 (예: "ADMIN", "USER")
    private Boolean enabled;  // 활성화 여부 (active 필드)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}






