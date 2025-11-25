package com.example.app.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 차트 데이터셋 DTO
 * 
 * Chart.js의 dataset 구조와 동일하게 설계되었습니다.
 * 하나의 차트에 여러 데이터셋(예: 여러 시리즈)을 표시할 수 있습니다.
 * 
 * 프론트에서 Chart.js에 바로 바인딩해서 사용할 수 있도록 설계된 구조입니다.
 * 
 * 예시:
 * - 라인 차트: "2024년 매출" 데이터셋, "2023년 매출" 데이터셋
 * - 바 차트: "카테고리 A" 데이터셋, "카테고리 B" 데이터셋
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataset {
    
    /**
     * 데이터셋 레이블 (예: "2024년 매출", "카테고리 A")
     */
    private String label;
    
    /**
     * 데이터 값 리스트 (예: [100, 200, 300, 400, 500])
     * labels의 각 인덱스와 매칭됩니다.
     */
    private List<Double> data;
}

