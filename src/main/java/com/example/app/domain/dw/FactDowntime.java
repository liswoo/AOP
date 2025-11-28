package com.example.app.domain.dw;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 비가동 팩트 테이블 (Fact Downtime)
 * 
 * DW의 비가동 팩트 테이블입니다.
 * 비가동 실적 데이터를 저장합니다.
 */
@Entity
@Table(name = "fact_downtime")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FactDowntime extends BaseEntity {

    /**
     * 날짜 ID (차원 테이블 참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "date_id", nullable = false)
    private DimDate date;

    /**
     * 거래일자
     */
    @Column(nullable = false)
    private LocalDate transactionDate;

    /**
     * 라인명 (계획, 실적, 1Line, 2Line, 3Line, 4Line, 5Line)
     */
    @Column(nullable = false, length = 20)
    private String lineName;

    /**
     * 비가동 시간 (시간)
     */
    @Column(nullable = false)
    private Double downtimeHours;

    /**
     * 비가동 비용 (백만원)
     */
    @Column(nullable = false)
    private Double downtimeCost;

    /**
     * 비고
     */
    @Column(length = 200)
    private String remarks;
}

