package com.example.app.api.dashboard.service;

import com.example.app.api.dashboard.dto.*;
import com.example.app.domain.dashboard.DashboardMetric;
import com.example.app.domain.dashboard.DashboardMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 대시보드 서비스
 * 
 * 대시보드 데이터를 조회하고 변환하는 비즈니스 로직을 담당합니다.
 * 
 * 데이터 소스:
 * - DashboardMetric 테이블에서 메트릭 데이터를 조회
 * - 집계 및 변환하여 프론트엔드에 맞는 형태로 제공
 * 
 * 향후 확장:
 * - 캐싱 추가 (Redis 등)
 * - 실시간 데이터 업데이트
 * - AI/ML 예측 데이터 추가
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final DashboardMetricRepository dashboardMetricRepository;

    /**
     * 대시보드 개요 데이터 조회
     * 
     * @param from 시작일
     * @param to 종료일
     * @param groupBy 집계 단위 (DAY, WEEK, MONTH)
     * @return 대시보드 개요 데이터
     */
    public DashboardOverviewResponse getOverview(LocalDate from, LocalDate to, String groupBy) {
        log.debug("대시보드 개요 데이터 조회 - from: {}, to: {}, groupBy: {}", from, to, groupBy);

        // 요약 카드 데이터 생성
        List<SummaryCard> summaryCards = createSummaryCards(from, to);

        // 라인 차트 데이터 생성 (매출 추이)
        ChartData lineChart = createLineChartData(from, to, groupBy);

        // 바 차트 데이터 생성 (재고 현황)
        ChartData barChart = createBarChartData(from, to);

        // 도넛 차트 데이터 생성 (비가동 실적)
        ChartData doughnutChart = createDoughnutChartData(from, to);

        return DashboardOverviewResponse.builder()
                .summaryCards(summaryCards)
                .lineChart(lineChart)
                .barChart(barChart)
                .doughnutChart(doughnutChart)
                .build();
    }

    /**
     * 요약 카드 데이터 생성
     */
    private List<SummaryCard> createSummaryCards(LocalDate from, LocalDate to) {
        // 총 매출
        Double totalSales = dashboardMetricRepository.sumByDateBetweenAndMetricType(
                from, to, DashboardMetric.MetricType.SALES);
        if (totalSales == null) totalSales = 0.0;

        // 총 주문 수 (SALES 메트릭의 카운트로 대체)
        Long totalOrders = dashboardMetricRepository.countByDateBetweenAndMetricType(
                from, to, DashboardMetric.MetricType.SALES);
        if (totalOrders == null) totalOrders = 0L;

        // 신규 고객 (PERSONNEL 메트릭으로 대체)
        Double newCustomers = dashboardMetricRepository.sumByDateBetweenAndMetricType(
                from, to, DashboardMetric.MetricType.PERSONNEL);
        if (newCustomers == null) newCustomers = 0.0;

        // 평균 주문 금액
        Double avgOrderAmount = totalOrders > 0 ? totalSales / totalOrders : 0.0;

        return Arrays.asList(
                SummaryCard.builder()
                        .label("총 매출")
                        .value(totalSales)
                        .unit("원")
                        .build(),
                SummaryCard.builder()
                        .label("총 주문 수")
                        .value(totalOrders.doubleValue())
                        .unit("건")
                        .build(),
                SummaryCard.builder()
                        .label("신규 고객")
                        .value(newCustomers)
                        .unit("명")
                        .build(),
                SummaryCard.builder()
                        .label("평균 주문 금액")
                        .value(avgOrderAmount)
                        .unit("원")
                        .build()
        );
    }

    /**
     * 라인 차트 데이터 생성 (매출 추이)
     */
    private ChartData createLineChartData(LocalDate from, LocalDate to, String groupBy) {
        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();
        String title;

        switch (groupBy) {
            case "DAY":
                title = String.format("%s ~ %s 일별 매출 추이",
                        from.format(DateTimeFormatter.ISO_LOCAL_DATE),
                        to.format(DateTimeFormatter.ISO_LOCAL_DATE));
                
                LocalDate current = from;
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");
                while (!current.isAfter(to)) {
                    labels.add(current.format(formatter));
                    
                    // 해당 날짜의 매출 합계 조회
                    Double dailySales = dashboardMetricRepository.sumByDateBetweenAndMetricType(
                            current, current, DashboardMetric.MetricType.SALES);
                    data.add(dailySales != null ? dailySales : 0.0);
                    
                    current = current.plusDays(1);
                }
                break;

            case "WEEK":
                title = String.format("%s ~ %s 주별 매출 추이",
                        from.format(DateTimeFormatter.ISO_LOCAL_DATE),
                        to.format(DateTimeFormatter.ISO_LOCAL_DATE));
                
                LocalDate weekStart = from;
                DateTimeFormatter weekFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                while (!weekStart.isAfter(to)) {
                    LocalDate weekEnd = weekStart.plusDays(6);
                    if (weekEnd.isAfter(to)) {
                        weekEnd = to;
                    }
                    labels.add(String.format("%s ~ %s",
                            weekStart.format(weekFormatter),
                            weekEnd.format(weekFormatter)));
                    
                    // 해당 주의 매출 합계 조회
                    Double weekSales = dashboardMetricRepository.sumByDateBetweenAndMetricType(
                            weekStart, weekEnd, DashboardMetric.MetricType.SALES);
                    data.add(weekSales != null ? weekSales : 0.0);
                    
                    weekStart = weekStart.plusWeeks(1);
                }
                break;

            case "MONTH":
                title = String.format("%s ~ %s 월별 매출 추이",
                        from.format(DateTimeFormatter.ISO_LOCAL_DATE),
                        to.format(DateTimeFormatter.ISO_LOCAL_DATE));
                
                LocalDate monthStart = from.withDayOfMonth(1);
                DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");
                while (!monthStart.isAfter(to)) {
                    LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
                    if (monthEnd.isAfter(to)) {
                        monthEnd = to;
                    }
                    labels.add(monthStart.format(monthFormatter));
                    
                    // 해당 월의 매출 합계 조회
                    Double monthSales = dashboardMetricRepository.sumByDateBetweenAndMetricType(
                            monthStart, monthEnd, DashboardMetric.MetricType.SALES);
                    data.add(monthSales != null ? monthSales : 0.0);
                    
                    monthStart = monthStart.plusMonths(1);
                }
                break;

            default:
                title = "매출 추이";
                labels.add("데이터 없음");
                data.add(0.0);
        }

        return ChartData.builder()
                .title(title)
                .labels(labels)
                .datasets(Arrays.asList(
                        ChartDataset.builder()
                                .label("매출")
                                .data(data)
                                .build()
                ))
                .build();
    }

    /**
     * 바 차트 데이터 생성 (재고 현황)
     */
    private ChartData createBarChartData(LocalDate from, LocalDate to) {
        // 재고 관련 메트릭 조회
        List<DashboardMetric> inventoryMetrics = dashboardMetricRepository
                .findByDateBetweenAndMetricTypeOrderByDateAsc(
                        from, to, DashboardMetric.MetricType.INVENTORY);

        // 카테고리별로 집계
        double prevMonthInventory = getSumByCategory(inventoryMetrics, "전월재고");
        double inbound = getSumByCategory(inventoryMetrics, "입고");
        double domesticShipment = getSumByCategory(inventoryMetrics, "출하내수");
        double exportShipment = getSumByCategory(inventoryMetrics, "출하수출");
        double other = getSumByCategory(inventoryMetrics, "기타");
        double monthEndInventory = getSumByCategory(inventoryMetrics, "월말재고");

        return ChartData.builder()
                .title(String.format("재고 현황 (%s ~ %s)",
                        from.format(DateTimeFormatter.ISO_LOCAL_DATE),
                        to.format(DateTimeFormatter.ISO_LOCAL_DATE)))
                .labels(Arrays.asList("전월재고", "입고", "출하내수", "출하수출", "기타", "월말재고"))
                .datasets(Arrays.asList(
                        ChartDataset.builder()
                                .label("재고 현황 (MT)")
                                .data(Arrays.asList(
                                        prevMonthInventory,
                                        inbound,
                                        domesticShipment,
                                        exportShipment,
                                        other,
                                        monthEndInventory
                                ))
                                .build()
                ))
                .build();
    }

    /**
     * 도넛 차트 데이터 생성 (비가동 실적)
     */
    private ChartData createDoughnutChartData(LocalDate from, LocalDate to) {
        // 비가동 관련 메트릭 조회
        List<DashboardMetric> downtimeMetrics = dashboardMetricRepository
                .findByDateBetweenAndMetricTypeOrderByDateAsc(
                        from, to, DashboardMetric.MetricType.DOWNTIME);

        // 데이터셋 라벨별로 집계
        double plan = getSumByDatasetLabel(downtimeMetrics, "계획");
        double actual = getSumByDatasetLabel(downtimeMetrics, "실적");
        double line1 = getSumByDatasetLabel(downtimeMetrics, "1Line");
        double line2 = getSumByDatasetLabel(downtimeMetrics, "2Line");
        double line3 = getSumByDatasetLabel(downtimeMetrics, "3Line");
        double line4 = getSumByDatasetLabel(downtimeMetrics, "4Line");
        double line5 = getSumByDatasetLabel(downtimeMetrics, "5Line");

        return ChartData.builder()
                .title(String.format("비가동 실적 (%s ~ %s)",
                        from.format(DateTimeFormatter.ISO_LOCAL_DATE),
                        to.format(DateTimeFormatter.ISO_LOCAL_DATE)))
                .labels(Arrays.asList("계획", "실적", "1Line", "2Line", "3Line", "4Line", "5Line"))
                .datasets(Arrays.asList(
                        ChartDataset.builder()
                                .label("계획")
                                .data(Arrays.asList(plan, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0))
                                .build(),
                        ChartDataset.builder()
                                .label("실적")
                                .data(Arrays.asList(0.0, actual, 0.0, 0.0, 0.0, 0.0, 0.0))
                                .build(),
                        ChartDataset.builder()
                                .label("라인별")
                                .data(Arrays.asList(0.0, 0.0, line1, line2, line3, line4, line5))
                                .build()
                ))
                .build();
    }

    /**
     * 카테고리별 합계 계산
     */
    private double getSumByCategory(List<DashboardMetric> metrics, String category) {
        return metrics.stream()
                .filter(m -> category.equals(m.getCategory()))
                .mapToDouble(DashboardMetric::getValue)
                .sum();
    }

    /**
     * 데이터셋 라벨별 합계 계산
     */
    private double getSumByDatasetLabel(List<DashboardMetric> metrics, String datasetLabel) {
        return metrics.stream()
                .filter(m -> datasetLabel.equals(m.getDatasetLabel()))
                .mapToDouble(DashboardMetric::getValue)
                .sum();
    }
}

