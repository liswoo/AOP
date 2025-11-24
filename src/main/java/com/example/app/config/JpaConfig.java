package com.example.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA 설정 클래스
 * 
 * @EnableJpaAuditing: JPA Auditing 기능을 활성화합니다.
 * 
 * JPA Auditing이란?
 * - 엔티티의 생성 시간(createdAt), 수정 시간(updatedAt) 등을
 *   자동으로 관리하는 기능입니다.
 * - BaseEntity에서 @CreatedDate, @LastModifiedDate를 사용하려면 필요합니다.
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
    // JPA Auditing 활성화만 하면 되므로 별도 설정 없음
}

