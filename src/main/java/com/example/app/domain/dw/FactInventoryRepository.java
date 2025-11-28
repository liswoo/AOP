package com.example.app.domain.dw;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 재고 팩트 테이블 리포지토리
 */
@Repository
public interface FactInventoryRepository extends JpaRepository<FactInventory, Long> {

    /**
     * 날짜 범위로 조회
     */
    List<FactInventory> findByTransactionDateBetweenOrderByTransactionDateAsc(
            LocalDate from, LocalDate to);

    /**
     * 날짜 범위와 재고 유형으로 조회
     */
    List<FactInventory> findByTransactionDateBetweenAndInventoryTypeOrderByTransactionDateAsc(
            LocalDate from, LocalDate to, String inventoryType);

    /**
     * 날짜 범위로 재고 유형별 합계 조회
     */
    @Query("SELECT f.inventoryType, COALESCE(SUM(f.quantity), 0.0) FROM FactInventory f " +
           "WHERE f.transactionDate BETWEEN :from AND :to " +
           "GROUP BY f.inventoryType")
    List<Object[]> sumQuantityByInventoryTypeAndDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}

