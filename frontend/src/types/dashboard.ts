/**
 * 대시보드 관련 타입 정의
 * 
 * react-grid-layout을 사용한 대시보드 카드 레이아웃 관리를 위한 타입입니다.
 */

/**
 * 대시보드 카드 ID
 * 
 * 각 카드를 고유하게 식별하기 위한 ID입니다.
 */
export type DashboardCardId =
  | 'profit'      // 주요 손익
  | 'quality'     // 품질 현황
  | 'stock'       // 재고 현황
  | 'trend'       // 매출 Trend
  | 'people'      // 인원 현황
  | 'downtime';   // 비가동 실적

/**
 * 대시보드 레이아웃 아이템
 * 
 * react-grid-layout의 Layout 타입과 호환되도록 설계되었습니다.
 * 
 * - i: 카드 ID (DashboardCardId)
 * - x: 그리드 X 위치 (0부터 시작)
 * - y: 그리드 Y 위치 (0부터 시작)
 * - w: 너비 (그리드 단위)
 * - h: 높이 (그리드 단위)
 */
export interface DashboardLayoutItem {
  i: DashboardCardId;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

/**
 * 기본 대시보드 레이아웃
 * 
 * 3열 × 2행 형태로 배치합니다.
 * 그리드 시스템: 12열 기준
 * 
 * 모든 카드는 동일한 크기(w=4, h=6)를 가집니다.
 * 이렇게 하면 "6개의 고정 슬롯 안에서 위치만 바꾸는" 형태의 레이아웃이 됩니다.
 * 
 * 레이아웃:
 * - 1행: 주요 손익(4칸, h=6), 품질 현황(4칸, h=6), 재고 현황(4칸, h=6)
 * - 2행: 매출 Trend(4칸, h=6), 인원 현황(4칸, h=6), 비가동 실적(4칸, h=6)
 */
export const defaultDashboardLayout: DashboardLayoutItem[] = [
  // 1행
  { i: 'profit', x: 0, y: 0, w: 4, h: 6, minW: 4, minH: 6, maxW: 4, maxH: 6 },
  { i: 'quality', x: 4, y: 0, w: 4, h: 6, minW: 4, minH: 6, maxW: 4, maxH: 6 },
  { i: 'stock', x: 8, y: 0, w: 4, h: 6, minW: 4, minH: 6, maxW: 4, maxH: 6 },
  // 2행
  { i: 'trend', x: 0, y: 6, w: 4, h: 6, minW: 4, minH: 6, maxW: 4, maxH: 6 },
  { i: 'people', x: 4, y: 6, w: 4, h: 6, minW: 4, minH: 6, maxW: 4, maxH: 6 },
  { i: 'downtime', x: 8, y: 6, w: 4, h: 6, minW: 4, minH: 6, maxW: 4, maxH: 6 },
];

