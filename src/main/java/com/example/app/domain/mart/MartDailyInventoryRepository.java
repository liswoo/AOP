package com.example.app.domain.mart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 일별 재고 마트 테이블 리포지토리
 */
@Repository
public interface MartDailyInventoryRepository extends JpaRepository<MartDailyInventory, Long> {

    /**
     * 날짜와 재고 유형으로 조회
     */
    java.util.Optional<MartDailyInventory> findByInventoryDateAndInventoryType(
            LocalDate inventoryDate, String inventoryType);

    /**
     * 날짜 범위로 조회
     */
    List<MartDailyInventory> findByInventoryDateBetweenOrderByInventoryDateAsc(
            LocalDate from, LocalDate to);

    /**
     * 날짜 범위와 재고 유형으로 조회
     */
    List<MartDailyInventory> findByInventoryDateBetweenAndInventoryTypeOrderByInventoryDateAsc(
            LocalDate from, LocalDate to, String inventoryType);

    /**
     * 날짜 범위로 재고 유형별 합계 조회
     */
    @Query("SELECT m.inventoryType, COALESCE(SUM(m.totalQuantity), 0.0) FROM MartDailyInventory m " +
           "WHERE m.inventoryDate BETWEEN :from AND :to " +
           "GROUP BY m.inventoryType")
    List<Object[]> sumTotalQuantityByInventoryTypeAndDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}

