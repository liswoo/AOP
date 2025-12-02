package com.example.app.domain.mart;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 일별 재고 마트 테이블 (Mart Daily Inventory)
 * 
 * DW의 FactInventory를 일별로 집계한 마트 테이블입니다.
 */
@Entity
@Table(name = "mart_daily_inventory", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"inventory_date", "inventory_type"})
})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MartDailyInventory extends BaseEntity {

    /**
     * 재고일자
     */
    @Column(name = "inventory_date", nullable = false)
    private LocalDate inventoryDate;

    /**
     * 재고 유형 (전월재고, 입고, 출하내수, 출하수출, 기타, 월말재고)
     */
    @Column(name = "inventory_type", nullable = false, length = 20)
    private String inventoryType;

    /**
     * 재고 수량 합계 (MT)
     */
    @Column(nullable = false)
    private Double totalQuantity;

    /**
     * 집계 일시
     */
    @Column(nullable = false)
    private LocalDate aggregatedDate;
}






