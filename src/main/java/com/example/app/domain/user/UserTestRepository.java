package com.example.app.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * UserTest 엔티티를 위한 Repository 인터페이스
 * 
 * JpaRepository를 상속받아 기본적인 CRUD 메서드를 자동으로 제공받습니다:
 * - save(): 저장 및 수정
 * - findById(): ID로 조회
 * - findAll(): 전체 조회
 * - deleteById(): ID로 삭제
 * - count(): 전체 개수
 * 
 * 추가적인 쿼리 메서드도 정의할 수 있습니다.
 */
@Repository
public interface UserTestRepository extends JpaRepository<UserTest, Long> {

    /**
     * 이름으로 조회
     * 
     * @param name 조회할 이름
     * @return UserTest 엔티티 (없으면 null)
     */
    Optional<UserTest> findByName(String name);

    /**
     * 이메일로 조회
     * 
     * @param email 조회할 이메일
     * @return UserTest 엔티티 (없으면 null)
     */
    Optional<UserTest> findByEmail(String email);

    /**
     * 활성화된 사용자만 조회
     * 
     * @param active 활성화 여부
     * @return 활성화된 UserTest 리스트
     */
    List<UserTest> findByActive(Boolean active);

    /**
     * 이름에 특정 문자열이 포함된 사용자 조회 (대소문자 무시)
     * 
     * @param name 검색할 이름 (부분 일치)
     * @return 검색된 UserTest 리스트
     */
    List<UserTest> findByNameContainingIgnoreCase(String name);

    /**
     * 커스텀 쿼리: 활성화된 사용자 수 조회
     * 
     * @return 활성화된 사용자 수
     */
    @Query("SELECT COUNT(u) FROM UserTest u WHERE u.active = true")
    long countActiveUsers();
}


