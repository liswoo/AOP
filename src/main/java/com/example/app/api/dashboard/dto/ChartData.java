package com.example.app.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 차트 데이터 DTO
 * 
 * Chart.js의 차트 구조와 동일하게 설계되었습니다.
 * title, labels, datasets를 포함합니다.
 * 
 * 프론트에서 Chart.js에 바로 바인딩해서 사용할 수 있도록 설계된 구조입니다.
 * 
 * 예시:
 * - 라인 차트: 최근 7일 매출 추이
 * - 바 차트: 카테고리별 판매량
 * - 도넛 차트: 채널별 비율
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartData {
    
    /**
     * 차트 제목 (예: "최근 7일 매출 추이", "카테고리별 판매량")
     */
    private String title;
    
    /**
     * X축 레이블 리스트 (예: ["월", "화", "수", "목", "금", "토", "일"])
     */
    private List<String> labels;
    
    /**
     * 데이터셋 리스트 (하나의 차트에 여러 시리즈를 표시할 수 있음)
     */
    private List<ChartDataset> datasets;
}

