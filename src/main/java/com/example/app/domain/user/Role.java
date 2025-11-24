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
 * 예: "관리자", "일반사용자", "게스트" 등
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
     * 예: "ROLE_ADMIN", "ROLE_USER"
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
     * 역할 설명
     */
    @Column(length = 500)
    private String description;

    /**
     * 활성화 여부
     */
    @Column(nullable = false)
    private Boolean active = true;

    @Builder
    public Role(String code, String name, String description, Boolean active) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.active = active != null ? active : true;
    }
}

