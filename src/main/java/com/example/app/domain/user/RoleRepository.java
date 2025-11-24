package com.example.app.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Role 엔티티에 대한 데이터베이스 접근을 담당하는 리포지토리
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * 역할 코드로 역할 조회
     * 
     * @param code 역할 코드 (예: "ROLE_ADMIN")
     * @return Optional<Role>
     */
    Optional<Role> findByCode(String code);

    /**
     * 역할 코드로 존재 여부 확인
     * 
     * @param code 역할 코드
     * @return 존재하면 true
     */
    boolean existsByCode(String code);
}

