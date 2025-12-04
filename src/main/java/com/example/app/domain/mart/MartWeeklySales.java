package com.example.app.domain.mart;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 주별 매출 마트 테이블 (Mart Weekly Sales)
 * 
 * DW의 FactSales를 주별로 집계한 마트 테이블입니다.
 */
@Entity
@Table(name = "mart_weekly_sales", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"week_start_date"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MartWeeklySales extends BaseEntity {

    /**
     * 주 시작일
     */
    @Column(name = "week_start_date", nullable = false, unique = true)
    private LocalDate weekStartDate;

    /**
     * 주 종료일
     */
    @Column(name = "week_end_date", nullable = false)
    private LocalDate weekEndDate;

    /**
     * 년도
     */
    @Column(nullable = false)
    private Integer year;

    /**
     * 주차 (1-53)
     */
    @Column(nullable = false)
    private Integer week;

    /**
     * 총 매출액
     */
    @Column(nullable = false)
    private Double totalSalesAmount;

    /**
     * 총 주문 건수
     */
    @Column(nullable = false)
    private Long totalOrderCount;

    /**
     * 총 주문 수량
     */
    @Column(nullable = false)
    private Long totalQuantity;

    /**
     * 총 고객 수
     */
    @Column(nullable = false)
    private Long totalCustomerCount;

    /**
     * 평균 주문 금액
     */
    @Column(nullable = false)
    private Double avgOrderAmount;

    /**
     * 집계 일시
     */
    @Column(nullable = false)
    private LocalDate aggregatedDate;
}






