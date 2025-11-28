package com.example.app.domain.mart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 일별 비가동 마트 테이블 리포지토리
 */
@Repository
public interface MartDailyDowntimeRepository extends JpaRepository<MartDailyDowntime, Long> {

    /**
     * 날짜 범위로 조회
     */
    List<MartDailyDowntime> findByDowntimeDateBetweenOrderByDowntimeDateAsc(
            LocalDate from, LocalDate to);

    /**
     * 날짜 범위와 라인명으로 조회
     */
    List<MartDailyDowntime> findByDowntimeDateBetweenAndLineNameOrderByDowntimeDateAsc(
            LocalDate from, LocalDate to, String lineName);

    /**
     * 날짜 범위로 라인명별 합계 조회
     */
    @Query("SELECT m.lineName, COALESCE(SUM(m.totalDowntimeCost), 0.0) FROM MartDailyDowntime m " +
           "WHERE m.downtimeDate BETWEEN :from AND :to " +
           "GROUP BY m.lineName")
    List<Object[]> sumTotalDowntimeCostByLineNameAndDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}

