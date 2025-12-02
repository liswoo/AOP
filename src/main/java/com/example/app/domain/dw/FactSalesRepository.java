package com.example.app.domain.dw;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 매출 팩트 테이블 리포지토리
 */
@Repository
public interface FactSalesRepository extends JpaRepository<FactSales, Long> {

    /**
     * 날짜 범위로 조회
     */
    List<FactSales> findByTransactionDateBetweenOrderByTransactionDateAsc(
            LocalDate from, LocalDate to);

    /**
     * 날짜 범위로 매출 합계 조회
     */
    @Query("SELECT COALESCE(SUM(f.salesAmount), 0.0) FROM FactSales f " +
           "WHERE f.transactionDate BETWEEN :from AND :to")
    Double sumSalesAmountByDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * 날짜 범위로 주문 건수 합계 조회
     */
    @Query("SELECT COALESCE(SUM(f.orderCount), 0) FROM FactSales f " +
           "WHERE f.transactionDate BETWEEN :from AND :to")
    Long sumOrderCountByDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * 날짜 범위로 고객 수 합계 조회
     */
    @Query("SELECT COALESCE(SUM(f.customerCount), 0) FROM FactSales f " +
           "WHERE f.transactionDate BETWEEN :from AND :to")
    Long sumCustomerCountByDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}



