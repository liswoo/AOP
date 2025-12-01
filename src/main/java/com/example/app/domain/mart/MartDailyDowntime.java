package com.example.app.domain.mart;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 일별 비가동 마트 테이블 (Mart Daily Downtime)
 * 
 * DW의 FactDowntime을 일별로 집계한 마트 테이블입니다.
 */
@Entity
@Table(name = "mart_daily_downtime", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"downtime_date", "line_name"})
})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MartDailyDowntime extends BaseEntity {

    /**
     * 비가동일자
     */
    @Column(name = "downtime_date", nullable = false)
    private LocalDate downtimeDate;

    /**
     * 라인명 (계획, 실적, 1Line, 2Line, 3Line, 4Line, 5Line)
     */
    @Column(name = "line_name", nullable = false, length = 20)
    private String lineName;

    /**
     * 비가동 시간 합계 (시간)
     */
    @Column(nullable = false)
    private Double totalDowntimeHours;

    /**
     * 비가동 비용 합계 (백만원)
     */
    @Column(nullable = false)
    private Double totalDowntimeCost;

    /**
     * 집계 일시
     */
    @Column(nullable = false)
    private LocalDate aggregatedDate;
}


