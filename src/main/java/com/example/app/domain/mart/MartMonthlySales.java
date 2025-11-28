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
 * 월별 매출 마트 테이블 (Mart Monthly Sales)
 * 
 * DW의 FactSales를 월별로 집계한 마트 테이블입니다.
 */
@Entity
@Table(name = "mart_monthly_sales", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"year", "month"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MartMonthlySales extends BaseEntity {

    /**
     * 년도
     */
    @Column(nullable = false)
    private Integer year;

    /**
     * 월 (1-12)
     */
    @Column(nullable = false)
    private Integer month;

    /**
     * 년월 (YYYY-MM 형식)
     */
    @Column(length = 7, nullable = false, unique = true)
    private String yearMonth;

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

