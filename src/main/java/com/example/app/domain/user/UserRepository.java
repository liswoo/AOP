package com.example.app.domain.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
     * 사용자명으로 사용자 조회 (roles 포함)
     * 
     * @EntityGraph를 사용하여 roles를 함께 로드합니다.
     * 이렇게 하면 LazyInitializationException을 방지할 수 있습니다.
     * 
     * @param username 사용자명
     * @return Optional<User> (없으면 Optional.empty())
     */
    @EntityGraph(attributePaths = {"roles"})
    Optional<User> findByUsername(String username);

    /**
     * ID로 사용자 조회 (roles 포함)
     * 
     * @EntityGraph를 사용하여 roles를 함께 로드합니다.
     * 이렇게 하면 LazyInitializationException을 방지할 수 있습니다.
     * 
     * @Query를 사용하여 명시적으로 쿼리를 작성합니다.
     * Spring Data JPA의 메서드 네이밍 규칙을 피하기 위해 @Query를 사용합니다.
     * 
     * @param id 사용자 ID
     * @return Optional<User>
     */
    @EntityGraph(attributePaths = {"roles"})
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);

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

    /**
     * 키워드로 사용자 검색 (페이지네이션 지원)
     * 
     * username 또는 name에 키워드가 포함된 사용자를 검색합니다.
     * 키워드가 null이거나 빈 문자열이면 모든 사용자를 반환합니다.
     * 
     * @EntityGraph를 사용하여 roles를 함께 로드합니다.
     * 이렇게 하면 LazyInitializationException을 방지할 수 있습니다.
     * 
     * @param keyword 검색 키워드 (username 또는 name에 LIKE 검색)
     * @param pageable 페이지네이션 정보
     * @return 사용자 페이지
     */
    @EntityGraph(attributePaths = {"roles"})
    @Query("SELECT u FROM User u WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    /**
     * ADMIN 역할을 가진 활성 사용자 수 조회
     * 
     * 마지막 ADMIN 보호 정책을 위해 사용됩니다.
     * 시스템에 ADMIN 역할을 가진 활성 사용자가 몇 명인지 확인합니다.
     * 
     * @return ADMIN 역할을 가진 활성 사용자 수
     */
    @Query("SELECT COUNT(DISTINCT u) FROM User u " +
           "JOIN u.roles r " +
           "WHERE r.code = 'ROLE_ADMIN' AND u.active = true")
    long countActiveAdminUsers();
}

