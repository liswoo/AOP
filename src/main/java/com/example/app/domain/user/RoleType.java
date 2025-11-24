package com.example.app.domain.user;

/**
 * 역할 타입 열거형
 * 
 * 시스템에서 사용할 기본 역할들을 정의합니다.
 * 
 * 역할 설명:
 * - ADMIN: 관리자 권한 (모든 기능 접근 가능)
 * - USER: 일반 사용자 권한 (기본 기능 접근)
 * 
 * 사용 예시:
 * Role adminRole = Role.builder()
 *     .code(RoleType.ADMIN.getCode())
 *     .name(RoleType.ADMIN.getName())
 *     .build();
 */
public enum RoleType {
    /**
     * 관리자 역할
     * 코드: "ROLE_ADMIN"
     * 이름: "관리자"
     */
    ADMIN("ROLE_ADMIN", "관리자"),
    
    /**
     * 일반 사용자 역할
     * 코드: "ROLE_USER"
     * 이름: "일반 사용자"
     */
    USER("ROLE_USER", "일반 사용자");

    private final String code;
    private final String name;

    RoleType(String code, String name) {
        this.code = code;
        this.name = name;
    }

    /**
     * 역할 코드 반환
     * 예: "ROLE_ADMIN", "ROLE_USER"
     */
    public String getCode() {
        return code;
    }

    /**
     * 역할 이름 반환
     * 예: "관리자", "일반 사용자"
     */
    public String getName() {
        return name;
    }
}

