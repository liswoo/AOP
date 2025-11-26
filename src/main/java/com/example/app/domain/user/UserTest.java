package com.example.app.domain.user;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * PostgreSQL 연결 테스트용 엔티티
 * 
 * 이 엔티티는 데이터베이스 연결 및 JPA 설정이 정상적으로 작동하는지
 * 확인하기 위한 테스트 목적으로 생성되었습니다.
 * 
 * 애플리케이션 실행 시 user_test 테이블이 자동으로 생성됩니다.
 * 
 * @see BaseEntity - id, createdAt, updatedAt 필드를 상속받습니다.
 */
@Entity
@Table(name = "user_test")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserTest extends BaseEntity {

    /**
     * 테스트 사용자 이름
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 테스트 이메일
     */
    @Column(length = 200)
    private String email;

    /**
     * 테스트 설명
     */
    @Column(length = 500)
    private String description;

    /**
     * 활성화 여부
     */
    @Column(nullable = false)
    private Boolean active = true;

    /**
     * 빌더 패턴을 사용한 생성자
     */
    @Builder
    public UserTest(String name, String email, String description, Boolean active) {
        this.name = name;
        this.email = email;
        this.description = description;
        this.active = active != null ? active : true;
    }

    /**
     * 이름 수정
     */
    public void updateName(String name) {
        this.name = name;
    }

    /**
     * 이메일 수정
     */
    public void updateEmail(String email) {
        this.email = email;
    }

    /**
     * 설명 수정
     */
    public void updateDescription(String description) {
        this.description = description;
    }

    /**
     * 활성화 상태 수정
     */
    public void updateActive(Boolean active) {
        this.active = active;
    }
}

