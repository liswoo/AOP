package com.example.app.api.dashboard;

import com.example.app.api.dashboard.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
     * 현재는 더미 데이터를 반환하지만, 향후 다음과 같이 변경할 수 있습니다:
     * 1. DashboardService를 주입받아 실제 데이터 조회
     * 2. 캐싱을 통한 성능 최적화
     * 3. AI/ML 모델을 활용한 예측 데이터 추가
     * 
     * @return 대시보드 개요 데이터 (요약 카드, 차트 데이터 포함)
     */
    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewResponse> getOverview() {
        log.info("대시보드 개요 데이터 조회 요청");

        // TODO: 나중에 실제 DB/AI 연동 시 이 부분만 교체
        // 예: DashboardOverviewResponse response = dashboardService.getOverview();
        
        DashboardOverviewResponse response = createDummyData();
        
        return ResponseEntity.ok(response);
    }

    /**
     * 더미 데이터 생성
     * 
     * 현재는 하드코딩된 더미 데이터를 반환합니다.
     * 나중에 실제 DB/AI 연동 시 이 메서드를 제거하거나
     * DashboardService로 교체하면 됩니다.
     * 
     * @return 더미 대시보드 데이터
     */
    private DashboardOverviewResponse createDummyData() {
        // 요약 카드 데이터 (상단 4개 카드)
        List<SummaryCard> summaryCards = Arrays.asList(
            SummaryCard.builder()
                .label("총 매출")
                .value(12500000.0)
                .unit("원")
                .build(),
            SummaryCard.builder()
                .label("총 주문 수")
                .value(342.0)
                .unit("건")
                .build(),
            SummaryCard.builder()
                .label("신규 고객")
                .value(128.0)
                .unit("명")
                .build(),
            SummaryCard.builder()
                .label("평균 주문 금액")
                .value(36549.0)
                .unit("원")
                .build()
        );

        // 라인 차트 데이터 (최근 7일 매출 추이)
        ChartData lineChart = ChartData.builder()
            .title("최근 7일 매출 추이")
            .labels(Arrays.asList("월", "화", "수", "목", "금", "토", "일"))
            .datasets(Arrays.asList(
                ChartDataset.builder()
                    .label("매출")
                    .data(Arrays.asList(1200000.0, 1900000.0, 1500000.0, 2100000.0, 1800000.0, 2400000.0, 1600000.0))
                    .build()
            ))
            .build();

        // 바 차트 데이터 (카테고리별 판매량)
        ChartData barChart = ChartData.builder()
            .title("카테고리별 판매량")
            .labels(Arrays.asList("전자제품", "의류", "식품", "도서", "스포츠"))
            .datasets(Arrays.asList(
                ChartDataset.builder()
                    .label("판매량")
                    .data(Arrays.asList(120.0, 85.0, 65.0, 45.0, 27.0))
                    .build()
            ))
            .build();

        // 도넛 차트 데이터 (채널별 비율)
        ChartData doughnutChart = ChartData.builder()
            .title("채널별 매출 비율")
            .labels(Arrays.asList("온라인", "오프라인", "모바일", "기타"))
            .datasets(Arrays.asList(
                ChartDataset.builder()
                    .label("매출 비율")
                    .data(Arrays.asList(45.0, 30.0, 20.0, 5.0))
                    .build()
            ))
            .build();

        return DashboardOverviewResponse.builder()
            .summaryCards(summaryCards)
            .lineChart(lineChart)
            .barChart(barChart)
            .doughnutChart(doughnutChart)
            .build();
    }
}
