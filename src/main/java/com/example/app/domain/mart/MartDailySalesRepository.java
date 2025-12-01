package com.example.app.domain.mart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 일별 매출 마트 테이블 리포지토리
 */
@Repository
public interface MartDailySalesRepository extends JpaRepository<MartDailySales, Long> {

    /**
     * 날짜 범위로 조회
     */
    List<MartDailySales> findBySalesDateBetweenOrderBySalesDateAsc(
            LocalDate from, LocalDate to);

    /**
     * 특정 날짜로 조회
     */
    Optional<MartDailySales> findBySalesDate(LocalDate date);

    /**
     * 날짜 범위로 매출 합계 조회
     */
    @Query("SELECT COALESCE(SUM(m.totalSalesAmount), 0.0) FROM MartDailySales m " +
           "WHERE m.salesDate BETWEEN :from AND :to")
    Double sumTotalSalesAmountByDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * 날짜 범위로 주문 건수 합계 조회
     */
    @Query("SELECT COALESCE(SUM(m.totalOrderCount), 0) FROM MartDailySales m " +
           "WHERE m.salesDate BETWEEN :from AND :to")
    Long sumTotalOrderCountByDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}


