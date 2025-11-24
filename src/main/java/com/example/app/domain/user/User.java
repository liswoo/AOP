package com.example.app.domain.user;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

/**
 * 사용자(User) 엔티티
 * 
 * 이 클래스는 데이터베이스의 users 테이블과 매핑됩니다.
 * 
 * 주요 필드:
 * - username: 사용자 아이디 (고유값)
 * - email: 이메일 주소
 * - password: 비밀번호 (나중에 암호화 처리 예정)
 * - roles: 사용자가 가진 역할들 (다대다 관계)
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)  // JPA는 기본 생성자가 필요함
public class User extends BaseEntity {

    /**
     * 사용자 아이디 (고유값, 필수)
     */
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    /**
     * 이메일 주소 (고유값, 필수)
     */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /**
     * 비밀번호 (필수)
     * TODO: 나중에 BCrypt 등으로 암호화 처리 예정
     */
    @Column(nullable = false)
    private String password;

    /**
     * 사용자 이름
     */
    @Column(length = 50)
    private String name;

    /**
     * 활성화 여부 (기본값: true)
     */
    @Column(nullable = false)
    private Boolean active = true;

    /**
     * 사용자와 역할(Role)의 다대다 관계
     * 
     * 한 사용자는 여러 역할을 가질 수 있고,
     * 한 역할은 여러 사용자에게 할당될 수 있습니다.
     * 
     * 예: "관리자" 역할과 "사용자" 역할을 동시에 가질 수 있음
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",  // 중간 테이블 이름
        joinColumns = @JoinColumn(name = "user_id"),  // User 테이블의 외래키
        inverseJoinColumns = @JoinColumn(name = "role_id")  // Role 테이블의 외래키
    )
    private Set<Role> roles = new HashSet<>();

    /**
     * 빌더 패턴을 사용한 생성자
     * 
     * 사용 예시:
     * User user = User.builder()
     *     .username("admin")
     *     .email("admin@example.com")
     *     .password("password")
     *     .name("관리자")
     *     .build();
     */
    @Builder
    public User(String username, String email, String password, String name, Boolean active) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.name = name;
        this.active = active != null ? active : true;
    }

    /**
     * 역할 추가
     */
    public void addRole(Role role) {
        this.roles.add(role);
    }

    /**
     * 역할 제거
     */
    public void removeRole(Role role) {
        this.roles.remove(role);
    }
}

