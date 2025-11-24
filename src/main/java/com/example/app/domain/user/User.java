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
 * 이 엔티티는 BaseEntity를 상속받아 다음 필드를 자동으로 가집니다:
 * - id: 기본키 (자동 증가)
 * - createdAt: 생성 시간
 * - updatedAt: 수정 시간
 * 
 * 주요 필드 구조:
 * - username: 로그인 아이디 (고유값, 필수)
 * - password: 비밀번호 (BCrypt 해시로 암호화되어 저장됨, 필수)
 * - roles: 사용자가 가진 역할들 (다대다 관계)
 * - email: 이메일 주소 (선택사항, 고유값)
 * - name: 사용자 이름 (선택사항)
 * - active: 활성화 여부 (기본값: true)
 * 
 * 비밀번호는 UserService에서 BCryptPasswordEncoder를 사용하여
 * 암호화된 후 저장됩니다. 평문 비밀번호는 절대 저장하지 않습니다.
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)  // JPA는 기본 생성자가 필요함
public class User extends BaseEntity {

    /**
     * 로그인 아이디 (고유값, 필수)
     * 
     * 사용자가 로그인할 때 사용하는 고유한 식별자입니다.
     * 예: "admin", "user123"
     */
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    /**
     * 비밀번호 (필수)
     * 
     * BCrypt 해시로 암호화되어 저장됩니다.
     * 평문 비밀번호는 절대 저장하지 않으며,
     * UserService.createUser() 메서드에서 자동으로 암호화됩니다.
     * 
     * 예: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
     */
    @Column(nullable = false, length = 255)  // BCrypt 해시는 길기 때문에 255로 설정
    private String password;

    /**
     * 사용자가 가진 역할들 (다대다 관계)
     * 
     * 한 사용자는 여러 역할을 가질 수 있고,
     * 한 역할은 여러 사용자에게 할당될 수 있습니다.
     * 
     * 예: 한 사용자가 "ADMIN"과 "USER" 역할을 동시에 가질 수 있음
     * 
     * 중간 테이블: user_roles
     * - user_id: User 테이블의 외래키
     * - role_id: Role 테이블의 외래키
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",  // 중간 테이블 이름
        joinColumns = @JoinColumn(name = "user_id"),  // User 테이블의 외래키
        inverseJoinColumns = @JoinColumn(name = "role_id")  // Role 테이블의 외래키
    )
    private Set<Role> roles = new HashSet<>();

    /**
     * 이메일 주소 (선택사항, 고유값)
     * 
     * 사용자 식별 및 연락용으로 사용됩니다.
     * 필수는 아니지만, 고유값이어야 합니다.
     */
    @Column(unique = true, length = 100)
    private String email;

    /**
     * 사용자 이름 (선택사항)
     * 
     * 화면에 표시될 사용자의 실제 이름입니다.
     */
    @Column(length = 50)
    private String name;

    /**
     * 활성화 여부 (기본값: true)
     * 
     * false로 설정하면 해당 사용자는 로그인할 수 없습니다.
     * 삭제 대신 이 필드를 false로 설정하는 소프트 삭제 방식도 가능합니다.
     */
    @Column(nullable = false)
    private Boolean active = true;

    /**
     * 빌더 패턴을 사용한 생성자
     * 
     * 주의: password는 평문으로 전달되며, UserService에서 BCrypt로 암호화됩니다.
     * 
     * 사용 예시:
     * User user = User.builder()
     *     .username("admin")
     *     .password("admin1234")  // 평문 비밀번호 (서비스에서 암호화됨)
     *     .email("admin@example.com")
     *     .name("관리자")
     *     .build();
     */
    @Builder
    public User(String username, String email, String password, String name, Boolean active) {
        this.username = username;
        this.email = email;
        this.password = password;  // 주의: 평문 비밀번호는 UserService에서 암호화해야 함
        this.name = name;
        this.active = active != null ? active : true;
    }

    /**
     * 역할 추가
     * 
     * @param role 추가할 역할
     */
    public void addRole(Role role) {
        this.roles.add(role);
    }

    /**
     * 역할 제거
     * 
     * @param role 제거할 역할
     */
    public void removeRole(Role role) {
        this.roles.remove(role);
    }
}

