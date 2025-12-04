package com.example.app.domain.etl;

import com.example.app.domain.dashboard.DashboardMetric;
import com.example.app.domain.dashboard.DashboardMetricRepository;
import com.example.app.domain.dw.*;
import com.example.app.domain.mart.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ETL 서비스
 * 
 * DW → Mart → Dashboard 전용 테이블로 데이터를 이동시키는 ETL 프로세스를 담당합니다.
 * 
 * 데이터 흐름:
 * 1. DW (FactSales, FactInventory, FactDowntime) → 마트 테이블 집계
 * 2. 마트 테이블 → 대시보드 전용 테이블 정제
 * 
 * 실행 방식:
 * - 수동 실행: etlService.runEtlProcess()
 * - 스케줄 실행: @Scheduled 어노테이션 사용 (향후 추가)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EtlService {

    private final FactSalesRepository factSalesRepository;
    private final FactInventoryRepository factInventoryRepository;
    private final FactDowntimeRepository factDowntimeRepository;

    private final MartDailySalesRepository martDailySalesRepository;
    private final MartWeeklySalesRepository martWeeklySalesRepository;
    private final MartMonthlySalesRepository martMonthlySalesRepository;
    private final MartDailyInventoryRepository martDailyInventoryRepository;
    private final MartDailyDowntimeRepository martDailyDowntimeRepository;

    private final DashboardMetricRepository dashboardMetricRepository;

    /**
     * 전체 ETL 프로세스 실행
     * 
     * @param from 시작일
     * @param to 종료일
     */
    @Transactional
    public void runEtlProcess(LocalDate from, LocalDate to) {
        log.info("ETL 프로세스 시작 - from: {}, to: {}", from, to);

        // 1. DW → Mart (마트 테이블 집계)
        aggregateToMart(from, to);

        // 2. Mart → Dashboard (대시보드 전용 테이블 정제)
        refineToDashboard(from, to);

        log.info("ETL 프로세스 완료 - from: {}, to: {}", from, to);
    }

    /**
     * DW → Mart: 마트 테이블 집계
     */
    @Transactional
    public void aggregateToMart(LocalDate from, LocalDate to) {
        log.info("DW → Mart 집계 시작 - from: {}, to: {}", from, to);

        // 일별 매출 집계
        aggregateDailySales(from, to);

        // 주별 매출 집계
        aggregateWeeklySales(from, to);

        // 월별 매출 집계
        aggregateMonthlySales(from, to);

        // 일별 재고 집계
        aggregateDailyInventory(from, to);

        // 일별 비가동 집계
        aggregateDailyDowntime(from, to);

        log.info("DW → Mart 집계 완료");
    }

    /**
     * 일별 매출 집계
     */
    private void aggregateDailySales(LocalDate from, LocalDate to) {
        for (LocalDate current = from; !current.isAfter(to); current = current.plusDays(1)) {
            final LocalDate date = current; // 람다에서 사용하기 위해 final 변수로 복사
            
            // 해당 날짜의 팩트 데이터 조회
            List<FactSales> factSales = factSalesRepository
                    .findByTransactionDateBetweenOrderByTransactionDateAsc(date, date);

            if (!factSales.isEmpty()) {
                // 집계 계산
                double totalSalesAmount = factSales.stream()
                        .mapToDouble(FactSales::getSalesAmount)
                        .sum();
                long totalOrderCount = factSales.stream()
                        .mapToLong(FactSales::getOrderCount)
                        .sum();
                long totalQuantity = factSales.stream()
                        .mapToLong(FactSales::getQuantity)
                        .sum();
                long totalCustomerCount = factSales.stream()
                        .mapToLong(FactSales::getCustomerCount)
                        .sum();
                double avgOrderAmount = totalOrderCount > 0 ? totalSalesAmount / totalOrderCount : 0.0;

                // 마트 테이블에 저장 또는 업데이트
                martDailySalesRepository.findBySalesDate(date)
                        .ifPresentOrElse(
                                existing -> {
                                    // 업데이트
                                    existing.setTotalSalesAmount(totalSalesAmount);
                                    existing.setTotalOrderCount(totalOrderCount);
                                    existing.setTotalQuantity(totalQuantity);
                                    existing.setTotalCustomerCount(totalCustomerCount);
                                    existing.setAvgOrderAmount(avgOrderAmount);
                                    existing.setAggregatedDate(LocalDate.now());
                                    martDailySalesRepository.save(existing);
                                },
                                () -> {
                                    // 신규 생성
                                    MartDailySales martDailySales = MartDailySales.builder()
                                            .salesDate(date)
                                            .totalSalesAmount(totalSalesAmount)
                                            .totalOrderCount(totalOrderCount)
                                            .totalQuantity(totalQuantity)
                                            .totalCustomerCount(totalCustomerCount)
                                            .avgOrderAmount(avgOrderAmount)
                                            .aggregatedDate(LocalDate.now())
                                            .build();
                                    martDailySalesRepository.save(martDailySales);
                                }
                        );
            }
        }
    }

    /**
     * 주별 매출 집계
     */
    private void aggregateWeeklySales(LocalDate from, LocalDate to) {
        LocalDate weekStart = from;
        while (!weekStart.isAfter(to)) {
            final LocalDate currentWeekStart = weekStart; // final 변수로 복사
            LocalDate weekEnd = weekStart.plusDays(6);
            if (weekEnd.isAfter(to)) {
                weekEnd = to;
            }
            final LocalDate currentWeekEnd = weekEnd; // final 변수로 복사

            // 해당 주의 팩트 데이터 조회
            List<FactSales> factSales = factSalesRepository
                    .findByTransactionDateBetweenOrderByTransactionDateAsc(currentWeekStart, currentWeekEnd);

            if (!factSales.isEmpty()) {
                // 집계 계산
                double totalSalesAmount = factSales.stream()
                        .mapToDouble(FactSales::getSalesAmount)
                        .sum();
                long totalOrderCount = factSales.stream()
                        .mapToLong(FactSales::getOrderCount)
                        .sum();
                long totalQuantity = factSales.stream()
                        .mapToLong(FactSales::getQuantity)
                        .sum();
                long totalCustomerCount = factSales.stream()
                        .mapToLong(FactSales::getCustomerCount)
                        .sum();
                double avgOrderAmount = totalOrderCount > 0 ? totalSalesAmount / totalOrderCount : 0.0;

                int year = currentWeekStart.getYear();
                int week = currentWeekStart.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear());

                // 마트 테이블에 저장 또는 업데이트
                martWeeklySalesRepository.findByWeekStartDate(currentWeekStart)
                        .ifPresentOrElse(
                                existing -> {
                                    // 업데이트
                                    existing.setWeekEndDate(currentWeekEnd);
                                    existing.setYear(year);
                                    existing.setWeek(week);
                                    existing.setTotalSalesAmount(totalSalesAmount);
                                    existing.setTotalOrderCount(totalOrderCount);
                                    existing.setTotalQuantity(totalQuantity);
                                    existing.setTotalCustomerCount(totalCustomerCount);
                                    existing.setAvgOrderAmount(avgOrderAmount);
                                    existing.setAggregatedDate(LocalDate.now());
                                    martWeeklySalesRepository.save(existing);
                                },
                                () -> {
                                    // 신규 생성
                                    MartWeeklySales martWeeklySales = MartWeeklySales.builder()
                                            .weekStartDate(currentWeekStart)
                                            .weekEndDate(currentWeekEnd)
                                            .year(year)
                                            .week(week)
                                            .totalSalesAmount(totalSalesAmount)
                                            .totalOrderCount(totalOrderCount)
                                            .totalQuantity(totalQuantity)
                                            .totalCustomerCount(totalCustomerCount)
                                            .avgOrderAmount(avgOrderAmount)
                                            .aggregatedDate(LocalDate.now())
                                            .build();
                                    martWeeklySalesRepository.save(martWeeklySales);
                                }
                        );
            }

            weekStart = weekStart.plusWeeks(1);
        }
    }

    /**
     * 월별 매출 집계
     */
    private void aggregateMonthlySales(LocalDate from, LocalDate to) {
        LocalDate monthStart = from.withDayOfMonth(1);
        while (!monthStart.isAfter(to)) {
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            if (monthEnd.isAfter(to)) {
                monthEnd = to;
            }

            // 해당 월의 팩트 데이터 조회
            List<FactSales> factSales = factSalesRepository
                    .findByTransactionDateBetweenOrderByTransactionDateAsc(monthStart, monthEnd);

            if (!factSales.isEmpty()) {
                // 집계 계산
                double totalSalesAmount = factSales.stream()
                        .mapToDouble(FactSales::getSalesAmount)
                        .sum();
                long totalOrderCount = factSales.stream()
                        .mapToLong(FactSales::getOrderCount)
                        .sum();
                long totalQuantity = factSales.stream()
                        .mapToLong(FactSales::getQuantity)
                        .sum();
                long totalCustomerCount = factSales.stream()
                        .mapToLong(FactSales::getCustomerCount)
                        .sum();
                double avgOrderAmount = totalOrderCount > 0 ? totalSalesAmount / totalOrderCount : 0.0;

                int year = monthStart.getYear();
                int month = monthStart.getMonthValue();
                String yearMonth = monthStart.format(DateTimeFormatter.ofPattern("yyyy-MM"));

                // 마트 테이블에 저장 또는 업데이트
                martMonthlySalesRepository.findByYearMonth(yearMonth)
                        .ifPresentOrElse(
                                existing -> {
                                    // 업데이트
                                    existing.setYear(year);
                                    existing.setMonth(month);
                                    existing.setYearMonth(yearMonth);
                                    existing.setTotalSalesAmount(totalSalesAmount);
                                    existing.setTotalOrderCount(totalOrderCount);
                                    existing.setTotalQuantity(totalQuantity);
                                    existing.setTotalCustomerCount(totalCustomerCount);
                                    existing.setAvgOrderAmount(avgOrderAmount);
                                    existing.setAggregatedDate(LocalDate.now());
                                    martMonthlySalesRepository.save(existing);
                                },
                                () -> {
                                    // 신규 생성
                                    MartMonthlySales martMonthlySales = MartMonthlySales.builder()
                                            .year(year)
                                            .month(month)
                                            .yearMonth(yearMonth)
                                            .totalSalesAmount(totalSalesAmount)
                                            .totalOrderCount(totalOrderCount)
                                            .totalQuantity(totalQuantity)
                                            .totalCustomerCount(totalCustomerCount)
                                            .avgOrderAmount(avgOrderAmount)
                                            .aggregatedDate(LocalDate.now())
                                            .build();
                                    martMonthlySalesRepository.save(martMonthlySales);
                                }
                        );
            }

            monthStart = monthStart.plusMonths(1);
        }
    }

    /**
     * 일별 재고 집계
     */
    private void aggregateDailyInventory(LocalDate from, LocalDate to) {
        for (LocalDate current = from; !current.isAfter(to); current = current.plusDays(1)) {
            // 해당 날짜의 재고 팩트 데이터 조회 (모든 타입)
            List<FactInventory> factInventories = factInventoryRepository
                    .findByTransactionDateBetweenOrderByTransactionDateAsc(current, current);

            // 재고 유형별로 그룹화하여 집계
            Map<String, Double> inventoryByType = factInventories.stream()
                    .collect(Collectors.groupingBy(
                            FactInventory::getInventoryType,
                            Collectors.summingDouble(FactInventory::getQuantity)
                    ));

            // 마트 테이블에 저장 또는 업데이트
            final LocalDate currentDate = current; // final 변수로 복사
            for (Map.Entry<String, Double> entry : inventoryByType.entrySet()) {
                String inventoryType = entry.getKey();
                Double totalQuantity = entry.getValue();
                final String currentInventoryType = inventoryType; // final 변수로 복사

                martDailyInventoryRepository.findByInventoryDateAndInventoryType(currentDate, currentInventoryType)
                        .ifPresentOrElse(
                                existing -> {
                                    // 업데이트
                                    existing.setTotalQuantity(totalQuantity);
                                    existing.setAggregatedDate(LocalDate.now());
                                    martDailyInventoryRepository.save(existing);
                                },
                                () -> {
                                    // 신규 생성
                                    MartDailyInventory martDailyInventory = MartDailyInventory.builder()
                                            .inventoryDate(currentDate)
                                            .inventoryType(currentInventoryType)
                                            .totalQuantity(totalQuantity)
                                            .aggregatedDate(LocalDate.now())
                                            .build();
                                    martDailyInventoryRepository.save(martDailyInventory);
                                }
                        );
            }
        }
    }

    /**
     * 일별 비가동 집계
     */
    private void aggregateDailyDowntime(LocalDate from, LocalDate to) {
        for (LocalDate current = from; !current.isAfter(to); current = current.plusDays(1)) {
            // 해당 날짜의 비가동 팩트 데이터 조회 (모든 라인)
            List<FactDowntime> factDowntimes = factDowntimeRepository
                    .findByTransactionDateBetweenOrderByTransactionDateAsc(current, current);

            // 라인명별로 그룹화하여 집계
            Map<String, Double> downtimeCostByLine = factDowntimes.stream()
                    .collect(Collectors.groupingBy(
                            FactDowntime::getLineName,
                            Collectors.summingDouble(FactDowntime::getDowntimeCost)
                    ));

            Map<String, Double> downtimeHoursByLine = factDowntimes.stream()
                    .collect(Collectors.groupingBy(
                            FactDowntime::getLineName,
                            Collectors.summingDouble(FactDowntime::getDowntimeHours)
                    ));

            // 마트 테이블에 저장 또는 업데이트
            final LocalDate currentDate = current; // final 변수로 복사
            for (String lineName : downtimeCostByLine.keySet()) {
                Double totalCost = downtimeCostByLine.get(lineName);
                Double totalHours = downtimeHoursByLine.getOrDefault(lineName, 0.0);
                final String currentLineName = lineName; // final 변수로 복사

                martDailyDowntimeRepository.findByDowntimeDateAndLineName(currentDate, currentLineName)
                        .ifPresentOrElse(
                                existing -> {
                                    // 업데이트
                                    existing.setTotalDowntimeCost(totalCost);
                                    existing.setTotalDowntimeHours(totalHours);
                                    existing.setAggregatedDate(LocalDate.now());
                                    martDailyDowntimeRepository.save(existing);
                                },
                                () -> {
                                    // 신규 생성
                                    MartDailyDowntime martDailyDowntime = MartDailyDowntime.builder()
                                            .downtimeDate(currentDate)
                                            .lineName(currentLineName)
                                            .totalDowntimeCost(totalCost)
                                            .totalDowntimeHours(totalHours)
                                            .aggregatedDate(LocalDate.now())
                                            .build();
                                    martDailyDowntimeRepository.save(martDailyDowntime);
                                }
                        );
            }
        }
    }

    /**
     * Mart → Dashboard: 대시보드 전용 테이블 정제
     */
    @Transactional
    public void refineToDashboard(LocalDate from, LocalDate to) {
        log.info("Mart → Dashboard 정제 시작 - from: {}, to: {}", from, to);

        for (LocalDate current = from; !current.isAfter(to); current = current.plusDays(1)) {
            final LocalDate date = current; // 람다에서 사용하기 위해 final 변수로 복사
            
            // 일별 매출 데이터를 대시보드 메트릭으로 변환
            martDailySalesRepository.findBySalesDate(date).ifPresent(martDailySales -> {
                // 매출 메트릭
                saveOrUpdateDashboardMetric(
                        date,
                        DashboardMetric.MetricType.SALES,
                        martDailySales.getTotalSalesAmount(),
                        null,
                        null
                );
            });

            // 일별 재고 데이터를 대시보드 메트릭으로 변환
            List<MartDailyInventory> inventories = martDailyInventoryRepository
                    .findByInventoryDateBetweenOrderByInventoryDateAsc(date, date);
            for (MartDailyInventory inventory : inventories) {
                saveOrUpdateDashboardMetric(
                        date,
                        DashboardMetric.MetricType.INVENTORY,
                        inventory.getTotalQuantity(),
                        inventory.getInventoryType(),
                        null
                );
            }

            // 일별 비가동 데이터를 대시보드 메트릭으로 변환
            List<MartDailyDowntime> downtimes = martDailyDowntimeRepository
                    .findByDowntimeDateBetweenOrderByDowntimeDateAsc(date, date);
            for (MartDailyDowntime downtime : downtimes) {
                saveOrUpdateDashboardMetric(
                        date,
                        DashboardMetric.MetricType.DOWNTIME,
                        downtime.getTotalDowntimeCost(),
                        null,
                        downtime.getLineName()
                );
            }
        }

        log.info("Mart → Dashboard 정제 완료");
    }

    /**
     * 대시보드 메트릭 저장 또는 업데이트
     */
    private void saveOrUpdateDashboardMetric(
            LocalDate date,
            DashboardMetric.MetricType metricType,
            Double value,
            String category,
            String datasetLabel) {

        DashboardMetric existing = null;
        if (category != null) {
            existing = dashboardMetricRepository
                    .findByDateAndMetricTypeAndCategory(date, metricType, category)
                    .orElse(null);
        } else if (datasetLabel != null) {
            existing = dashboardMetricRepository
                    .findByDateAndMetricTypeAndDatasetLabel(date, metricType, datasetLabel)
                    .orElse(null);
        } else {
            // category와 datasetLabel이 모두 null인 경우는 첫 번째로 찾기
            List<DashboardMetric> metrics = dashboardMetricRepository
                    .findByDateBetweenAndMetricTypeOrderByDateAsc(date, date, metricType);
            if (!metrics.isEmpty()) {
                existing = metrics.get(0);
            }
        }

        if (existing != null) {
            // 업데이트
            existing.setDate(date);
            existing.setMetricType(metricType);
            existing.setValue(value);
            existing.setCategory(category);
            existing.setDatasetLabel(datasetLabel);
            dashboardMetricRepository.save(existing);
        } else {
            // 신규 생성
            DashboardMetric metric = DashboardMetric.builder()
                    .date(date)
                    .metricType(metricType)
                    .value(value)
                    .category(category)
                    .datasetLabel(datasetLabel)
                    .build();
            dashboardMetricRepository.save(metric);
        }
    }
}

