package com.example.app.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * User 엔티티에 대한 데이터베이스 접근을 담당하는 리포지토리
 * 
 * Spring Data JPA가 자동으로 구현체를 생성합니다.
 * 기본적인 CRUD 메서드(findById, save, delete 등)는 자동으로 제공됩니다.
 * 
 * 추가로 필요한 쿼리 메서드를 선언만 하면 Spring이 자동으로 구현해줍니다.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 사용자명으로 사용자 조회
     * Spring Data JPA가 메서드 이름을 분석하여 자동으로 쿼리를 생성합니다.
     * 
     * @param username 사용자명
     * @return Optional<User> (없으면 Optional.empty())
     */
    Optional<User> findByUsername(String username);

    /**
     * 이메일로 사용자 조회
     * 
     * @param email 이메일
     * @return Optional<User>
     */
    Optional<User> findByEmail(String email);

    /**
     * 사용자명으로 사용자 존재 여부 확인
     * 
     * @param username 사용자명
     * @return 존재하면 true
     */
    boolean existsByUsername(String username);

    /**
     * 이메일로 사용자 존재 여부 확인
     * 
     * @param email 이메일
     * @return 존재하면 true
     */
    boolean existsByEmail(String email);

    /**
     * 사용자명 또는 이메일로 사용자 존재 여부 확인
     * 
     * @param username 사용자명
     * @param email 이메일
     * @return 존재하면 true
     */
    boolean existsByUsernameOrEmail(String username, String email);
}

