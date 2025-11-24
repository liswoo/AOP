package com.example.app.api.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 인증(Authentication) 관련 API 컨트롤러
 * 
 * 이 컨트롤러는 사용자 인증과 관련된 엔드포인트를 제공합니다.
 * 
 * 현재 구현:
 * - GET /api/health: 서버 상태 확인
 * 
 * 향후 추가 예정:
 * - POST /api/auth/login: 로그인 (JWT 토큰 발급)
 * - POST /api/auth/refresh: 토큰 갱신
 * - POST /api/auth/logout: 로그아웃
 * - GET /api/auth/me: 현재 로그인한 사용자 정보 조회
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /**
     * 서버 상태 확인 엔드포인트
     * 
     * 이 엔드포인트는 인증 없이 접근 가능하며,
     * 서버가 정상적으로 동작하는지 확인하는 용도로 사용됩니다.
     * 
     * @return {"status": "OK"}
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        return ResponseEntity.ok(response);
    }

    /**
     * 로그인 엔드포인트 (향후 구현 예정)
     * 
     * TODO: JWT 토큰 기반 인증 구현
     * - 사용자명/비밀번호로 로그인
     * - JWT Access Token 및 Refresh Token 발급
     * - 로그인 이력 저장
     * 
     * 예상 엔드포인트: POST /api/auth/login
     * 예상 요청: { "username": "user", "password": "pass" }
     * 예상 응답: { "accessToken": "...", "refreshToken": "..." }
     */
    // @PostMapping("/login")
    // public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    //     // TODO: 구현 예정
    // }
}

