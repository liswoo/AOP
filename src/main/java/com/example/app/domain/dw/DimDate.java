package com.example.app.domain.dw;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 날짜 차원 테이블 (Dimension Date)
 * 
 * DW의 날짜 차원 테이블입니다.
 * 날짜별로 년, 월, 주, 요일 등의 정보를 저장합니다.
 */
@Entity
@Table(name = "dim_date", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"date"})
})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DimDate extends BaseEntity {

    /**
     * 날짜
     */
    @Column(nullable = false, unique = true)
    private LocalDate date;

    /**
     * 년도
     */
    @Column(nullable = false)
    private Integer year;

    /**
     * 분기 (1, 2, 3, 4)
     */
    @Column(nullable = false)
    private Integer quarter;

    /**
     * 월 (1-12)
     */
    @Column(nullable = false)
    private Integer month;

    /**
     * 주 (1-53)
     */
    @Column(nullable = false)
    private Integer week;

    /**
     * 일 (1-31)
     */
    @Column(nullable = false)
    private Integer day;

    /**
     * 요일 (1=월요일, 7=일요일)
     */
    @Column(nullable = false)
    private Integer dayOfWeek;

    /**
     * 요일명 (월요일, 화요일, ...)
     */
    @Column(length = 10)
    private String dayName;

    /**
     * 주말 여부
     */
    @Column(nullable = false)
    private Boolean isWeekend;

    /**
     * 공휴일 여부
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isHoliday = false;

    /**
     * 년월 (YYYY-MM 형식)
     */
    @Column(length = 7)
    private String yearMonth;
}

