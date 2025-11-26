/**
 * 사용자 대시보드 페이지
 * 
 * 일반 사용자가 로그인 후 처음 보게 되는 대시보드 화면입니다.
 * LONGVIEW 스타일의 카드형 그리드 레이아웃을 사용합니다.
 * 
 * react-grid-layout을 사용하여 대시보드 카드를 드래그로 재배치할 수 있도록 만든다.
 * 향후 카드 숨기기/도킹 기능 구현 시, activeCards/dockedCards 상태를 추가할 예정
 * 
 * 동작 흐름:
 * 1. 페이지가 마운트되면 getDashboardOverview() API를 호출합니다.
 * 2. 백엔드에서 받은 데이터를 상태에 저장합니다.
 * 3. 6개의 카드로 구성된 그리드 레이아웃으로 대시보드를 렌더링합니다.
 * 4. react-grid-layout을 통해 카드를 드래그하여 재배치할 수 있습니다.
 * 
 * 레이아웃:
 * - 상단: 기간/집계 필터 바
 * - 메인: 2행 × 3열 카드 그리드 (반응형, 드래그 가능)
 *   - 1행: 주요 손익(표), 품질 현황(레이다 차트), 재고 현황(막대 차트)
 *   - 2행: 매출 Trend(라인 차트), 인원 현황(요약+막대 차트), 비가동 실적(도넛 차트)
 * 
 * 카드 기능:
 * - 각 카드에는 말풍선(💬) 아이콘이 있어 AI 분석 요청 모달을 열 수 있습니다.
 * - 즐겨찾기(♥) 아이콘으로 카드를 즐겨찾기에 추가할 수 있습니다.
 * - 카드 헤더를 드래그하여 위치를 변경할 수 있습니다.
 * 
 * Chart.js + react-chartjs-2를 사용하여 차트를 렌더링합니다.
 * 백엔드에서 받은 데이터와 프론트에서 생성한 더미 데이터를 혼합하여 사용합니다.
 * TODO: 향후 실제 통계 데이터로 교체 예정
 * TODO: 카드 레이아웃을 localStorage 등에 저장하여, 새로고침 후에도 사용자 맞춤 레이아웃 유지
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler, // Line 차트의 fill 옵션을 사용하기 위한 플러그인
} from 'chart.js';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { getDashboardOverview, DashboardQuery } from '../api/dashboardApi';
import { DashboardOverview } from '../types';
import { DashboardCardId, DashboardLayoutItem, defaultDashboardLayout } from '../types/dashboard';
import DashboardCard from '../components/dashboard/DashboardCard';
import AiPromptModal from '../components/dashboard/AiPromptModal';
import 'react-grid-layout/css/styles.css';
import '../styles/dashboard.css';

// Chart.js에 필요한 컴포넌트들을 등록합니다.
// 이렇게 등록해야 react-chartjs-2에서 차트를 렌더링할 수 있습니다.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale, // Radar 차트용
  Title,
  Tooltip,
  Legend,
  Filler // Line 차트의 fill 옵션을 사용하기 위한 플러그인
);

// react-grid-layout의 Responsive 컴포넌트를 WidthProvider로 래핑
// WidthProvider는 컨테이너의 너비를 자동으로 감지하여 Responsive 컴포넌트에 전달합니다.
const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * 행 높이 상수 (그리드 단위)
 * 
 * react-grid-layout의 rowHeight와 일치시켜야 합니다.
 */
const ROW_HEIGHT = 6;

/**
 * 활성화된 대시보드 카드 목록을 받아서
 * 카드 개수에 따라 1~3열 프리셋 레이아웃을 계산하는 함수입니다.
 * 
 * 규칙:
 * - 1개: 1열(풀폭)
 * - 2개: 2열
 * - 3개: 3열
 * - 4개: 2열 × 2행
 * - 5개 이상: 3열(최대 6개)
 * 
 * 이렇게 정해진 규칙으로만 레이아웃을 자동 재배치하여
 * 화면 공간을 효율적으로 쓰면서도
 * 사용자가 레이아웃 변화를 예측할 수 있게 만듭니다.
 */
function computeLayout(activeCards: DashboardCardId[]): Layout[] {
  const n = activeCards.length;

  // 카드 개수에 따라 컬럼 수 결정
  const colCount =
    n <= 1 ? 1 :
    n === 2 ? 2 :
    n === 3 ? 3 :
    n === 4 ? 2 :
    3; // 5~6개는 3열

  // 각 카드의 너비 (12열 그리드 기준)
  const w = 12 / colCount;
  // 각 카드의 높이 (공통 값)
  const h = ROW_HEIGHT;

  // 각 카드의 위치 계산
  return activeCards.map((id, index) => {
    const row = Math.floor(index / colCount);
    const col = index % colCount;

    return {
      i: id,
      x: col * w,
      y: row * h,
      w,
      h,
    };
  });
}

/**
 * 카드 ID를 한글 제목으로 변환하는 유틸 함수
 */
/**
 * 카드 제목 반환
 */
function getCardTitle(id: DashboardCardId): string {
  switch (id) {
    case 'profit': return '주요 손익';
    case 'quality': return '품질 현황';
    case 'stock': return '재고 현황';
    case 'trend': return '매출 Trend';
    case 'people': return '인원 현황';
    case 'downtime': return '비가동 실적';
  }
}

/**
 * 카드 부제목 반환
 */
function getCardSubtitle(id: DashboardCardId): string | undefined {
  switch (id) {
    case 'profit': return '단위: 억원, %';
    case 'quality': return '단위: Point';
    case 'stock': return '단위: MT';
    case 'trend': return '단위: 억원, %';
    case 'people': return '단위: 명, %';
    case 'downtime': return '단위: 백만원';
    default: return undefined;
  }
}

/**
 * 카드 카테고리 반환
 */
function getCardCategory(id: DashboardCardId): string {
  return 'M'; // 모든 카드가 'M' 카테고리
}

/**
 * UserDashboardPage 컴포넌트
 * 
 * 대시보드 화면을 렌더링합니다.
 * 
 * 동작 흐름:
 * 1. 컴포넌트가 마운트되면 useEffect가 실행됩니다.
 * 2. getDashboardOverview() API를 호출하여 대시보드 데이터를 가져옵니다.
 * 3. 성공 시 overview 상태에 저장하고, 실패 시 에러 메시지를 표시합니다.
 * 4. overview 데이터를 사용하여 요약 카드와 차트를 렌더링합니다.
 */
