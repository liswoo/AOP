package com.example.app.api.admin;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자(Admin) 관련 API 컨트롤러
 * 
 * 이 컨트롤러는 관리자 권한이 필요한 기능들을 제공합니다.
 * 
 * 향후 추가 예정:
 * - GET /api/admin/users: 사용자 목록 조회
 * - GET /api/admin/users/{id}: 사용자 상세 조회
 * - POST /api/admin/users: 사용자 생성
 * - PUT /api/admin/users/{id}: 사용자 정보 수정
 * - DELETE /api/admin/users/{id}: 사용자 삭제
 * - GET /api/admin/roles: 역할 목록 조회
 * - POST /api/admin/roles: 역할 생성
 * - PUT /api/admin/users/{userId}/roles: 사용자 역할 할당
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    // TODO: 관리자 기능 구현 예정
    // 현재는 뼈대만 제공하며, 나중에 UserService를 주입받아 사용할 예정
}

