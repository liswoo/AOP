package com.example.app.domain.dw;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 재고 팩트 테이블 (Fact Inventory)
 * 
 * DW의 재고 팩트 테이블입니다.
 * 재고 변동 데이터를 저장합니다.
 */
@Entity
@Table(name = "fact_inventory")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FactInventory extends BaseEntity {

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
     * 재고 유형 (전월재고, 입고, 출하내수, 출하수출, 기타, 월말재고)
     */
    @Column(nullable = false, length = 20)
    private String inventoryType;

    /**
     * 재고 수량 (MT)
     */
    @Column(nullable = false)
    private Double quantity;

    /**
     * 비고
     */
    @Column(length = 200)
    private String remarks;
}




