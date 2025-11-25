package com.example.app.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 대시보드 요약 카드 DTO
 * 
 * 대시보드 상단에 표시되는 요약 정보 카드를 나타냅니다.
 * 예: 총 매출, 총 주문 수, 신규 고객 수, 평균 주문 금액 등
 * 
 * 프론트에서 Chart.js에 바로 바인딩해서 사용할 수 있도록 설계된 구조입니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryCard {
    
    /**
     * 카드 제목 (예: "총 매출", "신규 고객", "총 주문 수")
     */
    private String label;
    
    /**
     * 카드 값 (예: 1500000.0)
     */
    private Double value;
    
    /**
     * 값의 단위 (예: "원", "건", "명", "%")
     */
    private String unit;
}

