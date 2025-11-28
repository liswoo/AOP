package com.example.app.domain.mart;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 일별 매출 마트 테이블 (Mart Daily Sales)
 * 
 * DW의 FactSales를 일별로 집계한 마트 테이블입니다.
 * 대시보드 조회 성능 최적화를 위한 사전 집계 데이터입니다.
 */
@Entity
@Table(name = "mart_daily_sales", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"sales_date"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MartDailySales extends BaseEntity {

    /**
     * 매출일자
     */
    @Column(name = "sales_date", nullable = false, unique = true)
    private LocalDate salesDate;

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
     * 집계 일시 (마지막 집계 시간)
     */
    @Column(nullable = false)
    private LocalDate aggregatedDate;
}

