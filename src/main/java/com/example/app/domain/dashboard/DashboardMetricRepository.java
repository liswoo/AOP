package com.example.app.domain.dashboard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 대시보드 메트릭 데이터 리포지토리
 */
@Repository
public interface DashboardMetricRepository extends JpaRepository<DashboardMetric, Long> {

    /**
     * 날짜 범위와 메트릭 타입으로 조회
     * 
     * @param from 시작일
     * @param to 종료일
     * @param metricType 메트릭 타입
     * @return 메트릭 데이터 목록
     */
    List<DashboardMetric> findByDateBetweenAndMetricTypeOrderByDateAsc(
            LocalDate from, LocalDate to, DashboardMetric.MetricType metricType);

    /**
     * 날짜 범위, 메트릭 타입, 카테고리로 조회
     * 
     * @param from 시작일
     * @param to 종료일
     * @param metricType 메트릭 타입
     * @param category 카테고리
     * @return 메트릭 데이터 목록
     */
    List<DashboardMetric> findByDateBetweenAndMetricTypeAndCategoryOrderByDateAsc(
            LocalDate from, LocalDate to, DashboardMetric.MetricType metricType, String category);

    /**
     * 날짜 범위와 메트릭 타입으로 집계 (합계)
     * 
     * @param from 시작일
     * @param to 종료일
     * @param metricType 메트릭 타입
     * @return 합계 값
     */
    @Query("SELECT COALESCE(SUM(d.value), 0.0) FROM DashboardMetric d " +
           "WHERE d.date BETWEEN :from AND :to AND d.metricType = :metricType")
    Double sumByDateBetweenAndMetricType(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("metricType") DashboardMetric.MetricType metricType);

    /**
     * 날짜 범위와 메트릭 타입으로 집계 (평균)
     * 
     * @param from 시작일
     * @param to 종료일
     * @param metricType 메트릭 타입
     * @return 평균 값
     */
    @Query("SELECT COALESCE(AVG(d.value), 0.0) FROM DashboardMetric d " +
           "WHERE d.date BETWEEN :from AND :to AND d.metricType = :metricType")
    Double avgByDateBetweenAndMetricType(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("metricType") DashboardMetric.MetricType metricType);

    /**
     * 날짜 범위와 메트릭 타입으로 집계 (카운트)
     * 
     * @param from 시작일
     * @param to 종료일
     * @param metricType 메트릭 타입
     * @return 카운트
     */
    @Query("SELECT COUNT(d) FROM DashboardMetric d " +
           "WHERE d.date BETWEEN :from AND :to AND d.metricType = :metricType")
    Long countByDateBetweenAndMetricType(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("metricType") DashboardMetric.MetricType metricType);

    /**
     * 특정 날짜, 메트릭 타입, 카테고리로 조회 (중복 체크용)
     * 
     * @param date 날짜
     * @param metricType 메트릭 타입
     * @param category 카테고리
     * @return 메트릭 데이터
     */
    Optional<DashboardMetric> findByDateAndMetricTypeAndCategory(
            LocalDate date, DashboardMetric.MetricType metricType, String category);

    /**
     * 특정 날짜, 메트릭 타입, 데이터셋 라벨로 조회 (중복 체크용)
     * 
     * @param date 날짜
     * @param metricType 메트릭 타입
     * @param datasetLabel 데이터셋 라벨
     * @return 메트릭 데이터
     */
    Optional<DashboardMetric> findByDateAndMetricTypeAndDatasetLabel(
            LocalDate date, DashboardMetric.MetricType metricType, String datasetLabel);
}

