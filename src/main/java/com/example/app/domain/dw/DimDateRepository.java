package com.example.app.domain.dw;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

/**
 * 날짜 차원 테이블 리포지토리
 */
@Repository
public interface DimDateRepository extends JpaRepository<DimDate, Long> {
    
    /**
     * 날짜로 조회
     */
    Optional<DimDate> findByDate(LocalDate date);
    
    /**
     * 날짜 존재 여부 확인
     */
    boolean existsByDate(LocalDate date);
}




