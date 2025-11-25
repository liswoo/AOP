/**
 * 대시보드 관련 API 함수
 * 
 * 대시보드 화면에 표시할 데이터를 조회하는 API를 호출하는 함수들을 정의합니다.
 * 
 * 주의: 이 API들은 인증이 필요합니다 (어떤 ROLE이든 로그인만 되어 있으면 접근 가능).
 * Authorization 헤더에 Bearer 토큰이 포함되어야 하며,
 * apiClient의 요청 인터셉터가 자동으로 토큰을 추가합니다.
 */

import apiClient from './client';
import { DashboardOverview } from '../types';

/**
 * 대시보드 개요 데이터 조회
 * 
 * GET /api/dashboard/overview API를 호출하여 대시보드 화면에 표시할 모든 데이터를 가져옵니다.
 * 
 * 응답 구조:
 * - summaryCards: 상단 요약 카드 목록 (총 매출, 총 주문 수, 신규 고객, 평균 주문 금액 등)
 * - lineChart: 라인 차트 데이터 (최근 7일 매출 추이 등)
 * - barChart: 바 차트 데이터 (카테고리별 판매량 등)
 * - doughnutChart: 도넛 차트 데이터 (채널별 비율 등)
 * 
 * 프론트에서 Chart.js에 바로 바인딩해서 사용할 수 있도록 설계된 구조입니다.
 * 
 * @returns 대시보드 개요 데이터
 * 
 * 사용 예시:
 * const overview = await getDashboardOverview();
 * console.log(overview.summaryCards);  // 요약 카드 목록
 * console.log(overview.lineChart);     // 라인 차트 데이터
 */
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await apiClient.get<DashboardOverview>('/dashboard/overview');
  return response.data;
};

