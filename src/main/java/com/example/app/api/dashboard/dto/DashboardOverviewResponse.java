package com.example.app.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 대시보드 개요 응답 DTO
 * 
 * 대시보드 화면에 표시할 모든 데이터를 담는 응답 클래스입니다.
 * 
 * 구조:
 * - summaryCards: 상단 요약 카드 목록 (예: 총 매출, 총 주문 수 등)
 * - lineChart: 라인 차트 데이터 (예: 최근 7일 매출 추이)
 * - barChart: 바 차트 데이터 (예: 카테고리별 판매량)
 * - doughnutChart: 도넛 차트 데이터 (예: 채널별 비율)
 * 
 * 프론트에서 Chart.js에 바로 바인딩해서 사용할 수 있도록 설계된 구조입니다.
 * 
 * 현재는 더미 데이터를 반환하지만, 나중에 실제 DB/AI 연동 시
 * 더미 데이터 부분만 교체하면 되도록 코드 구조를 깔끔하게 작성했습니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewResponse {
    
    /**
     * 요약 카드 목록 (대시보드 상단에 표시)
     */
    private List<SummaryCard> summaryCards;
    
    /**
     * 라인 차트 데이터 (예: 시계열 데이터)
     */
    private ChartData lineChart;
    
    /**
     * 바 차트 데이터 (예: 카테고리별 비교)
     */
    private ChartData barChart;
    
    /**
     * 도넛 차트 데이터 (예: 비율 표시)
     */
    private ChartData doughnutChart;
}

