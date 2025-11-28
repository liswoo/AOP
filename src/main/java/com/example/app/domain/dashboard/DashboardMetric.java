package com.example.app.domain.dashboard;

import com.example.app.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 대시보드 메트릭 데이터 엔티티
 * 
 * 대시보드에 표시할 통계 데이터를 저장합니다.
 */
@Entity
@Table(name = "dashboard_metrics", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"date", "metric_type", "category"}),
    @UniqueConstraint(columnNames = {"date", "metric_type", "dataset_label"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetric extends BaseEntity {

    /**
     * 메트릭 타입 열거형
     */
    public enum MetricType {
        SALES,           // 매출
        PROFIT,          // 이익
        QUALITY,         // 품질
        INVENTORY,       // 재고
        PERSONNEL,       // 인원
        DOWNTIME         // 비가동
    }

    /**
     * 날짜
     */
    @Column(nullable = false)
    private LocalDate date;

    /**
     * 메트릭 타입
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false)
    private MetricType metricType;

    /**
     * 값
     */
    @Column(nullable = false)
    private Double value;

    /**
     * 카테고리 (선택사항)
     */
    @Column(length = 50)
    private String category;

    /**
     * 데이터셋 라벨 (선택사항)
     */
    @Column(name = "dataset_label", length = 100)
    private String datasetLabel;
}

