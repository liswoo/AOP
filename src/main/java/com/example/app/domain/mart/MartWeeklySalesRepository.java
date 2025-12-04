package com.example.app.domain.mart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 주별 매출 마트 테이블 리포지토리
 */
@Repository
public interface MartWeeklySalesRepository extends JpaRepository<MartWeeklySales, Long> {

    /**
     * 주 시작일로 조회
     */
    java.util.Optional<MartWeeklySales> findByWeekStartDate(LocalDate weekStartDate);

    /**
     * 날짜 범위로 조회
     */
    @Query("SELECT m FROM MartWeeklySales m " +
           "WHERE m.weekStartDate <= :to AND m.weekEndDate >= :from " +
           "ORDER BY m.weekStartDate ASC")
    List<MartWeeklySales> findByDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}






