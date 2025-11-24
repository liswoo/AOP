package com.example.app.domain.user;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 역할(Role) 엔티티
 * 
 * 사용자에게 부여할 수 있는 역할을 정의합니다.
 * 
 * 기본 역할:
 * - ADMIN: 관리자 권한 (모든 기능 접근 가능)
 * - USER: 일반 사용자 권한 (기본 기능 접근)
 * 
 * 이 엔티티는 BaseEntity를 상속받아 다음 필드를 자동으로 가집니다:
 * - id: 기본키 (자동 증가)
 * - createdAt: 생성 시간
 * - updatedAt: 수정 시간
 * 
 * 나중에 권한(Permission)과 연결하여 세밀한 권한 관리가 가능합니다.
 */
@Entity
@Table(name = "roles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Role extends BaseEntity {

    /**
     * 역할 코드 (고유값, 필수)
     * 
     * Spring Security에서 사용하는 형식: "ROLE_" 접두사 사용
     * 예: "ROLE_ADMIN", "ROLE_USER"
     * 
     * RoleType enum을 사용하여 일관성 있게 관리합니다.
     */
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /**
     * 역할 이름
     * 예: "관리자", "일반 사용자"
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 역할 설명 (선택사항)
     */
    @Column(length = 500)
    private String description;

    /**
     * 활성화 여부 (기본값: true)
     * false로 설정하면 해당 역할을 사용할 수 없습니다.
     */
    @Column(nullable = false)
    private Boolean active = true;

    /**
     * 빌더 패턴을 사용한 생성자
     * 
     * 사용 예시:
     * Role adminRole = Role.builder()
     *     .code(RoleType.ADMIN.getCode())
     *     .name(RoleType.ADMIN.getName())
     *     .description("시스템 관리자")
     *     .build();
     */
    @Builder
    public Role(String code, String name, String description, Boolean active) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.active = active != null ? active : true;
    }
}

