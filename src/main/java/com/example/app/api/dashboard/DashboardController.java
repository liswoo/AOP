package com.example.app.api.dashboard;

import com.example.app.api.dashboard.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 대시보드(Dashboard) 관련 API 컨트롤러
 * 
 * 이 컨트롤러는 대시보드에 표시할 데이터를 제공합니다.
 * 
 * 권한 설정:
 * - SecurityConfig에서 /api/dashboard/** 경로는 authenticated()로 설정되어 있어
 *   어떤 ROLE이든 로그인만 되어 있으면 접근 가능합니다.
 * - ADMIN과 USER 모두 이 API를 사용할 수 있습니다.
 * 
 * 현재 구현:
 * - GET /api/dashboard/overview: 대시보드 개요 데이터 반환 (더미 데이터)
 * 
 * 향후 개선:
 * - 실제 데이터베이스에서 통계 데이터를 조회하도록 변경
 * - AI/ML 모델을 활용한 예측 데이터 추가
 * - 캐싱을 통한 성능 최적화
 * 
 * 주의:
 * - 현재는 더미 데이터를 반환하지만, 나중에 실제 DB/AI 연동 시
 *   더미 데이터 부분만 교체하면 되도록 코드 구조를 깔끔하게 작성했습니다.
 * - 프론트에서 Chart.js에 바로 바인딩해서 사용할 수 있도록 설계된 구조입니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    /**
     * 대시보드 개요 데이터 조회
     * 
     * 대시보드 화면에 표시할 모든 데이터를 반환합니다.
     * 
     * 쿼리 파라미터:
     * - from: 시작일 (yyyy-MM-dd 형식, 선택사항)
     *   - null이면 to 기준으로 최근 7일로 설정 (to.minusDays(6))
     * - to: 종료일 (yyyy-MM-dd 형식, 선택사항)
     *   - null이면 오늘 날짜로 설정 (LocalDate.now())
     * - groupBy: 집계 단위 (DAY, WEEK, MONTH 중 하나, 선택사항)
     *   - 기본값: "DAY"
     *   - 소문자로 입력해도 대문자로 변환하여 처리
     * 
     * 유효성 검증:
     * - from이 to보다 이후일 경우 400 Bad Request 반환
     * - groupBy가 DAY, WEEK, MONTH가 아닐 경우 400 Bad Request 반환
     * - 날짜 형식이 올바르지 않을 경우 400 Bad Request 반환
     * 
     * 현재는 더미 데이터를 반환하지만, 향후 다음과 같이 변경할 수 있습니다:
     * 1. DashboardService를 주입받아 실제 데이터 조회
     * 2. 캐싱을 통한 성능 최적화
     * 3. AI/ML 모델을 활용한 예측 데이터 추가
     * 
     * 보안:
     * - SecurityConfig에서 /api/dashboard/** 경로는 authenticated()로 설정되어 있어
     *   ROLE_USER, ROLE_ADMIN 모두 접근 가능합니다.
     * 
     * @param from 시작일 (yyyy-MM-dd, 선택사항)
     * @param to 종료일 (yyyy-MM-dd, 선택사항)
     * @param groupBy 집계 단위 (DAY, WEEK, MONTH, 선택사항, 기본값 "DAY")
     * @return 대시보드 개요 데이터 (요약 카드, 차트 데이터 포함)
     */
    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewResponse> getOverview(
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to,
            @RequestParam(value = "groupBy", defaultValue = "DAY") String groupBy) {
        log.info("대시보드 개요 데이터 조회 요청 - from: {}, to: {}, groupBy: {}", from, to, groupBy);

        // 날짜 파싱 및 기본값 설정
        LocalDate toDate = parseDate(to, LocalDate.now(), "to");
        LocalDate fromDate = parseDate(from, toDate.minusDays(6), "from");

        // 유효성 검증: from이 to보다 이후일 수 없음
        if (fromDate.isAfter(toDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "from 날짜는 to 날짜보다 이후일 수 없습니다.");
        }

        // groupBy 유효성 검증 및 정규화
        String normalizedGroupBy = validateAndNormalizeGroupBy(groupBy);

        // TODO: 나중에 실제 DB/AI 연동 시 이 부분만 교체
        // 예: DashboardOverviewResponse response = dashboardService.getOverview(fromDate, toDate, normalizedGroupBy);
        
        DashboardOverviewResponse response = createDummyData(fromDate, toDate, normalizedGroupBy);
        
        return ResponseEntity.ok(response);
    }

    /**
     * 날짜 문자열을 LocalDate로 파싱
     * 
     * @param dateStr 파싱할 날짜 문자열 (yyyy-MM-dd 형식)
     * @param defaultValue null일 경우 사용할 기본값
     * @param paramName 파라미터 이름 (에러 메시지용)
     * @return 파싱된 LocalDate
     * @throws ResponseStatusException 날짜 형식이 올바르지 않을 경우
     */
    private LocalDate parseDate(String dateStr, LocalDate defaultValue, String paramName) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return defaultValue;
        }
        
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    String.format("%s 파라미터의 날짜 형식이 올바르지 않습니다. yyyy-MM-dd 형식으로 입력해주세요.", paramName));
        }
    }

    /**
     * groupBy 파라미터 유효성 검증 및 정규화
     * 
     * @param groupBy 집계 단위 문자열
     * @return 정규화된 집계 단위 (DAY, WEEK, MONTH 중 하나)
     * @throws ResponseStatusException 허용되지 않은 값일 경우
     */
    private String validateAndNormalizeGroupBy(String groupBy) {
        if (groupBy == null || groupBy.trim().isEmpty()) {
            return "DAY";
        }
        
        String normalized = groupBy.trim().toUpperCase();
        
        if (!normalized.equals("DAY") && !normalized.equals("WEEK") && !normalized.equals("MONTH")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "groupBy는 DAY, WEEK, MONTH 중 하나여야 합니다.");
        }
        
        return normalized;
    }

    /**
     * 더미 데이터 생성
     * 
     * from, to, groupBy 파라미터에 따라 그럴듯한 더미 데이터를 생성합니다.
     * 나중에 실제 DB/AI 연동 시 이 메서드를 제거하거나
     * DashboardService로 교체하면 됩니다.
     * 
     * @param from 시작일
     * @param to 종료일
     * @param groupBy 집계 단위 (DAY, WEEK, MONTH)
     * @return 더미 대시보드 데이터
     */
    private DashboardOverviewResponse createDummyData(LocalDate from, LocalDate to, String groupBy) {
        // 기간에 따라 요약 카드 값 계산 (기간이 길수록 값이 커지도록)
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        double salesMultiplier = 1.0 + (daysBetween * 0.1);
        double orderMultiplier = 1.0 + (daysBetween * 0.05);
        double customerMultiplier = 1.0 + (daysBetween * 0.03);
        
        // 요약 카드 데이터 (상단 4개 카드) - 기간 조건에 따라 값이 변동
        List<SummaryCard> summaryCards = Arrays.asList(
            SummaryCard.builder()
                .label("총 매출")
                .value(12500000.0 * salesMultiplier)
                .unit("원")
                .build(),
            SummaryCard.builder()
                .label("총 주문 수")
                .value(342.0 * orderMultiplier)
                .unit("건")
                .build(),
            SummaryCard.builder()
                .label("신규 고객")
                .value(128.0 * customerMultiplier)
                .unit("명")
                .build(),
            SummaryCard.builder()
                .label("평균 주문 금액")
                .value(36549.0 * (1.0 + (Math.random() * 0.1)))
                .unit("원")
                .build()
        );

        // 라인 차트 데이터 (기간별 매출 추이)
        ChartData lineChart = createLineChartData(from, to, groupBy);

        // 바 차트 데이터 (재고 현황 - 기간 조건에 따라 다르게 생성)
        ChartData barChart = createInventoryBarChartData(from, to, groupBy);

        // 도넛 차트 데이터 (비가동 실적 - 기간 조건에 따라 다르게 생성)
        ChartData doughnutChart = createDowntimeDoughnutChartData(from, to, groupBy);

        return DashboardOverviewResponse.builder()
            .summaryCards(summaryCards)
            .lineChart(lineChart)
            .barChart(barChart)
            .doughnutChart(doughnutChart)
            .build();
    }

    /**
     * 라인 차트 데이터 생성
     * 
     * from, to, groupBy에 따라 날짜 라벨과 데이터를 생성합니다.
     * 
     * @param from 시작일
     * @param to 종료일
     * @param groupBy 집계 단위 (DAY, WEEK, MONTH)
     * @return 라인 차트 데이터
     */
    private ChartData createLineChartData(LocalDate from, LocalDate to, String groupBy) {
        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();
        
        DateTimeFormatter formatter;
        String title;
        long baseValue = 1000000L; // 기본값
        
        switch (groupBy) {
            case "DAY":
                formatter = DateTimeFormatter.ofPattern("MM-dd");
                title = String.format("%s ~ %s 일별 매출 추이", 
                        from.format(DateTimeFormatter.ISO_LOCAL_DATE),
                        to.format(DateTimeFormatter.ISO_LOCAL_DATE));
                
                LocalDate current = from;
                int index = 0;
                while (!current.isAfter(to)) {
                    labels.add(current.format(formatter));
                    // 더미 데이터: 기본값 + 인덱스 * 랜덤 변동
                    double value = baseValue + (index * 100000) + (Math.random() * 500000);
                    data.add(value);
                    current = current.plusDays(1);
                    index++;
                }
                break;
                
            case "WEEK":
                formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                title = String.format("%s ~ %s 주별 매출 추이", 
                        from.format(DateTimeFormatter.ISO_LOCAL_DATE),
                        to.format(DateTimeFormatter.ISO_LOCAL_DATE));
                
                LocalDate weekStart = from;
                int weekIndex = 0;
                while (!weekStart.isAfter(to)) {
                    LocalDate weekEnd = weekStart.plusDays(6);
                    if (weekEnd.isAfter(to)) {
                        weekEnd = to;
                    }
                    labels.add(String.format("%s ~ %s", 
                            weekStart.format(formatter),
                            weekEnd.format(formatter)));
                    // 더미 데이터: 주별로 더 큰 값
                    double weekValue = baseValue * 7 + (weekIndex * 500000) + (Math.random() * 2000000);
                    data.add(weekValue);
                    weekStart = weekStart.plusWeeks(1);
                    weekIndex++;
                }
                break;
                
            case "MONTH":
                formatter = DateTimeFormatter.ofPattern("yyyy-MM");
                title = String.format("%s ~ %s 월별 매출 추이", 
                        from.format(DateTimeFormatter.ISO_LOCAL_DATE),
                        to.format(DateTimeFormatter.ISO_LOCAL_DATE));
                
                LocalDate monthStart = from.withDayOfMonth(1);
                int monthIndex = 0;
                while (!monthStart.isAfter(to)) {
                    labels.add(monthStart.format(formatter));
                    // 더미 데이터: 월별로 더 큰 값
                    double monthValue = baseValue * 30 + (monthIndex * 2000000) + (Math.random() * 5000000);
                    data.add(monthValue);
                    monthStart = monthStart.plusMonths(1);
                    monthIndex++;
                }
                break;
                
            default:
                // 기본값 (DAY와 동일)
                formatter = DateTimeFormatter.ofPattern("MM-dd");
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
     * 재고 현황 바 차트 데이터 생성
     * 
     * 기간 조건에 따라 재고 현황 데이터를 생성합니다.
     * 
     * @param from 시작일
     * @param to 종료일
     * @param groupBy 집계 단위 (DAY, WEEK, MONTH)
     * @return 재고 현황 바 차트 데이터
     */
    private ChartData createInventoryBarChartData(LocalDate from, LocalDate to, String groupBy) {
        // 기간에 따라 기본 재고 값 계산 (기간이 길수록 값이 커지도록)
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        double baseInventory = 1000.0 + (daysBetween * 10);
        
        // 더미 데이터: 기간에 따라 변동
        double prevMonthInventory = baseInventory;
        double inbound = baseInventory * 2.3 + (Math.random() * 500);
        double domesticShipment = -(baseInventory * 0.9 + (Math.random() * 200));
        double exportShipment = -(baseInventory * 0.6 + (Math.random() * 150));
        double other = -(baseInventory * 0.1 + (Math.random() * 50));
        double monthEndInventory = prevMonthInventory + inbound + domesticShipment + exportShipment + other;
        
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
     * 비가동 실적 도넛 차트 데이터 생성
     * 
     * 기간 조건에 따라 비가동 실적 데이터를 생성합니다.
     * 
     * @param from 시작일
     * @param to 종료일
     * @param groupBy 집계 단위 (DAY, WEEK, MONTH)
     * @return 비가동 실적 도넛 차트 데이터
     */
    private ChartData createDowntimeDoughnutChartData(LocalDate from, LocalDate to, String groupBy) {
        // 기간에 따라 기본 비가동 값 계산
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        double baseDowntime = 5.0 + (daysBetween * 0.1);
        
        // 더미 데이터: 기간에 따라 변동
        double plan = baseDowntime;
        double actual = baseDowntime * 1.2 + (Math.random() * 2);
        double line1 = baseDowntime * 1.1 + (Math.random() * 1);
        double line2 = baseDowntime * 0.5 + (Math.random() * 0.5);
        double line3 = baseDowntime * 1.0 + (Math.random() * 1);
        double line4 = baseDowntime * 1.3 + (Math.random() * 1.5);
        double line5 = baseDowntime * 1.0 + (Math.random() * 1);
        
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
}