const UserDashboardPage: React.FC = () => {
  // URL 쿼리 파라미터 관리
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 필터 상태
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  // 기간 선택 모드 (최근 7일, 이번 달, 지난 달, 직접 선택)
  const [periodMode, setPeriodMode] = useState<'recent7' | 'thisMonth' | 'lastMonth' | 'custom'>('recent7');

  // 대시보드 데이터 상태
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 에러 상태
  const [error, setError] = useState<string | null>(null);
  
  // AI 모달 상태 관리
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState<string>('');
  
  // 대시보드 카드 상태 관리
  // activeCards: 현재 대시보드 그리드에 표시되는 카드들 (순서 포함)
  // dockedCards: 상단 탭 영역으로 빼 놓은 카드들
  const [activeCards, setActiveCards] = useState<DashboardCardId[]>([
    'profit',
    'quality',
    'stock',
    'trend',
    'people',
    'downtime',
  ]);
  const [dockedCards, setDockedCards] = useState<DashboardCardId[]>([]);

  // 확대된 카드 ID 관리 (null이면 확대 상태 아님)
  const [expandedCardId, setExpandedCardId] = useState<DashboardCardId | null>(null);
  
  // 확대된 카드 콘텐츠 렌더링 함수를 저장할 ref
  const renderExpandedCardContentRef = useRef<((cardId: DashboardCardId) => React.ReactNode) | null>(null);

  // 드래그 상태 관리
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  // 드래그 중 도킹 바 하이라이트 여부
  const [isDockTargetActive, setIsDockTargetActive] = useState(false);
  // 전역 마우스 위치 추적용 ref
  const currentMouseYRef = useRef<number | null>(null);

  // 도킹 바 DOM을 참조하기 위한 ref
  const dockBarRef = useRef<HTMLDivElement | null>(null);

  // ESC 키로 확대 카드 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedCardId) {
        setExpandedCardId(null);
      }
    };

    if (expandedCardId) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [expandedCardId]);

  /**
   * URL 쿼리 파라미터에서 필터 값 초기화
   * 
   * /dashboard?from=2025-11-01&to=2025-11-30&groupBy=DAY 형태로 접근 시
   * 해당 값을 초기 state에 반영합니다.
   */
  useEffect(() => {
    const urlFrom = searchParams.get('from');
    const urlTo = searchParams.get('to');
    const urlGroupBy = searchParams.get('groupBy') as 'DAY' | 'WEEK' | 'MONTH' | null;

    if (urlFrom) setFrom(urlFrom);
    if (urlTo) setTo(urlTo);
    if (urlGroupBy && ['DAY', 'WEEK', 'MONTH'].includes(urlGroupBy)) {
      setGroupBy(urlGroupBy);
    }

    // URL에 값이 있으면 직접 선택 모드로 설정
    if (urlFrom || urlTo) {
      setPeriodMode('custom');
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  /**
   * 기간 선택 모드에 따라 from/to 날짜 자동 설정
   */
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    switch (periodMode) {
      case 'recent7':
        // 최근 7일
        setFrom(null);
        setTo(null);
        break;
      case 'thisMonth':
        // 이번 달 (1일 ~ 오늘)
        setFrom(`${year}-${String(month + 1).padStart(2, '0')}-01`);
        setTo(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        break;
      case 'lastMonth':
        // 지난 달
        const lastMonth = month === 0 ? 11 : month - 1;
        const lastMonthYear = month === 0 ? year - 1 : year;
        const lastMonthDays = new Date(year, month, 0).getDate();
        setFrom(`${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01`);
        setTo(`${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-${String(lastMonthDays).padStart(2, '0')}`);
        break;
      case 'custom':
        // 직접 선택 모드는 from/to를 그대로 유지
        break;
    }
  }, [periodMode]);

  /**
   * 대시보드 데이터 조회 함수
   * 
   * 기간과 집계 단위에 따라 대시보드 데이터를 다시 불러옵니다.
   * from/to가 null이면 백엔드에서 기본값(최근 7일)을 사용합니다.
   */
  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 쿼리 파라미터 구성
      const query: DashboardQuery = {
        groupBy,
      };
      if (from) query.from = from;
      if (to) query.to = to;

      // GET /api/dashboard/overview API를 호출하여 대시보드 데이터를 가져옵니다.
      const data = await getDashboardOverview(query);
      
      // 성공 시 상태에 저장
      setOverview(data);

      // URL 쿼리 파라미터 업데이트
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('groupBy', groupBy);
      navigate(`/dashboard?${params.toString()}`, { replace: true });
    } catch (err: any) {
      // 에러 발생 시 에러 메시지 저장
      console.error('대시보드 데이터 로드 실패:', err);
      let errorMessage = '대시보드 데이터를 불러오는데 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      // 로딩 완료
      setIsLoading(false);
    }
  };

  /**
   * 컴포넌트가 마운트될 때 또는 필터가 변경될 때 대시보드 데이터를 불러옵니다.
   * 
   * 초기 로딩 시에는 URL 쿼리 파라미터가 있으면 그것을 사용하고,
   * 없으면 기본값(최근 7일, 일별)을 사용합니다.
   */
  useEffect(() => {
    // URL 쿼리 파라미터가 있으면 그것을 사용하여 한 번만 호출
    const urlFrom = searchParams.get('from');
    const urlTo = searchParams.get('to');
    const urlGroupBy = searchParams.get('groupBy');

    if (urlFrom || urlTo || urlGroupBy) {
      // URL 파라미터가 있으면 초기 로딩만 수행
      handleSearch();
    } else {
      // URL 파라미터가 없으면 기본값으로 초기 로딩
      handleSearch();
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  /**
   * 필터 변경 시 자동으로 데이터 다시 로드
   * 
   * periodMode나 groupBy가 변경되면 자동으로 handleSearch를 호출합니다.
   * 단, periodMode가 'custom'일 때는 사용자가 직접 날짜를 입력하고 조회 버튼을 눌러야 하므로
   * 자동 검색하지 않습니다.
   * 
   * 주의: 초기 마운트 시에는 첫 번째 useEffect에서 이미 처리하므로,
   * 이 useEffect는 필터가 변경될 때만 실행되도록 해야 합니다.
   */
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // 초기 마운트 시에는 건너뜀
    }
    
    // 필터가 변경될 때만 자동 검색
    if (periodMode !== 'custom') {
      // 기간 모드가 변경되면 자동으로 검색
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodMode, groupBy]); // periodMode나 groupBy가 변경되면 자동 검색

  /**
   * 현재 선택된 기간과 집계 단위를 문자열로 반환
   */
  const getPeriodDescription = (): string => {
    if (periodMode === 'recent7') {
      return '최근 7일';
    } else if (periodMode === 'thisMonth') {
      return '이번 달';
    } else if (periodMode === 'lastMonth') {
      return '지난 달';
    } else if (from && to) {
      return `${from} ~ ${to}`;
    }
    return '최근 7일';
  };

  const getGroupByDescription = (): string => {
    const groupByMap = {
      DAY: '일별',
      WEEK: '주별',
      MONTH: '월별',
    };
    return groupByMap[groupBy];
  };

  // 라인 차트 데이터 변환 (다크 테마 색상 적용)
  const lineChartData = overview ? {
    labels: overview.lineChart.labels,
    datasets: overview.lineChart.datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: 'rgb(139, 92, 246)', // 다크 테마: 보라색
      backgroundColor: 'rgba(139, 92, 246, 0.2)', // 다크 테마: 반투명 보라색
      tension: 0.1,
      fill: true,
    })),
  } : null;

  // 바 차트 데이터 변환 (다크 테마 색상 적용)
  const barChartData = overview ? {
    labels: overview.barChart.labels,
    datasets: overview.barChart.datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: [
        'rgba(139, 92, 246, 0.7)', // 보라색
        'rgba(59, 130, 246, 0.7)', // 파란색
        'rgba(99, 102, 241, 0.7)', // 인디고
        'rgba(139, 92, 246, 0.5)', // 연한 보라색
        'rgba(59, 130, 246, 0.5)', // 연한 파란색
      ],
      borderColor: [
        'rgba(139, 92, 246, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(99, 102, 241, 1)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(59, 130, 246, 0.8)',
      ],
      borderWidth: 2,
    })),
  } : null;

  // 도넛 차트 데이터 변환 (다크 테마 색상 적용)
  const doughnutChartData = overview ? {
    labels: overview.doughnutChart.labels,
    datasets: overview.doughnutChart.datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: [
        'rgba(139, 92, 246, 0.7)', // 보라색
        'rgba(59, 130, 246, 0.7)', // 파란색
        'rgba(99, 102, 241, 0.7)', // 인디고
        'rgba(168, 85, 247, 0.7)', // 밝은 보라색
      ],
      borderColor: [
        'rgba(139, 92, 246, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(99, 102, 241, 1)',
        'rgba(168, 85, 247, 1)',
      ],
      borderWidth: 2,
    })),
  } : null;

  // 공통 차트 옵션 (다크 테마)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#cbd5e1', // 다크 테마: 밝은 회색 텍스트
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        color: '#f1f5f9', // 다크 테마: 밝은 텍스트
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8', // 다크 테마: 회색 텍스트
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)', // 다크 테마: 연한 그리드
        },
      },
      y: {
        ticks: {
          color: '#94a3b8', // 다크 테마: 회색 텍스트
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)', // 다크 테마: 연한 그리드
        },
      },
    },
  };

  /**
   * AI 모달 열기 핸들러
   * 각 카드의 말풍선 버튼에서 호출됩니다.
   */
  const handleChatClick = (cardTitle: string) => {
    setAiModalTitle(cardTitle);
    setAiModalOpen(true);
  };

  /**
   * 활성 카드 목록을 기반으로 레이아웃 계산
   * 
   * activeCards가 변경될 때마다 자동으로 레이아웃을 재계산합니다.
   */
  const layout = useMemo(
    () => computeLayout(activeCards),
    [activeCards]
  );

  /**
   * 도킹 임계값 상수
   * 
   * - DOCKING_VERTICAL_THRESHOLD: 위로 드래그해야 하는 최소 거리(px)
   * - DOCKING_NEAR_BAR_OFFSET: 도킹 바 하단으로부터 허용되는 드롭 범위(px)
   */
  const DOCKING_VERTICAL_THRESHOLD = 40; // 최소 위로 이동량(px)
  const DOCKING_NEAR_BAR_OFFSET = 60;   // 도킹 바 아래쪽 허용 범위(px) - 1.5배 확대

  /**
   * 카드를 그리드에서 제거하고 상단 도킹 탭으로 이동
   * 
   * @param id 도킹할 카드 ID
   */
  const dockCard = (id: DashboardCardId) => {
    setActiveCards(prev => prev.filter(cardId => cardId !== id));
    setDockedCards(prev =>
      prev.includes(id) ? prev : [...prev, id]
    );
  };

  /**
   * 도킹된 카드를 다시 그리드에 복귀
   * 
   * @param id 언도킹할 카드 ID
   */
  const undockCard = (id: DashboardCardId) => {
    setDockedCards(prev => prev.filter(cardId => cardId !== id));
    setActiveCards(prev =>
      prev.includes(id) ? prev : [...prev, id]
    );
  };


  /**
   * 현재 날짜를 기준일자 형식으로 반환
   */
  const getCurrentDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 로딩 중일 때 표시할 내용 (필터 바는 표시)
  const renderContent = () => {
    if (isLoading && !overview) {
      return <div style={styles.loading}>로딩 중...</div>;
    }

    if (!overview) {
      return <div style={styles.error}>데이터가 없습니다.</div>;
    }

    // TODO: 향후 실제 통계 데이터로 교체 예정
    // 현재는 백엔드에서 받은 더미 데이터와 프론트에서 생성한 더미 데이터를 혼합하여 사용합니다.
    // 백엔드에서 기간 조건에 따라 변동하는 데이터: lineChart, barChart(재고 현황), doughnutChart(비가동 실적)

    // 기간에 따른 변동 계수 계산 (기간이 길수록 값이 커지도록)
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : new Date();
    const daysBetween = fromDate && toDate 
      ? Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 7;
    const periodMultiplier = 1.0 + (daysBetween * 0.05);

    // (1) 주요 손익 카드용 더미 데이터 (기간 조건에 따라 변동)
    const baseSales = 2291 * periodMultiplier;
    const currentSales = 6284 * periodMultiplier;
    const profitLossData = [
      { 
        label: '매출액', 
        prevYear: Math.round(2291 * periodMultiplier), 
        currentYear: Math.round(currentSales), 
        achievement: Math.round((currentSales / baseSales) * 100 * 10) / 10, 
        growth: 21.3 + (Math.random() * 5 - 2.5), 
        isPositive: true 
      },
      { 
        label: '영업이익', 
        prevYear: Math.round(616 * periodMultiplier), 
        currentYear: Math.round(3542 * periodMultiplier), 
        achievement: 575.0 + (Math.random() * 20 - 10), 
        growth: 13.5 + (Math.random() * 3 - 1.5), 
        isPositive: true 
      },
      { 
        label: '당기순이익', 
        prevYear: Math.round(-90 * periodMultiplier), 
        currentYear: Math.round(323 * periodMultiplier), 
        achievement: 358.9 + (Math.random() * 30 - 15), 
        growth: -2.5 + (Math.random() * 2 - 1), 
        isPositive: false 
      },
      { 
        label: '총자산', 
        prevYear: Math.round(3813 * periodMultiplier), 
        currentYear: Math.round(5275 * periodMultiplier), 
        achievement: 138.3 + (Math.random() * 10 - 5), 
        growth: 17.2 + (Math.random() * 2 - 1), 
        isPositive: true 
      },
      { 
        label: '실차입금', 
        prevYear: Math.round(60 * periodMultiplier), 
        currentYear: Math.round(68 * periodMultiplier), 
        achievement: 113.3 + (Math.random() * 5 - 2.5), 
        growth: 3.6 + (Math.random() * 1 - 0.5), 
        isPositive: true 
      },
    ];

    // (2) 품질 현황 카드용 Radar 차트 데이터 (기간 조건에 따라 변동)
    const qualityBase = 70 + (daysBetween * 0.5);
    const qualityRadarData = {
      labels: ['불량률', '만족도', '생산성', '인건비', '납기준수'],
      datasets: [{
        label: '품질 현황',
        data: [
          Math.max(0, Math.min(100, qualityBase + (Math.random() * 10 - 5))), // 불량률 (낮을수록 좋음, 반대로 계산)
          Math.max(0, Math.min(100, qualityBase + 15 + (Math.random() * 10 - 5))), // 만족도
          Math.max(0, Math.min(100, qualityBase + 20 + (Math.random() * 10 - 5))), // 생산성
          Math.max(0, Math.min(100, qualityBase - 5 + (Math.random() * 10 - 5))), // 인건비
          Math.max(0, Math.min(100, qualityBase + 18 + (Math.random() * 10 - 5))), // 납기준수
        ],
        borderColor: 'rgb(139, 92, 246)', // 다크 테마: 보라색
        backgroundColor: 'rgba(139, 92, 246, 0.2)', // 다크 테마: 반투명 보라색
        borderWidth: 2,
      }],
    };

    // (3) 재고 현황 카드용 Bar 차트 데이터 (백엔드에서 받은 barChart 활용, 다크 테마 색상)
    const inventoryBarData = overview.barChart ? {
      labels: overview.barChart.labels,
      datasets: overview.barChart.datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)', // 전월재고 - 파란색
          'rgba(139, 92, 246, 0.7)', // 입고 - 보라색
          'rgba(239, 68, 68, 0.7)', // 출하내수 - 빨간색
          'rgba(239, 68, 68, 0.7)', // 출하수출 - 빨간색
          'rgba(239, 68, 68, 0.7)', // 기타 - 빨간색
          'rgba(59, 130, 246, 0.7)', // 월말재고 - 파란색
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 2,
      })),
    } : null;

    // (4) 매출 Trend 카드용 라인 차트 데이터 (기존 overview.lineChart 활용)
    const salesTrendLineData = lineChartData;

    // (5) 인원 현황 카드용 더미 데이터 (기간 조건에 따라 변동)
    const basePersonnel = 159;
    const personnelMultiplier = 1.0 + (daysBetween * 0.01);
    const personnelSummary = {
      total: Math.round(basePersonnel * personnelMultiplier),
      si: Math.round(68 * personnelMultiplier),
      sm: Math.round(91 * personnelMultiplier),
    };
    const personnelBarData = {
      labels: ['1년차', '2년차', '3년차', '4년차', '5년차 이상'],
      datasets: [{
        label: '인원 수',
        data: [
          Math.round(25 * personnelMultiplier),
          Math.round(35 * personnelMultiplier),
          Math.round(45 * personnelMultiplier),
          Math.round(30 * personnelMultiplier),
          Math.round(24 * personnelMultiplier),
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // 다크 테마: 파란색
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      }],
    };

    // (6) 비가동 실적 카드용 멀티 도넛 차트 데이터 (백엔드에서 받은 doughnutChart 활용)
    const downtimeDoughnutData = overview.doughnutChart ? {
      labels: overview.doughnutChart.labels,
      datasets: overview.doughnutChart.datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: index === 0 
          ? 'rgba(239, 68, 68, 0.7)' // 계획 - 빨간색
          : index === 1
          ? 'rgba(251, 191, 36, 0.7)' // 실적 - 노란색
          : [
              'rgba(139, 92, 246, 0.7)', // 보라색
              'rgba(59, 130, 246, 0.7)', // 파란색
              'rgba(99, 102, 241, 0.7)', // 인디고
              'rgba(168, 85, 247, 0.7)', // 밝은 보라색
              'rgba(251, 191, 36, 0.7)', // 노란색
            ],
        borderColor: index === 0
          ? 'rgba(239, 68, 68, 1)'
          : index === 1
          ? 'rgba(251, 191, 36, 1)'
          : [
              'rgba(139, 92, 246, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(99, 102, 241, 1)',
              'rgba(168, 85, 247, 1)',
              'rgba(251, 191, 36, 1)',
            ],
        borderWidth: 2,
      })),
    } : null;

    /**
     * 확대된 카드의 콘텐츠 렌더링
     * 
     * 기존 renderCard와 동일한 로직이지만, 확대된 화면에 맞게 높이를 조정합니다.
     */
    const renderExpandedCardContent = (cardId: DashboardCardId) => {
      switch (cardId) {
        case 'profit':
          return (
            <table style={{ ...styles.profitTable, width: '100%' }}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>구분</th>
                  <th style={styles.tableHeader}>전년</th>
                  <th style={styles.tableHeader}>당년</th>
                  <th style={styles.tableHeader}>달성률</th>
                  <th style={styles.tableHeader}>성장률</th>
                </tr>
              </thead>
              <tbody>
                {profitLossData.map((row, index) => (
                  <tr key={index}>
                    <td style={styles.tableCell}>{row.label}</td>
                    <td style={styles.tableCell}>{row.prevYear.toLocaleString()}</td>
                    <td style={styles.tableCell}>{row.currentYear.toLocaleString()}</td>
                    <td style={styles.tableCell}>{row.achievement.toFixed(1)}%</td>
                    <td style={{
                      ...styles.tableCell,
                      color: row.isPositive ? '#10b981' : '#ef4444',
                    }}>
                      {row.isPositive ? '▲' : '▼'}{Math.abs(row.growth).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );

        case 'quality':
          return (
            <div className="chart-container" style={{ height: '500px' }}>
              <Radar data={qualityRadarData} options={{
                ...chartOptions,
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      color: '#94a3b8',
                    },
                    grid: {
                      color: 'rgba(148, 163, 184, 0.1)',
                    },
                    pointLabels: {
                      color: '#cbd5e1',
                    },
                  },
                },
              }} />
            </div>
          );

        case 'stock':
          return inventoryBarData ? (
            <div className="chart-container" style={{ height: '500px' }}>
              <Bar data={inventoryBarData} options={chartOptions} />
            </div>
          ) : (
            <div style={styles.loading}>데이터 로딩 중...</div>
          );

        case 'trend':
          return salesTrendLineData ? (
            <div className="chart-container" style={{ height: '500px' }}>
              <Line data={salesTrendLineData} options={chartOptions} />
            </div>
          ) : (
            <div style={styles.loading}>데이터 로딩 중...</div>
          );

        case 'people':
          return (
            <>
              <div style={styles.personnelSummary}>
                <div style={styles.personnelItem}>
                  <span style={styles.personnelLabel}>총 인원:</span>
                  <span style={styles.personnelValue}>{personnelSummary.total}명</span>
                </div>
                <div style={styles.personnelItem}>
                  <span style={styles.personnelLabel}>SI:</span>
                  <span style={styles.personnelValue}>{personnelSummary.si}명</span>
                </div>
                <div style={styles.personnelItem}>
                  <span style={styles.personnelLabel}>SM:</span>
                  <span style={styles.personnelValue}>{personnelSummary.sm}명</span>
                </div>
              </div>
              <div className="chart-container" style={{ height: '400px', marginTop: '20px' }}>
                <Bar data={personnelBarData} options={chartOptions} />
              </div>
            </>
          );

        case 'downtime':
          return downtimeDoughnutData ? (
            <div className="chart-container" style={{ height: '500px' }}>
              <Doughnut data={downtimeDoughnutData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'right' as const,
                  },
                },
              }} />
            </div>
          ) : (
            <div style={styles.loading}>데이터 로딩 중...</div>
          );

        default:
          return null;
      }
    };

    /**
     * 카드 렌더링 함수
     * 
     * layout 배열을 기반으로 각 카드를 렌더링합니다.
     * react-grid-layout의 ResponsiveGridLayout 내부에서 사용됩니다.
     */
    const renderCard = (cardId: DashboardCardId) => {
      switch (cardId) {
        case 'profit':
          return (
            <DashboardCard
              title="주요 손익"
              subtitle="단위: 억원, %"
              category="M"
              footerText={`기준일자: ${getCurrentDateString()}`}
              onChatClick={() => handleChatClick('주요 손익')}
              onDock={() => dockCard('profit')}
              onToggleExpand={() => {
                setExpandedCardId(prev => prev === 'profit' ? null : 'profit');
              }}
              style={{ height: '100%' }}
            >
              <table style={styles.profitTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>구분</th>
                    <th style={styles.tableHeader}>전년</th>
                    <th style={styles.tableHeader}>당년</th>
                    <th style={styles.tableHeader}>달성률</th>
                    <th style={styles.tableHeader}>성장률</th>
                  </tr>
                </thead>
                <tbody>
                  {profitLossData.map((row, index) => (
                    <tr key={index}>
                      <td style={styles.tableCell}>{row.label}</td>
                      <td style={styles.tableCell}>{row.prevYear.toLocaleString()}</td>
                      <td style={styles.tableCell}>{row.currentYear.toLocaleString()}</td>
                      <td style={styles.tableCell}>{row.achievement.toFixed(1)}%</td>
                      <td style={{
                        ...styles.tableCell,
                        color: row.isPositive ? '#10b981' : '#ef4444', // 다크 테마: 초록색/빨간색
                      }}>
                        {row.isPositive ? '▲' : '▼'}{Math.abs(row.growth).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DashboardCard>
          );

        case 'quality':
          return (
            <DashboardCard
              title="품질 현황"
              subtitle="단위: Point"
              category="M"
              footerText={`기준일자: ${getCurrentDateString()}`}
              onChatClick={() => handleChatClick('품질 현황')}
              onDock={() => dockCard('quality')}
              onToggleExpand={() => {
                setExpandedCardId(prev => prev === 'quality' ? null : 'quality');
              }}
              style={{ height: '100%' }}
            >
              <div className="chart-container">
                <Radar data={qualityRadarData} options={{
                  ...chartOptions,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        color: '#94a3b8', // 다크 테마: 회색 텍스트
                      },
                      grid: {
                        color: 'rgba(148, 163, 184, 0.1)', // 다크 테마: 연한 그리드
                      },
                      pointLabels: {
                        color: '#cbd5e1', // 다크 테마: 밝은 회색 텍스트
                      },
                    },
                  },
                }} />
              </div>
            </DashboardCard>
          );

        case 'stock':
          return (
            <DashboardCard
              title="재고 현황"
              subtitle="단위: MT"
              category="M"
              footerText={`기준일자: ${getCurrentDateString()}`}
              onChatClick={() => handleChatClick('재고 현황')}
              onDock={() => dockCard('stock')}
              onToggleExpand={() => {
                setExpandedCardId(prev => prev === 'stock' ? null : 'stock');
              }}
              style={{ height: '100%' }}
            >
              {inventoryBarData ? (
                <div className="chart-container">
                  <Bar data={inventoryBarData} options={chartOptions} />
                </div>
              ) : (
                <div style={styles.loading}>데이터 로딩 중...</div>
              )}
            </DashboardCard>
          );

        case 'trend':
          return (
            <DashboardCard
              title="매출 Trend"
              subtitle="단위: 억원, %"
              category="M"
              footerText={`기준일자: ${getCurrentDateString()}`}
              onChatClick={() => handleChatClick('매출 Trend')}
              onDock={() => dockCard('trend')}
              onToggleExpand={() => {
                setExpandedCardId(prev => prev === 'trend' ? null : 'trend');
              }}
              style={{ height: '100%' }}
            >
              {salesTrendLineData && (
                <div className="chart-container">
                  <Line data={salesTrendLineData} options={chartOptions} />
                </div>
              )}
            </DashboardCard>
          );

        case 'people':
          return (
            <DashboardCard
              title="인원 현황"
              subtitle="단위: 명, %"
              category="M"
              footerText={`기준일자: ${getCurrentDateString()}`}
              onChatClick={() => handleChatClick('인원 현황')}
              onDock={() => dockCard('people')}
              onToggleExpand={() => {
                setExpandedCardId(prev => prev === 'people' ? null : 'people');
              }}
              style={{ height: '100%' }}
            >
              <div style={styles.personnelSummary}>
                <div style={styles.personnelItem}>
                  <span style={styles.personnelLabel}>총 인원:</span>
                  <span style={styles.personnelValue}>{personnelSummary.total}명</span>
                </div>
                <div style={styles.personnelItem}>
                  <span style={styles.personnelLabel}>SI:</span>
                  <span style={styles.personnelValue}>{personnelSummary.si}명</span>
                </div>
                <div style={styles.personnelItem}>
                  <span style={styles.personnelLabel}>SM:</span>
                  <span style={styles.personnelValue}>{personnelSummary.sm}명</span>
                </div>
              </div>
              {/* react-grid-layout과 Chart.js 높이를 맞추기 위한 처리: chart-container가 남은 공간을 채우도록 flex: 1 적용 */}
              <div className="chart-container" style={{ flex: 1, minHeight: 0 }}>
                <Bar data={personnelBarData} options={chartOptions} />
              </div>
            </DashboardCard>
          );

        case 'downtime':
          return (
            <DashboardCard
              title="비가동 실적"
              subtitle="단위: 백만원"
              category="M"
              footerText={`기준일자: ${getCurrentDateString()}`}
              onChatClick={() => handleChatClick('비가동 실적')}
              onDock={() => dockCard('downtime')}
              onToggleExpand={() => {
                setExpandedCardId(prev => prev === 'downtime' ? null : 'downtime');
              }}
              style={{ height: '100%' }}
            >
              {downtimeDoughnutData ? (
                <div className="chart-container">
                  <Doughnut data={downtimeDoughnutData} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        position: 'right' as const,
                      },
                    },
                  }} />
                </div>
              ) : (
                <div style={styles.loading}>데이터 로딩 중...</div>
              )}
            </DashboardCard>
          );

        default:
          return null;
      }
    };

    // renderExpandedCardContent 함수를 ref에 저장
    renderExpandedCardContentRef.current = renderExpandedCardContent;

    return (
      <>
        {/* 
          react-grid-layout 설정:
          - isResizable=false: 사용자가 카드 크기를 변경하지 못하게 합니다.
          - compactType="vertical": 위에서 아래로만 채우기
          - preventCollision={false}: 카드들이 겹칠 수 있도록 허용 (드래그 중)
          이렇게 해서 "6개의 고정 슬롯 안에서 위치만 바꾸는" 형태의 레이아웃을 구현합니다.
        */}
        <ResponsiveGridLayout
          className="dashboard-grid"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={45}
          margin={[16, 16]}
          draggableHandle=".dashboard-card-drag-handle"
          draggableCancel=".dashboard-card-actions, .dashboard-card-body"
          isDraggable={true}
          isResizable={false}
          compactType="vertical"
          preventCollision={false}
          onDragStart={(layout, item, e) => {
            /**
             * 드래그 시작 핸들러
             * 
             * 드래그가 시작되면:
             * 1. 드래그 시작 위치(Y 좌표)를 저장
             * 2. 드래그 중인 카드 ID를 저장
             * 3. 도킹 바를 활성화하여 드롭 타겟임을 시각적으로 표시
             */
            console.log('onDragStart 호출됨:', item.i);
            setDraggingItemId(item.i);

            // 마우스/터치 이벤트에서 Y 좌표 추출
            // react-grid-layout의 이벤트는 일반 마우스 이벤트와 다를 수 있음
            let clientY: number | undefined;
            
            if (e) {
              // MouseEvent인 경우
              if ('clientY' in e) {
                clientY = (e as MouseEvent).clientY;
              }
              // TouchEvent인 경우
              else if ('touches' in e && e.touches && e.touches.length > 0) {
                clientY = e.touches[0].clientY;
              }
              // 다른 형태의 이벤트인 경우
              else if ('nativeEvent' in e) {
                const nativeEvent = (e as any).nativeEvent;
                if (nativeEvent && 'clientY' in nativeEvent) {
                  clientY = nativeEvent.clientY;
                } else if (nativeEvent && 'touches' in nativeEvent && nativeEvent.touches && nativeEvent.touches.length > 0) {
                  clientY = nativeEvent.touches[0].clientY;
                }
              }
            }
            
            // 이벤트에서 Y 좌표를 찾을 수 없으면 전역 마우스 위치 ref 사용
            if (clientY === undefined) {
              clientY = currentMouseYRef.current ?? undefined;
            }
            
            // 그래도 없으면 window.event 사용 (비표준이지만 일부 브라우저에서 동작)
            if (clientY === undefined) {
              const globalEvent = (window.event as MouseEvent) || (e as any);
              if (globalEvent && 'clientY' in globalEvent) {
                clientY = globalEvent.clientY;
              }
            }

            console.log('드래그 시작 Y 좌표:', clientY);
            if (clientY !== undefined) {
              setDragStartY(clientY);
            } else {
              console.warn('드래그 시작 Y 좌표를 찾을 수 없습니다. 전역 마우스 리스너를 사용합니다.');
              // 전역 리스너가 다음 프레임에 값을 설정할 때까지 대기
              setTimeout(() => {
                if (currentMouseYRef.current !== null) {
                  setDragStartY(currentMouseYRef.current);
                }
              }, 0);
            }

            // 드래그가 시작되면 도킹 바를 하이라이트 (드롭 타겟으로 보여주기)
            setIsDockTargetActive(true);
          }}
          onDragStop={(layout, item, e) => {
            /**
             * 드래그 종료 핸들러
             * 
             * 드래그가 끝나면:
             * 1. 도킹 바 영역에 드롭했는지 확인 (도킹 바 전체 영역 + 하단 여유 공간)
             * 2. 위로 충분히 드래그했는지 확인 (DOCKING_VERTICAL_THRESHOLD 이상)
             * 3. 두 조건을 모두 만족하면 카드를 도킹 탭으로 이동
             * 4. 항상 드래그 상태와 도킹 바 하이라이트를 초기화
             */
            console.log('onDragStop 호출됨:', { item: item.i, dragStartY, draggingItemId });
            try {
              if (!dragStartY || item.i !== draggingItemId) {
                console.log('드래그 조건 불일치:', { dragStartY, itemId: item.i, draggingItemId });
                return;
              }

              // 마우스/터치 이벤트에서 Y 좌표 추출
              // react-grid-layout의 이벤트는 일반 마우스 이벤트와 다를 수 있음
              let clientY: number | undefined;
              
              if (e) {
                // MouseEvent인 경우
                if ('clientY' in e) {
                  clientY = (e as MouseEvent).clientY;
                }
                // TouchEvent인 경우
                else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
                  clientY = e.changedTouches[0].clientY;
                }
                // 다른 형태의 이벤트인 경우
                else if ('nativeEvent' in e) {
                  const nativeEvent = (e as any).nativeEvent;
                  if (nativeEvent && 'clientY' in nativeEvent) {
                    clientY = nativeEvent.clientY;
                  } else if (nativeEvent && 'changedTouches' in nativeEvent && nativeEvent.changedTouches && nativeEvent.changedTouches.length > 0) {
                    clientY = nativeEvent.changedTouches[0].clientY;
                  }
                }
              }
              
              // 이벤트에서 Y 좌표를 찾을 수 없으면 전역 마우스 위치 ref 사용
              if (clientY === undefined) {
                clientY = currentMouseYRef.current ?? undefined;
              }
              
              // 그래도 없으면 window.event 사용
              if (clientY === undefined) {
                const globalEvent = (window.event as MouseEvent) || (e as any);
                if (globalEvent && 'clientY' in globalEvent) {
                  clientY = globalEvent.clientY;
                }
              }
              
              if (clientY === undefined) {
                console.warn('onDragStop: Y 좌표를 찾을 수 없음');
                return; // Y 좌표가 없으면 도킹 체크 불가
              }

              // 위로 드래그한 거리 계산 (위로 드래그하면 양수)
              const deltaY = dragStartY - clientY;

              // 도킹 바 영역 정보 가져오기
              const dockBarEl = dockBarRef.current;
              if (!dockBarEl) {
                console.log('도킹 바 요소를 찾을 수 없습니다.');
                return;
              }

              const rect = dockBarEl.getBoundingClientRect();

              // 도킹 바 영역 체크 (더 관대한 범위)
              // 도킹 바의 상단 위쪽 여유 공간부터 하단 아래쪽 여유 공간까지의 범위
              const isNearDockBar =
                clientY >= rect.top - DOCKING_NEAR_BAR_OFFSET &&
                clientY <= rect.bottom + DOCKING_NEAR_BAR_OFFSET;

              // 도킹 바 영역 내에 직접 드롭한 경우
              const isInDockBarArea = clientY >= rect.top && clientY <= rect.bottom;

              // 위로 충분히 드래그한 경우 (위로 드래그하면 양수)
              const isDraggedUpEnough = deltaY > DOCKING_VERTICAL_THRESHOLD;

              console.log('도킹 체크:', {
                clientY,
                dragStartY,
                deltaY,
                dockBarTop: rect.top,
                dockBarBottom: rect.bottom,
                isNearDockBar,
                isInDockBarArea,
                isDraggedUpEnough,
                threshold: DOCKING_VERTICAL_THRESHOLD,
              });

              // 언도킹 조건:
              // 1. 도킹 바 영역 내에 직접 드롭한 경우 (가장 직관적) - 위로 드래그 조건 없음
              // 2. 도킹 바 근처에 드롭하고 위로 충분히 드래그한 경우
              if (isInDockBarArea || (isNearDockBar && isDraggedUpEnough)) {
                // 이때만 언도킹 (카드를 도킹된 카드 탭으로 이동)
                console.log('도킹 실행:', item.i);
                dockCard(item.i as DashboardCardId);
              } else {
                console.log('도킹 조건 불만족');
              }
            } finally {
              // 드래그가 끝나면 항상 상태 초기화
              setDragStartY(null);
              setDraggingItemId(null);
              setIsDockTargetActive(false);
            }
          }}
        >
          {activeCards.map((cardId) => {
            const gridItem = layout.find(l => l.i === cardId);
            if (!gridItem) return null;
            return (
              <div key={cardId} data-grid={gridItem}>
                {renderCard(cardId)}
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </>
    );
  };

  return (
    <>
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>
          대시보드 ({getPeriodDescription()}, {getGroupByDescription()})
        </h1>

        {/* 필터 바 */}
        <div style={styles.filterBar}>
          {/* 기간 선택 */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>기간:</label>
            <div style={styles.periodOptions}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="period"
                  value="recent7"
                  checked={periodMode === 'recent7'}
                  onChange={(e) => setPeriodMode(e.target.value as any)}
                />
                최근 7일
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="period"
                  value="thisMonth"
                  checked={periodMode === 'thisMonth'}
                  onChange={(e) => setPeriodMode(e.target.value as any)}
                />
                이번 달
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="period"
                  value="lastMonth"
                  checked={periodMode === 'lastMonth'}
                  onChange={(e) => setPeriodMode(e.target.value as any)}
                />
                지난 달
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="period"
                  value="custom"
                  checked={periodMode === 'custom'}
                  onChange={(e) => setPeriodMode(e.target.value as any)}
                />
                직접 선택
              </label>
            </div>
            {/* 직접 선택 모드일 때만 날짜 입력 필드 표시 */}
            {periodMode === 'custom' && (
              <div style={styles.dateInputs}>
                <input
                  type="date"
                  value={from || ''}
                  onChange={(e) => setFrom(e.target.value || null)}
                  style={styles.dateInput}
                />
                <span style={styles.dateSeparator}>~</span>
                <input
                  type="date"
                  value={to || ''}
                  onChange={(e) => setTo(e.target.value || null)}
                  style={styles.dateInput}
                />
                <button
                  onClick={handleSearch}
                  style={styles.searchButton}
                  disabled={isLoading}
                >
                  조회
                </button>
              </div>
            )}
          </div>

          {/* 집계 단위 선택 */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>집계 단위:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'DAY' | 'WEEK' | 'MONTH')}
              style={styles.select}
              disabled={isLoading}
            >
              <option value="DAY">일별(DAY)</option>
              <option value="WEEK">주별(WEEK)</option>
              <option value="MONTH">월별(MONTH)</option>
            </select>
          </div>
        </div>

        {/* 에러 메시지 표시 */}
        {error && (
          <div style={styles.errorContainer}>
            <div style={styles.error}>{error}</div>
            <button
              onClick={handleSearch}
              style={styles.retryButton}
              disabled={isLoading}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 로딩 중일 때 스켈레톤 표시 */}
        {isLoading && overview && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loading}>데이터를 불러오는 중...</div>
          </div>
        )}

        {/* 도킹된 카드 탭 영역 */}
        {/* 도킹된 카드가 있거나 드래그 중일 때 표시 */}
        {(dockedCards.length > 0 || isDockTargetActive) && (
          <div
            ref={dockBarRef}
            style={{
              ...styles.dockedBar,
              ...(isDockTargetActive ? styles.dockedBarActive : {}),
            }}
          >
            <span style={styles.dockedLabel}>
              {dockedCards.length > 0 ? '도킹된 카드' : '카드를 여기로 드래그하세요'}
              {isDockTargetActive && (
                <span style={styles.dockedHint}> ← 여기에 드롭하면 탭으로 이동합니다</span>
              )}
            </span>
            {dockedCards.length > 0 && (
              <div style={styles.dockedTabs}>
                {dockedCards.map((id) => (
                  <button
                    key={id}
                    style={styles.dockedTab}
                    onClick={() => undockCard(id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(129, 140, 248, 0.3)';
                      e.currentTarget.style.border = '1px solid rgba(129, 140, 248, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.2)';
                      e.currentTarget.style.border = '1px solid rgba(129, 140, 248, 0.6)';
                    }}
                  >
                    {getCardTitle(id)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 메인 콘텐츠 (카드 그리드) */}
        {renderContent()}
      </div>

      {/* 확대 카드 오버레이 */}
      {expandedCardId && (
        <div className="dashboard-expand-overlay">
          <div className="dashboard-expand-card">
            <DashboardCard
              title={getCardTitle(expandedCardId)}
              subtitle={getCardSubtitle(expandedCardId)}
              category={getCardCategory(expandedCardId)}
              footerText={`기준일자: ${getCurrentDateString()}`}
              onChatClick={() => handleChatClick(getCardTitle(expandedCardId))}
              onDock={() => dockCard(expandedCardId)}
              onToggleExpand={() => setExpandedCardId(null)}
              style={{ height: '100%', minHeight: '600px' }}
            >
              {renderExpandedCardContentRef.current ? renderExpandedCardContentRef.current(expandedCardId) : null}
            </DashboardCard>
          </div>
        </div>
      )}

      {/* AI 프롬프트 모달 */}
      <AiPromptModal
        open={aiModalOpen}
        title={aiModalTitle}
        onClose={() => setAiModalOpen(false)}
      />
    </>
  );
};

// 다크 테마 스타일
// AppLayout의 app-main에서 이미 padding이 적용되므로, 여기서는 추가 padding을 최소화합니다.
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    // maxWidth와 margin: 0 auto 제거 (AppLayout의 app-main이 전체 폭을 사용하도록)
    // padding은 AppLayout의 app-main에서 처리되므로 제거
  },
  pageTitle: {
    marginBottom: '2rem',
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
    fontSize: '2rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
    color: '#94a3b8', // 다크 테마: 회색 텍스트
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '1rem',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  errorContainer: {
    textAlign: 'center',
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.5rem 1.5rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', // 보라색-파란색 그라데이션
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
  },
  // 필터 바 스타일 (다크 테마)
  filterBar: {
    backgroundColor: '#1e293b', // 다크 테마: 어두운 슬레이트 블루
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    marginBottom: '2rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    alignItems: 'flex-start',
    border: '1px solid rgba(139, 92, 246, 0.2)',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  filterLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
  },
  periodOptions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
    color: '#cbd5e1', // 다크 테마: 밝은 회색 텍스트
  },
  dateInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  dateInput: {
    padding: '0.5rem',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: '6px',
    fontSize: '0.9rem',
    backgroundColor: '#0f172a', // 다크 테마: 어두운 배경
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
  },
  dateSeparator: {
    color: '#94a3b8',
  },
  searchButton: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', // 보라색-파란색 그라데이션
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
  },
  select: {
    padding: '0.5rem',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: '6px',
    fontSize: '0.9rem',
    minWidth: '150px',
    backgroundColor: '#0f172a', // 다크 테마: 어두운 배경
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
  },
  loadingOverlay: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // 다크 테마: 반투명 어두운 배경
    padding: '2rem',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '1rem',
    border: '1px solid rgba(139, 92, 246, 0.2)',
  },
  // 카드 그리드 스타일은 react-grid-layout이 자동으로 관리합니다.
  // cardGrid 스타일 제거됨
  // 차트 래퍼 스타일은 chart-container 클래스로 대체됨 (react-grid-layout과 Chart.js 높이를 맞추기 위한 처리)
  // 주요 손익 테이블 스타일 (다크 테마)
  profitTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  tableHeader: {
    padding: '8px',
    textAlign: 'left',
    borderBottom: '2px solid rgba(148, 163, 184, 0.2)',
    fontWeight: '600',
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
    fontSize: '0.85rem',
  },
  tableCell: {
    padding: '8px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    color: '#cbd5e1', // 다크 테마: 밝은 회색 텍스트
  },
  // 인원 현황 요약 스타일 (다크 테마)
  personnelSummary: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
  },
  personnelItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  personnelLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8', // 다크 테마: 회색 텍스트
  },
  personnelValue: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
  },
  // 도킹된 카드 탭 영역 스타일
  dockedBar: {
    margin: '12px 0 16px',
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(15, 23, 42, 0.7)', // 다크 테마: 어두운 배경
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px dashed rgba(148, 163, 184, 0.5)', // 점선 테두리
    transition: 'background 0.15s ease, border 0.15s ease, box-shadow 0.15s ease', // border-color 대신 border 사용
  },
  dockedBarActive: {
    background: 'rgba(30, 64, 175, 0.4)', // 활성화 시: 살짝 파란 빛
    border: '1px solid rgba(129, 140, 248, 0.9)', // 활성화 시: 밝은 보라색 테두리 (borderColor 대신 border 사용)
    boxShadow: '0 0 0 1px rgba(129, 140, 248, 0.6)', // 활성화 시: 그림자 효과
  },
  dockedLabel: {
    color: '#e5e7eb',
    fontSize: '0.875rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    opacity: 0.8,
  },
  dockedHint: {
    color: '#a5b4fc', // 활성화 시 힌트 텍스트 색상
    fontSize: '0.75rem',
    fontWeight: '400',
    marginLeft: '8px',
    fontStyle: 'italic',
  },
  dockedTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  dockedTab: {
    borderRadius: '9999px',
    padding: '4px 10px',
    background: 'rgba(79, 70, 229, 0.2)', // 다크 테마: 보라색 배경
    color: '#e5e7eb',
    fontSize: '12px',
    border: '1px solid rgba(129, 140, 248, 0.6)',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border 0.2s', // border-color 대신 border 사용
    fontWeight: '500',
  },
};

export default UserDashboardPage;

