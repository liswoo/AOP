package com.example.app.domain.common;

import jakarta.persistence.*;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 모든 엔티티가 상속받을 기본 엔티티 클래스
 * 
 * 이 클래스를 상속받으면 자동으로 다음 필드가 추가됩니다:
 * - id: 기본키 (자동 증가)
 * - createdAt: 생성 시간 (자동 설정)
 * - updatedAt: 수정 시간 (자동 업데이트)
 * 
 * 사용 예시:
 * @Entity
 * public class User extends BaseEntity {
 *     // User의 필드들...
 * }
 */
@Getter
@MappedSuperclass  // 이 클래스는 테이블로 생성되지 않고, 상속받은 클래스에 필드가 추가됨
@EntityListeners(AuditingEntityListener.class)  // JPA Auditing 활성화
public abstract class BaseEntity {

    /**
     * 기본키 (Primary Key)
     * 자동 증가 방식으로 생성됩니다.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 생성 시간
     * 엔티티가 처음 저장될 때 자동으로 현재 시간이 설정됩니다.
     */
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 수정 시간
     * 엔티티가 수정될 때마다 자동으로 현재 시간으로 업데이트됩니다.
     */
    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

