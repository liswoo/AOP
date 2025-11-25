export type UserRole = "ADMIN" | "USER";

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    username: string;
    role: UserRole;
  };
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface UserUpdateRequest {
  email?: string;
  name?: string;
  role?: UserRole;
  enabled?: boolean;
}

/**
 * 대시보드 관련 타입 정의
 * 
 * 백엔드의 DashboardOverviewResponse와 일치하는 타입입니다.
 * 프론트에서 Chart.js에 바로 바인딩해서 사용할 수 있도록 설계된 구조입니다.
 */

/**
 * 요약 카드 타입
 * 대시보드 상단에 표시되는 요약 정보 카드
 */
export interface SummaryCard {
  label: string;    // 카드 제목 (예: "총 매출", "신규 고객")
  value: number;    // 카드 값 (예: 12500000)
  unit: string;     // 값의 단위 (예: "원", "건", "명")
}

/**
 * 차트 데이터셋 타입
 * Chart.js의 dataset 구조와 동일
 */
export interface ChartDataset {
  label: string;      // 데이터셋 레이블 (예: "2024년 매출")
  data: number[];      // 데이터 값 리스트 (예: [100, 200, 300])
}

/**
 * 차트 데이터 타입
 * Chart.js의 차트 구조와 동일
 */
export interface ChartData {
  title: string;              // 차트 제목 (예: "최근 7일 매출 추이")
  labels: string[];           // X축 레이블 리스트 (예: ["월", "화", "수"])
  datasets: ChartDataset[];  // 데이터셋 리스트 (여러 시리즈를 표시할 수 있음)
}

/**
 * 대시보드 개요 응답 타입
 * 대시보드 화면에 표시할 모든 데이터를 담는 타입
 */
export interface DashboardOverview {
  summaryCards: SummaryCard[];  // 상단 요약 카드 목록
  lineChart: ChartData;        // 라인 차트 데이터 (예: 시계열 데이터)
  barChart: ChartData;         // 바 차트 데이터 (예: 카테고리별 비교)
  doughnutChart: ChartData;    // 도넛 차트 데이터 (예: 비율 표시)
}

