package com.example.app.domain.mart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 월별 매출 마트 테이블 리포지토리
 */
@Repository
public interface MartMonthlySalesRepository extends JpaRepository<MartMonthlySales, Long> {

    /**
     * 년월로 조회
     */
    Optional<MartMonthlySales> findByYearMonth(String yearMonth);

    /**
     * 날짜 범위로 조회
     */
    @Query("SELECT m FROM MartMonthlySales m " +
           "WHERE m.yearMonth >= :fromYearMonth AND m.yearMonth <= :toYearMonth " +
           "ORDER BY m.yearMonth ASC")
    List<MartMonthlySales> findByYearMonthRange(
            @Param("fromYearMonth") String fromYearMonth,
            @Param("toYearMonth") String toYearMonth);
}

