/**
 * Workshop KPI 목 데이터
 * 
 * 실제 데이터베이스 연동 전까지 사용할 하드코딩된 예시 데이터입니다.
 * 이미지에서 본 데이터를 기반으로 구성했습니다.
 */

/**
 * 월 타입 정의
 */
export type MonthKey = 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';

/**
 * Workshop KPI 지표 값 인터페이스
 */
export interface WorkshopKpiMetricValues {
  /** 지표 키 (workshopKpiLayout.ts의 metricKey와 매칭) */
  metricKey: string;
  /** Benchmark 값 (선택사항) */
  benchmark?: number;
  /** YTD (Year To Date) 값 (선택사항) */
  ytd?: number;
  /** 월별 데이터 */
  monthly: { [month in MonthKey]?: number };
}

/**
 * Workshop KPI 지표 데이터
 * 
 * 각 지표의 Benchmark, YTD, 월별 값을 포함합니다.
 */
export const WORKSHOP_KPI_METRICS: WorkshopKpiMetricValues[] = [
  // Operations 섹션
  {
    metricKey: 'direct_worker',
    benchmark: 133,
    ytd: 133,
    monthly: { jan: 128, feb: 130, mar: 131, apr: 130, may: 131, jun: 132, jul: 133, aug: 138, sep: 137, oct: 140 },
  },
  {
    metricKey: 'gold_tech',
    benchmark: undefined,
    ytd: 10,
    monthly: { jan: 7, feb: 7, mar: 8, apr: 8, may: 9, jun: 9, jul: 10, aug: 12, sep: 12, oct: 12 },
  },
  {
    metricKey: 'silver_tech',
    benchmark: undefined,
    ytd: 31,
    monthly: { jan: 27, feb: 28, mar: 29, apr: 29, may: 27, jun: 28, jul: 30, aug: 31, sep: 34, oct: 32 },
  },
  {
    metricKey: 'bronze_tech',
    benchmark: undefined,
    ytd: 48,
    monthly: { jan: 45, feb: 46, mar: 47, apr: 47, may: 48, jun: 44, jul: 51, aug: 51, sep: 49, oct: 48 },
  },
  {
    metricKey: 'junior_tech',
    benchmark: undefined,
    ytd: 39,
    monthly: { jan: 39, feb: 39, mar: 39, apr: 39, may: 39, jun: 40, jul: 35, aug: 36, sep: 37, oct: 42 },
  },
  {
    metricKey: 'workforce_capacity',
    benchmark: undefined,
    ytd: 126.6,
    monthly: { jan: 116.9, feb: 118.0, mar: 120.0, apr: 116.9, may: 118.5, jun: 120.0, jul: 122.0, aug: 126.8, sep: 125.5, oct: 124.5 },
  },
  {
    metricKey: 'indirect_worker',
    benchmark: undefined,
    ytd: 140,
    monthly: { jan: 130, feb: 132, mar: 135, apr: 136, may: 138, jun: 139, jul: 140, aug: 141, sep: 149, oct: 145 },
  },
  {
    metricKey: 'workbay',
    benchmark: 96,
    ytd: 96,
    monthly: { jan: 87, feb: 87, mar: 87, apr: 106, may: 95, jun: 94, jul: 95, aug: 96, sep: 97, oct: 99 },
  },
  {
    metricKey: 'worker_per_workbay',
    benchmark: 1.2,
    ytd: 1.4,
    monthly: { jan: 1.5, feb: 1.5, mar: 1.5, apr: 1.3, may: 1.3, jun: 1.3, jul: 1.3, aug: 1.4, sep: 1.4, oct: 1.4 },
  },
  {
    metricKey: 'utilization',
    benchmark: 91.1,
    ytd: 87.2,
    monthly: { jan: 88.0, feb: 87.5, mar: 87.0, apr: 86.5, may: 85.2, jun: 86.5, jul: 88.6, aug: 86.5, sep: 86.5, oct: 86.0 },
  },
  {
    metricKey: 'performance',
    benchmark: 99.7,
    ytd: 103.8,
    monthly: { jan: 105.0, feb: 104.0, mar: 103.5, apr: 111.3, may: 103.0, jun: 103.0, jul: 103.0, aug: 103.0, sep: 103.0, oct: 95.5 },
  },
  {
    metricKey: 'productivity',
    benchmark: 90.8,
    ytd: 90.5,
    monthly: { jan: 92.0, feb: 91.0, mar: 90.5, apr: 96.7, may: 90.0, jun: 90.0, jul: 90.0, aug: 90.0, sep: 90.0, oct: 82.1 },
  },
  
  // Quality 섹션
  {
    metricKey: 'service_overall',
    benchmark: undefined,
    ytd: 0.0,
    monthly: { jan: 0.0 },
  },
  {
    metricKey: 'appearance',
    benchmark: undefined,
    ytd: 0.0,
    monthly: { jan: 0.0 },
  },
  
  // Financials 섹션
  {
    metricKey: 'throughput_actual',
    benchmark: undefined,
    ytd: 49109,
    monthly: { jan: 4679, feb: 4940, mar: 5200, apr: 5100, may: 4229, jun: 4900, jul: 5722, aug: 4700, sep: 4600, oct: 4485 },
  },
  {
    metricKey: 'throughput_target',
    benchmark: undefined,
    ytd: 53560,
    monthly: { jan: 4749, feb: 5189, mar: 5417, apr: 5543, may: 5669, jun: 5795, jul: 6293, aug: 6047, sep: 6173, oct: 4485 },
  },
  {
    metricKey: 'throughput_variance',
    benchmark: undefined,
    ytd: -8.3,
    monthly: { jan: -1.5, feb: -4.8, mar: -4.0, apr: -8.0, may: -15.0, jun: -15.4, jul: -9.1, aug: -22.3, sep: -25.5, oct: 0.0 },
  },
  {
    metricKey: 'revenue_actual',
    benchmark: undefined,
    ytd: 87897009131,
    monthly: { 
      jan: 7969153082, feb: 8500000000, mar: 8900000000, apr: 8700000000, 
      may: 8600000000, jun: 8500000000, jul: 8400000000, aug: 8300000000, 
      sep: 9825305363, oct: 7860711157 
    },
  },
  {
    metricKey: 'revenue_target',
    benchmark: undefined,
    ytd: 85753730330,
    monthly: { 
      jan: 7183539260, feb: 7600000000, mar: 8000000000, apr: 9698145105, 
      may: 8400000000, jun: 8600000000, jul: 8800000000, aug: 9000000000, 
      sep: 9200000000, oct: 7500000000 
    },
  },
  {
    metricKey: 'revenue_variance',
    benchmark: undefined,
    ytd: 2.5,
    monthly: { jan: 10.9, feb: 11.8, mar: 11.3, apr: -4.8, may: 5.0, jun: 7.3, jul: -2.4, aug: 5.4, sep: 6.3, oct: 4.0 },
  },
];

