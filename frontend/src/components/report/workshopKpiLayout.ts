/**
 * Workshop KPI 시트 레이아웃 정의
 * 
 * 엑셀 템플릿 구조를 정의하는 설정 파일입니다.
 * 행의 타입과 구조를 명시적으로 정의하여 디자인과 데이터를 분리합니다.
 */

/**
 * 행 타입 정의
 */
export type RowType = 'title' | 'period' | 'section' | 'metric' | 'spacer';

/**
 * 섹션 키 타입
 */
export type SectionKey = 'operations' | 'quality' | 'financials';

/**
 * Workshop KPI 행 설정 인터페이스
 */
export interface WorkshopKpiRowConfig {
  /** 행 고유 ID */
  id: string;
  /** 행 타입 */
  type: RowType;
  /** 행의 첫 번째 셀에 표시될 텍스트 (label) */
  label?: string;
  /** 섹션 키 (section 타입인 경우) */
  sectionKey?: SectionKey;
  /** 지표 키 (metric 타입인 경우, 데이터 매칭에 사용) */
  metricKey?: string;
}

/**
 * 컬럼 이름 정의
 * 엑셀 템플릿의 컬럼 순서와 일치해야 합니다.
 */
export const WORKSHOP_KPI_COLUMNS = [
  'metricName',  // 지표명
  'benchmark',   // Benchmark
  'ytd',         // YTD (Year To Date)
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',  // 월별 컬럼
] as const;

/**
 * Workshop KPI 행 구성
 * 
 * 엑셀 템플릿의 구조를 그대로 재현합니다:
 * - Title 행: "Workshop KPI - Total" (전체 컬럼 병합)
 * - Period 행: "Period : 2025-10 (All Dealer)" (전체 컬럼 병합)
 * - Spacer: 빈 행 (시각적 구분용)
 * - Section: "Operations", "Quality", "Financials" (전체 컬럼 병합)
 * - Metric: 실제 지표 행들
 */
export const WORKSHOP_KPI_ROWS: WorkshopKpiRowConfig[] = [
  // Title 행
  { id: 'title', type: 'title', label: 'Workshop KPI - Total' },
  
  // Period 행
  { id: 'period', type: 'period', label: 'Period : 2025-10 (All Dealer)' },
  
  // Spacer
  { id: 'spacer-1', type: 'spacer' },
  
  // Operations Section
  { id: 'sec-operations', type: 'section', label: 'Operations', sectionKey: 'operations' },
  
  { id: 'metric-direct-worker', type: 'metric', sectionKey: 'operations', metricKey: 'direct_worker', label: 'No. of direct worker' },
  { id: 'metric-gold-tech', type: 'metric', sectionKey: 'operations', metricKey: 'gold_tech', label: 'Advanced technician or Gold level' },
  { id: 'metric-silver-tech', type: 'metric', sectionKey: 'operations', metricKey: 'silver_tech', label: 'Technician over 5 years or Silver level' },
  { id: 'metric-bronze-tech', type: 'metric', sectionKey: 'operations', metricKey: 'bronze_tech', label: 'Technician over 3 years or Bronze level' },
  { id: 'metric-junior-tech', type: 'metric', sectionKey: 'operations', metricKey: 'junior_tech', label: 'Technician less than 3 years' },
  { id: 'metric-workforce-capacity', type: 'metric', sectionKey: 'operations', metricKey: 'workforce_capacity', label: 'Workforce capacity' },
  { id: 'metric-indirect-worker', type: 'metric', sectionKey: 'operations', metricKey: 'indirect_worker', label: 'No. of indirect worker' },
  { id: 'metric-workbay', type: 'metric', sectionKey: 'operations', metricKey: 'workbay', label: 'No. of workbay' },
  { id: 'metric-worker-per-workbay', type: 'metric', sectionKey: 'operations', metricKey: 'worker_per_workbay', label: 'Direct worker per workbay' },
  { id: 'metric-utilization', type: 'metric', sectionKey: 'operations', metricKey: 'utilization', label: 'Utilization(%)' },
  { id: 'metric-performance', type: 'metric', sectionKey: 'operations', metricKey: 'performance', label: 'Performance(%)' },
  { id: 'metric-productivity', type: 'metric', sectionKey: 'operations', metricKey: 'productivity', label: 'Productivity(%)' },
  
  // Spacer
  { id: 'spacer-2', type: 'spacer' },
  
  // Quality Section
  { id: 'sec-quality', type: 'section', label: 'Quality', sectionKey: 'quality' },
  
  { id: 'metric-service-overall', type: 'metric', sectionKey: 'quality', metricKey: 'service_overall', label: 'Service overall' },
  { id: 'metric-appearance', type: 'metric', sectionKey: 'quality', metricKey: 'appearance', label: 'Appearance' },
  
  // Spacer
  { id: 'spacer-3', type: 'spacer' },
  
  // Financials Section
  { id: 'sec-financials', type: 'section', label: 'Financials', sectionKey: 'financials' },
  
  { id: 'metric-throughput-actual', type: 'metric', sectionKey: 'financials', metricKey: 'throughput_actual', label: 'Throughput(Actual)' },
  { id: 'metric-throughput-target', type: 'metric', sectionKey: 'financials', metricKey: 'throughput_target', label: 'Throughput(Target)' },
  { id: 'metric-throughput-variance', type: 'metric', sectionKey: 'financials', metricKey: 'throughput_variance', label: 'Throughput(Variance%)' },
  { id: 'metric-revenue-actual', type: 'metric', sectionKey: 'financials', metricKey: 'revenue_actual', label: 'Revenue(Actual)' },
  { id: 'metric-revenue-target', type: 'metric', sectionKey: 'financials', metricKey: 'revenue_target', label: 'Revenue(Target)' },
  { id: 'metric-revenue-variance', type: 'metric', sectionKey: 'financials', metricKey: 'revenue_variance', label: 'Revenue(Variance%)' },
];



