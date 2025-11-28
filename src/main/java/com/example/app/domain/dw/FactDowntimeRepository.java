package com.example.app.domain.dw;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 비가동 팩트 테이블 리포지토리
 */
@Repository
public interface FactDowntimeRepository extends JpaRepository<FactDowntime, Long> {

    /**
     * 날짜 범위로 조회
     */
    List<FactDowntime> findByTransactionDateBetweenOrderByTransactionDateAsc(
            LocalDate from, LocalDate to);

    /**
     * 날짜 범위와 라인명으로 조회
     */
    List<FactDowntime> findByTransactionDateBetweenAndLineNameOrderByTransactionDateAsc(
            LocalDate from, LocalDate to, String lineName);

    /**
     * 날짜 범위로 라인명별 합계 조회
     */
    @Query("SELECT f.lineName, COALESCE(SUM(f.downtimeCost), 0.0) FROM FactDowntime f " +
           "WHERE f.transactionDate BETWEEN :from AND :to " +
           "GROUP BY f.lineName")
    List<Object[]> sumDowntimeCostByLineNameAndDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}

