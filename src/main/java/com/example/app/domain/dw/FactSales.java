package com.example.app.domain.dw;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 매출 팩트 테이블 (Fact Sales)
 * 
 * DW의 매출 팩트 테이블입니다.
 * 실제 거래 데이터를 저장합니다.
 */
@Entity
@Table(name = "fact_sales")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FactSales extends BaseEntity {

    /**
     * 날짜 ID (차원 테이블 참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "date_id", nullable = false)
    private DimDate date;

    /**
     * 거래일자 (직접 저장, 조회 성능 향상)
     */
    @Column(nullable = false)
    private LocalDate transactionDate;

    /**
     * 매출 금액
     */
    @Column(nullable = false)
    private Double salesAmount;

    /**
     * 주문 수량
     */
    @Column(nullable = false)
    private Integer quantity;

    /**
     * 주문 건수
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer orderCount = 1;

    /**
     * 고객 수 (신규 고객 포함)
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer customerCount = 0;

    /**
     * 카테고리 (선택사항)
     */
    @Column(length = 50)
    private String category;

    /**
     * 제품 ID (선택사항, 향후 DimProduct와 연동)
     */
    @Column(length = 50)
    private String productId;

    /**
     * 비고
     */
    @Column(length = 200)
    private String remarks;
}




