package com.example.app.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 로그인 응답 DTO
 * 
 * 로그인 성공 시 클라이언트에게 반환하는 데이터를 담는 클래스입니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    /**
     * JWT Access Token
     * 
     * 이 토큰을 Authorization 헤더에 "Bearer {token}" 형식으로 포함하여
     * 인증이 필요한 API를 호출할 수 있습니다.
     */
    private String accessToken;

    /**
     * 사용자 정보
     */
    private UserInfo user;

    /**
     * 사용자 정보 내부 클래스
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private String role;  // 주요 역할 (예: "ADMIN", "USER")
    }
}

