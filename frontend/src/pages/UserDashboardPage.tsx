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
 * react-grid-layout의 각 카드 높이를 결정하는 그리드 유닛입니다.
 * 각 카드의 실제 높이는 ROW_HEIGHT * rowHeight(px)로 계산됩니다.
 */
const ROW_HEIGHT = 6;

/**
 * 그리드 마진 상수
 * react-grid-layout의 margin prop과 동일해야 합니다.
 */
const GRID_MARGIN = 12;

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
 * 
 * @param cols - 그리드 열 수 (기본 12, 모바일에서는 1 또는 2)
 */
function computeLayout(activeCards: DashboardCardId[], cols: number = 12): Layout[] {
  const n = activeCards.length;

  // 카드 개수와 그리드 열 수에 따라 컬럼 수 결정
  let colCount: number;
  if (cols <= 2) {
    // 모바일 (xxs, xs): 1열 (세로 스택 허용)
    colCount = 1;
  } else {
    // 데스크톱/태블릿 (lg, md, sm): 2행 3열 유지
    // sm 브레이크포인트(768px) 이상에서는 항상 3열로 처리
    colCount =
      n <= 1 ? 1 :
      n === 2 ? 2 :
      n === 3 ? 3 :
      n === 4 ? 2 :
      3; // 5~6개는 3열
  }

  // 각 카드의 너비 (그리드 열 수 기준)
  const w = Math.floor(cols / colCount);
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
  
  // 동적 rowHeight 상태 (뷰포트 높이 기반으로 계산)
  const [responsiveRowHeight, setResponsiveRowHeight] = useState(35);
  
  // 모바일 여부 상태 (768px 이하)
  const [isMobile, setIsMobile] = useState(false);

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

  // AI 분석 모드 상태 관리
  const [aiAnalysisCardId, setAiAnalysisCardId] = useState<DashboardCardId | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiDisplayedText, setAiDisplayedText] = useState(''); // 타이핑 효과용 표시 텍스트
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiFullscreen, setIsAiFullscreen] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // 타이핑 중인지 여부
  
  // AI 분석 패널 전체화면 참조
  const aiPanelRef = useRef<HTMLDivElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null); // 타이핑 인터벌 참조
  
  // 그리드 내부 확대 상태 관리
  const [expandedGridCardId, setExpandedGridCardId] = useState<DashboardCardId | null>(null);
  const [savedLayout, setSavedLayout] = useState<Layout[] | null>(null); // 확대 전 레이아웃 저장
  
  // 확대된 카드 콘텐츠 렌더링 함수를 저장할 ref (AI 분석 모드에서 사용)
  const renderExpandedCardContentRef = useRef<((cardId: DashboardCardId) => React.ReactNode) | null>(null);

  // 드래그 상태 관리
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  // 드래그 중 도킹 바 하이라이트 여부
  const [isDockTargetActive, setIsDockTargetActive] = useState(false);
  // 전역 마우스 위치 추적용 ref
  const currentMouseYRef = useRef<number | null>(null);
  // 드래그 시작 시 원래 위치 저장용 ref
  const dragStartPositionRef = useRef<{ x: number; y: number } | null>(null);

  // 도킹 바 DOM을 참조하기 위한 ref
  const dockBarRef = useRef<HTMLDivElement | null>(null);

  // ESC 키로 AI 분석 모드 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && aiAnalysisCardId) {
        setAiAnalysisCardId(null);
        setAiQuestion('');
        setAiAnswer(null);
      }
    };

    if (aiAnalysisCardId) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [aiAnalysisCardId]);

  // 그리드 컨테이너 ref (실제 높이 측정용)
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridLayoutRef = useRef<HTMLDivElement>(null);
  
  /**
   * 실제 DOM 요소를 측정하여 rowHeight 계산 (ResizeObserver 사용)
   * 
   * 데스크톱 (768px 이상): 그리드 컨테이너의 실제 높이를 측정하여 계산
   * 모바일 (768px 미만): 기본 rowHeight 사용, 스크롤 허용
   */
  useEffect(() => {
    const viewportWidth = window.innerWidth;
    const mobile = viewportWidth <= 768;
    setIsMobile(mobile);
    
    // 모바일에서는 더 큰 rowHeight 사용
    if (mobile) {
      setResponsiveRowHeight(50);
      return;
    }
    
    // 상수 정의
    const gridMarginBetweenRows = GRID_MARGIN;
    const totalGridUnits = 2 * ROW_HEIGHT; // 12
    
    // 조정 타이머 ref (debounce용)
    let adjustmentTimer: NodeJS.Timeout | null = null;
    
    // 데스크톱: ResizeObserver로 그리드 컨테이너 높이 변화 감지
    const calculateRowHeight = (containerHeight: number, isInitial: boolean = false) => {
      if (containerHeight <= 0) return;
      
      // react-grid-layout의 실제 높이 계산
      // 그리드 총 높이 = (2행 * 6유닛 * rowHeight) + (1개 행간마진 * 12px)
      // 초기 계산을 정확하게 하기 위해 safetyMargin을 최소화
      const safetyMargin = isInitial ? 15 : 20; // 초기 계산은 더 정확하게
      
      // 사용 가능한 높이에서 안전 마진과 행간 마진을 뺀 값
      const usableHeight = containerHeight - safetyMargin - gridMarginBetweenRows;
      const calculatedRowHeight = Math.floor(usableHeight / totalGridUnits);
      
      // 최소 20, 최대 60으로 제한 (확대 시에도 꽉 차도록)
      const finalRowHeight = Math.max(20, Math.min(60, calculatedRowHeight));
      
      // 실제 그리드 높이 계산
      const actualGridHeight = (totalGridUnits * finalRowHeight) + gridMarginBetweenRows;
      
      console.log('Dashboard rowHeight 계산 (실제 측정):', {
        containerHeight,
        usableHeight,
        calculatedRowHeight,
        finalRowHeight,
        actualGridHeight,
        safetyMargin,
        isInitial,
        fits: actualGridHeight <= containerHeight,
        remainingSpace: containerHeight - actualGridHeight
      });
      
      setResponsiveRowHeight(finalRowHeight);
    };
    
    // ResizeObserver 설정
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerHeight = entry.contentRect.height;
        // 초기 계산 (정확하게)
        calculateRowHeight(containerHeight, false);
        
        // 이전 타이머 취소 (debounce)
        if (adjustmentTimer) {
          clearTimeout(adjustmentTimer);
        }
        
        // 실제 그리드 아이템들의 위치를 측정하여 미세 조정 (debounce)
        adjustmentTimer = setTimeout(() => {
          const gridItems = document.querySelectorAll('.react-grid-item');
          if (gridItems.length > 0) {
            let maxBottom = 0;
            gridItems.forEach((item) => {
              const rect = (item as HTMLElement).getBoundingClientRect();
              const bottom = rect.bottom;
              if (bottom > maxBottom) {
                maxBottom = bottom;
              }
            });
            
            // 그리드 컨테이너의 상단 위치
            const gridContainer = gridContainerRef.current;
            if (gridContainer) {
              const containerRect = gridContainer.getBoundingClientRect();
              const containerTop = containerRect.top;
              const actualGridHeight = maxBottom - containerTop;
              
              // 컨테이너 높이와 비교 (약간의 여유 허용: 5px)
              const tolerance = 5;
              const needsAdjustment = actualGridHeight > (containerHeight + tolerance);
              
              console.log('실제 그리드 높이 (아이템 측정):', {
                containerHeight,
                actualGridHeight,
                maxBottom,
                containerTop,
                difference: containerHeight - actualGridHeight,
                needsAdjustment,
                tolerance
              });
              
              // 실제 그리드가 컨테이너보다 크면 rowHeight 조정 (미세 조정만)
              if (needsAdjustment) {
                // 함수형 업데이트로 최신 값 사용
                setResponsiveRowHeight((currentRowHeight) => {
                  const excess = actualGridHeight - containerHeight;
                  // 초과분을 12로 나눠서 rowHeight 조정
                  const adjustment = Math.ceil(excess / totalGridUnits);
                  const newRowHeight = Math.max(20, currentRowHeight - adjustment);
                  if (newRowHeight !== currentRowHeight && Math.abs(newRowHeight - currentRowHeight) >= 1) {
                    console.log('rowHeight 미세 조정:', { 
                      currentRowHeight, 
                      newRowHeight, 
                      excess, 
                      adjustment,
                      expectedNewHeight: (totalGridUnits * newRowHeight) + gridMarginBetweenRows
                    });
                    return newRowHeight;
                  }
                  return currentRowHeight;
                });
              }
            }
          }
        }, 200); // 300ms → 200ms로 단축
      }
    });
    
    // 그리드 컨테이너 관찰 시작
    if (gridContainerRef.current) {
      resizeObserver.observe(gridContainerRef.current);
      // 초기 높이 계산 (약간의 지연으로 DOM 렌더링 완료 대기)
      setTimeout(() => {
        if (gridContainerRef.current) {
          calculateRowHeight(gridContainerRef.current.clientHeight, true); // 초기 계산은 더 정확하게
        }
      }, 150);
    }
    
    return () => {
      if (adjustmentTimer) {
        clearTimeout(adjustmentTimer);
      }
      resizeObserver.disconnect();
    };
  }, [overview]); // overview가 로드되면 재계산

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
      return 'Last 7 Days';
    } else if (periodMode === 'thisMonth') {
      return 'This Month';
    } else if (periodMode === 'lastMonth') {
      return 'Last Month';
    } else if (from && to) {
      return `${from} ~ ${to}`;
    }
    return 'Last 7 Days';
  };

  const getGroupByDescription = (): string => {
    const groupByMap = {
      DAY: 'Daily',
      WEEK: 'Weekly',
      MONTH: 'Monthly',
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
   * AI 분석 모드 열기 핸들러
   * 각 카드의 AI 버튼에서 호출됩니다.
   */
  const handleAskAi = (cardId: DashboardCardId) => {
    setAiAnalysisCardId(cardId);
    setAiQuestion('');
    setAiAnswer(null);
  };

  /**
   * AI 질문 제출 핸들러 (Mock 응답)
   * TODO: 실제 백엔드 API 연동 시 이 부분을 수정
   */
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || !aiAnalysisCardId) return;

    setAiLoading(true);
    setAiAnswer(null);
    setAiDisplayedText(''); // 타이핑 텍스트 초기화
    setIsTyping(false);

    // 기존 타이핑 인터벌 정리
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    // Mock 응답 생성 (실제 API 연동 시 교체)
    await new Promise(resolve => setTimeout(resolve, 2000)); // 분석 시간 시뮬레이션

    const mockAnswer = generateMockAiAnswer(aiAnalysisCardId, aiQuestion);
    
    setAiAnswer(mockAnswer);
    setAiLoading(false);
    
    // 타이핑 효과 시작
    startTypingEffect(mockAnswer);
  };

  /**
   * 타이핑 효과 시작
   * 텍스트를 한 글자씩 표시하여 GPT 스타일의 응답 효과를 만듭니다.
   */
  const startTypingEffect = (fullText: string) => {
    setIsTyping(true);
    setAiDisplayedText('');
    
    let currentIndex = 0;
    const typingSpeed = 20; // 밀리초 단위 (작을수록 빠름)

    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < fullText.length) {
        setAiDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        // 타이핑 완료
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTyping(false);
      }
    }, typingSpeed);
  };

  // 컴포넌트 언마운트 시 타이핑 인터벌 정리
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

  /**
   * Mock AI 응답 생성 함수
   * 카드 유형과 질문에 따라 상세한 분석 응답을 생성합니다.
   */
  const generateMockAiAnswer = (cardId: DashboardCardId, question: string): string => {
    const cardTitle = getCardTitle(cardId);
    const questionLower = question.toLowerCase();

    // 카드별 기본 분석 템플릿
    const analysisTemplates: Record<DashboardCardId, string> = {
      profit: `📊 **주요 손익 분석 결과**

**질문**: "${question}"

**종합 분석**:
현재 주요 손익 지표를 분석한 결과, 다음과 같은 인사이트를 도출했습니다:

1. **매출 동향**
   - 최근 기간 동안 매출은 전반적으로 안정적인 추세를 보이고 있습니다.
   - 전년 대비 성장률이 양의 값을 유지하고 있어 긍정적인 신호입니다.
   - 다만, 일부 항목에서 변동성이 관찰되므로 지속적인 모니터링이 필요합니다.

2. **비용 구조**
   - 운영비용이 예상 범위 내에서 관리되고 있습니다.
   - 원가율이 목표 수준을 유지하고 있어 수익성 개선에 기여하고 있습니다.
   - 인건비와 제조원가의 비중을 재검토하면 추가적인 효율화 여지가 있을 수 있습니다.

3. **수익성 평가**
   - 순이익률이 목표 대비 양호한 수준을 유지하고 있습니다.
   - EBITDA 마진이 안정적으로 유지되고 있어 재무 건전성이 양호합니다.
   - 향후 시장 변동성에 대비한 리스크 관리 전략 수립을 권장합니다.

**권장 사항**:
- 분기별 손익 구조 심화 분석을 통한 비용 최적화 기회 발굴
- 시장 환경 변화에 따른 유연한 가격 전략 수립
- 장기적인 수익성 개선을 위한 투자 포트폴리오 재검토`,

      quality: `🔍 **품질 현황 분석 결과**

**질문**: "${question}"

**종합 분석**:
품질 지표를 다각도로 분석한 결과, 다음과 같은 평가를 내릴 수 있습니다:

1. **품질 지표 현황**
   - 전반적인 품질 점수가 목표 수준을 상회하고 있어 우수한 품질 관리가 이루어지고 있습니다.
   - 각 품질 항목별로 균형 잡힌 성과를 보이고 있어 체계적인 품질 관리 시스템이 작동하고 있음을 시사합니다.
   - 일부 영역에서 개선 여지가 있으나, 전체적인 품질 수준은 안정적입니다.

2. **품질 관리 프로세스**
   - 품질 검사 프로세스가 효과적으로 운영되고 있어 불량률이 낮은 수준을 유지하고 있습니다.
   - 공정별 품질 모니터링이 실시간으로 이루어지고 있어 신속한 대응이 가능한 구조입니다.
   - 품질 개선 활동이 지속적으로 진행되고 있어 향상 추세가 예상됩니다.

3. **리스크 요소**
   - 특정 공정에서 주기적인 변동성이 관찰되므로 해당 영역에 대한 집중 관리가 필요합니다.
   - 공급망 품질 관리 강화를 통해 외부 요인에 의한 품질 저하를 예방할 수 있습니다.
   - 신제품 도입 시 품질 안정화 기간을 고려한 일정 관리가 중요합니다.

**권장 사항**:
- 품질 데이터의 심층 분석을 통한 근본 원인 분석(Root Cause Analysis) 수행
- 품질 개선 프로젝트 우선순위 설정 및 실행 계획 수립
- 고객 만족도와 연계한 품질 지표 개선 목표 재설정`,

      stock: `📦 **재고 현황 분석 결과**

**질문**: "${question}"

**종합 분석**:
재고 관리 현황을 분석한 결과, 다음과 같은 평가를 도출했습니다:

1. **재고 수준 평가**
   - 현재 재고 수준이 적정 범위 내에서 관리되고 있어 재고 회전율이 양호합니다.
   - 품목별 재고 분포가 균형 잡혀 있어 특정 품목의 과다 재고 리스크가 낮습니다.
   - 안전 재고 수준이 적절하게 설정되어 있어 공급 안정성이 확보되고 있습니다.

2. **재고 회전 분석**
   - 재고 회전율이 업계 평균 대비 우수한 수준을 유지하고 있어 자금 효율성이 높습니다.
   - 고속 회전 품목과 저속 회전 품목의 구분이 명확하여 차별화된 관리 전략이 필요합니다.
   - 계절성 품목의 재고 조정이 시기적절하게 이루어지고 있어 재고 부담이 최소화되고 있습니다.

3. **재고 최적화 기회**
   - 일부 품목에서 재고 감소 여지가 있어 추가적인 효율화가 가능합니다.
   - 공급망 최적화를 통해 재고 보유 기간 단축 및 비용 절감이 기대됩니다.
   - 재고 예측 모델 개선을 통해 더욱 정확한 재고 계획 수립이 가능할 것으로 보입니다.

**권장 사항**:
- ABC 분석을 통한 재고 관리 전략 차별화
- 공급망 가시성 향상을 통한 재고 최적화
- 재고 회전율 개선을 위한 프로세스 혁신 검토`,

      trend: `📈 **매출 Trend 분석 결과**

**질문**: "${question}"

**종합 분석**:
매출 추이를 시계열 분석한 결과, 다음과 같은 인사이트를 도출했습니다:

1. **매출 추세 분석**
   - 최근 기간 동안 매출이 전반적으로 상승 추세를 보이고 있어 성장 동력이 유지되고 있습니다.
   - 계절성 패턴이 명확하게 관찰되어 계절별 마케팅 전략 수립에 활용할 수 있습니다.
   - 단기 변동성은 있으나 장기 추세는 안정적이어서 지속 가능한 성장이 예상됩니다.

2. **성장 동력 평가**
   - 신제품 및 신규 고객 확보가 매출 성장에 기여하고 있어 시장 확장 전략이 효과적입니다.
   - 기존 고객의 재구매율이 높아 고객 충성도가 양호한 것으로 평가됩니다.
   - 시장 점유율 확대를 위한 추가적인 마케팅 투자 여지가 있습니다.

3. **리스크 및 기회 요소**
   - 시장 경쟁 심화에 따른 가격 압력이 예상되므로 차별화 전략이 중요합니다.
   - 신흥 시장 진출 기회가 있어 시장 다각화를 통한 성장 기회 확보가 가능합니다.
   - 기술 혁신을 통한 제품 경쟁력 강화가 지속적인 성장의 핵심 요소입니다.

**권장 사항**:
- 시장 세그먼트별 매출 분석을 통한 타겟 고객 재정의
- 계절성 패턴을 활용한 재고 및 마케팅 계획 최적화
- 장기적인 성장 전략 수립을 위한 시나리오 분석 수행`,

      people: `👥 **인원 현황 분석 결과**

**질문**: "${question}"

**종합 분석**:
인력 현황을 조직 및 업무 관점에서 분석한 결과, 다음과 같은 평가를 내릴 수 있습니다:

1. **인력 구성 분석**
   - 조직의 인력 구성이 업무 요구사항에 적합하게 배치되어 있어 운영 효율성이 양호합니다.
   - 부서별 인력 분포가 균형 잡혀 있어 업무 부담이 적절하게 분산되고 있습니다.
   - 경력 및 전문성 수준이 업계 평균 대비 우수하여 조직 역량이 높은 것으로 평가됩니다.

2. **인력 활용도 평가**
   - 인력 활용도가 목표 수준을 상회하고 있어 생산성이 높게 유지되고 있습니다.
   - 프로젝트별 인력 배치가 효율적으로 이루어지고 있어 리소스 최적화가 잘 되고 있습니다.
   - 업무 부하 분산이 적절하여 조직 건강도가 양호한 상태입니다.

3. **인력 관리 개선 기회**
   - 핵심 인력의 역량 강화를 위한 교육 프로그램 확대가 필요합니다.
   - 신규 인력의 온보딩 프로세스 개선을 통해 생산성 향상이 기대됩니다.
   - 인력 유지 및 이직률 관리 전략 수립을 통한 조직 안정성 강화가 중요합니다.

**권장 사항**:
- 인력 수요 예측 모델 구축을 통한 전략적 인력 계획 수립
- 핵심 인재 육성 프로그램 개발 및 실행
- 조직 문화 개선을 통한 직원 만족도 및 생산성 향상`,

      downtime: `⚙️ **비가동 실적 분석 결과**

**질문**: "${question}"

**종합 분석**:
비가동 현황을 설비 및 공정 관점에서 분석한 결과, 다음과 같은 인사이트를 도출했습니다:

1. **비가동 현황 평가**
   - 전체 비가동 시간이 목표 수준 이하로 관리되고 있어 설비 가동률이 우수합니다.
   - 계획된 정비와 비계획 정지의 비율이 적절하여 예방 정비 전략이 효과적으로 작동하고 있습니다.
   - 설비별 비가동 패턴이 안정적이어서 신뢰성이 높은 것으로 평가됩니다.

2. **비가동 원인 분석**
   - 정기 정비로 인한 비가동이 대부분을 차지하고 있어 계획적 관리가 잘 되고 있습니다.
   - 긴급 수리로 인한 비계획 정지가 최소화되어 있어 설비 신뢰성이 높습니다.
   - 일부 설비에서 주기적인 문제가 관찰되므로 집중 관리가 필요한 영역입니다.

3. **개선 기회**
   - 예측 정비(Predictive Maintenance) 도입을 통해 비계획 정지를 추가로 감소시킬 수 있습니다.
   - 정비 프로세스 최적화를 통한 정비 시간 단축이 가능할 것으로 보입니다.
   - 설비 모니터링 시스템 고도화를 통해 실시간 이상 징후 감지 능력 향상이 기대됩니다.

**권장 사항**:
- 설비별 비가동 원인 심화 분석을 통한 근본 원인 제거
- 예방 정비 일정 최적화를 통한 가동률 향상
- 설비 효율 개선 프로젝트 우선순위 설정 및 실행 계획 수립`,
    };

    // 기본 분석 템플릿 가져오기
    let answer = analysisTemplates[cardId] || `**${cardTitle} 분석 결과**\n\n질문: "${question}"\n\n해당 데이터를 분석한 결과, 전반적으로 안정적인 추세를 보이고 있습니다.`;

    // 질문 키워드에 따른 추가 분석 추가
    if (questionLower.includes('감소') || questionLower.includes('하락') || questionLower.includes('떨어')) {
      answer += `\n\n**추가 분석**: 질문하신 감소 현상에 대해 심층 분석한 결과, 이는 일시적인 변동성으로 보이며 장기 추세에는 큰 영향을 미치지 않을 것으로 판단됩니다. 다만, 지속적인 모니터링을 통해 추세 변화를 주시하는 것이 중요합니다.`;
    } else if (questionLower.includes('증가') || questionLower.includes('상승') || questionLower.includes('올라')) {
      answer += `\n\n**추가 분석**: 질문하신 증가 현상은 긍정적인 신호로 해석됩니다. 이러한 추세가 지속될 경우, 관련 전략을 더욱 강화하여 성과를 극대화할 수 있을 것으로 기대됩니다.`;
    } else if (questionLower.includes('원인') || questionLower.includes('이유') || questionLower.includes('왜')) {
      answer += `\n\n**원인 분석**: 데이터를 종합적으로 검토한 결과, 여러 요인이 복합적으로 작용하고 있는 것으로 보입니다. 주요 요인으로는 시장 환경 변화, 내부 프로세스 개선, 외부 요인 등이 있으며, 각 요인의 기여도를 정량적으로 분석하기 위해서는 추가 데이터가 필요합니다.`;
    } else if (questionLower.includes('개선') || questionLower.includes('향상') || questionLower.includes('높')) {
      answer += `\n\n**개선 방안**: 현재 데이터를 기반으로 한 개선 방안으로는 프로세스 최적화, 리소스 재배치, 기술 도입 등이 있습니다. 구체적인 개선 목표를 설정하고 단계적으로 실행 계획을 수립하는 것이 효과적일 것입니다.`;
    }

    return answer;
  };

  /**
   * AI 분석 패널 전체화면 토글
   */
  const handleToggleAiFullscreen = async () => {
    if (!aiPanelRef.current) return;

    try {
      if (!isAiFullscreen) {
        // 전체화면 진입
        if (aiPanelRef.current.requestFullscreen) {
          await aiPanelRef.current.requestFullscreen();
        } else if ((aiPanelRef.current as any).webkitRequestFullscreen) {
          await (aiPanelRef.current as any).webkitRequestFullscreen();
        } else if ((aiPanelRef.current as any).msRequestFullscreen) {
          await (aiPanelRef.current as any).msRequestFullscreen();
        }
      } else {
        // 전체화면 종료
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('전체화면 전환 실패:', error);
    }
  };

  // 전체화면 상태 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsAiFullscreen(isFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  /**
   * 그리드 내부 확대/축소 핸들러
   * 
   * 확대: 선택된 카드를 전체 폭으로 변경하고 나머지 카드는 아래로 이동
   * 축소: 저장된 레이아웃으로 복원
   */
  const handleToggleExpand = (cardId: DashboardCardId) => {
    setLayout((currentLayout) => {
      if (!expandedGridCardId || expandedGridCardId !== cardId) {
        // 확대 시작
        // 1) 현재 레이아웃 저장
        setSavedLayout([...currentLayout]);
        setExpandedGridCardId(cardId);

        const cols = 12; // 그리드 열 수
        const expandedHeight = Math.max(...currentLayout.map((l) => l.h), 6); // 최소 높이 6

        // 2) 선택된 카드를 전체 폭으로 변경
        const newLayout = currentLayout.map((item) => {
          if (item.i === cardId) {
            return {
              ...item,
              x: 0,
              y: 0,
              w: cols,
              h: expandedHeight * 2, // 확대 시 높이 2배
            };
          }
          // 나머지 카드는 아래로 이동
          return {
            ...item,
            y: item.y + expandedHeight * 2,
          };
        });

        return newLayout;
      } else {
        // 축소: 저장된 레이아웃 복원
        if (savedLayout) {
          setExpandedGridCardId(null);
          const original = [...savedLayout];
          setSavedLayout(null);
          return original;
        }
        return currentLayout;
      }
    });
  };

  // 현재 브레이크포인트에 맞는 cols 계산
  const getCurrentCols = (): number => {
    const width = window.innerWidth;
    if (width >= 1200) return 12; // lg
    if (width >= 996) return 12; // md
    if (width >= 768) return 6; // sm
    if (width >= 480) return 2; // xs
    return 2; // xxs
  };

  // 현재 브레이크포인트 상태
  const [currentCols, setCurrentCols] = useState(getCurrentCols());

  /**
   * 활성 카드 목록과 브레이크포인트를 기반으로 레이아웃 계산
   * 
   * activeCards나 브레이크포인트가 변경될 때마다 자동으로 레이아웃을 재계산합니다.
   * 확대 상태가 아닐 때만 자동 계산된 레이아웃을 사용합니다.
   * 
   * 모바일 진입 전(sm 이상)에서는 항상 2행 3열을 유지하기 위해 12열로 처리합니다.
   */
  const baseLayout = useMemo(
    () => {
      // sm 이상(768px 이상)에서는 2행 3열 유지를 위해 12열로 처리
      const layoutCols = currentCols >= 6 ? 12 : currentCols;
      return computeLayout(activeCards, layoutCols);
    },
    [activeCards, currentCols]
  );

  // 확대 상태가 아니면 baseLayout 사용, 확대 상태면 layout state 사용
  const [layout, setLayout] = useState<Layout[]>(baseLayout);

  // 창 크기 변경 감지하여 브레이크포인트 업데이트 (onBreakpointChange와 함께 사용)
  useEffect(() => {
    const handleResize = () => {
      const newCols = getCurrentCols();
      if (newCols !== currentCols) {
        setCurrentCols(newCols);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentCols]);

  // baseLayout이 변경되면 layout도 업데이트 (단, 확대 상태가 아닐 때만)
  useEffect(() => {
    if (!expandedGridCardId) {
      // baseLayout이 변경되었을 때만 업데이트 (브레이크포인트 변경 시에는 위의 handleResize에서 처리)
      setLayout(baseLayout);
    }
  }, [baseLayout, expandedGridCardId]);

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
              onAskAi={() => handleAskAi('profit')}
              onDock={() => dockCard('profit')}
              onToggleExpand={() => handleToggleExpand('profit')}
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
              onAskAi={() => handleAskAi('quality')}
              onDock={() => dockCard('quality')}
              onToggleExpand={() => handleToggleExpand('quality')}
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
              onAskAi={() => handleAskAi('stock')}
              onDock={() => dockCard('stock')}
              onToggleExpand={() => handleToggleExpand('stock')}
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
              onAskAi={() => handleAskAi('trend')}
              onDock={() => dockCard('trend')}
              onToggleExpand={() => handleToggleExpand('trend')}
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
              onAskAi={() => handleAskAi('people')}
              onDock={() => dockCard('people')}
              onToggleExpand={() => handleToggleExpand('people')}
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
              onAskAi={() => handleAskAi('downtime')}
              onDock={() => dockCard('downtime')}
              onToggleExpand={() => handleToggleExpand('downtime')}
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
      <div 
        ref={gridContainerRef}
        className="dashboard-grid-container"
        style={styles.gridContainer}
      >
        {/* 
          react-grid-layout 설정:
          - isResizable=false: 사용자가 카드 크기를 변경하지 못하게 합니다.
          - compactType 제거: 자동 정렬 비활성화 (2행 3열 고정)
          - preventCollision={true}: 겹침 방지
          - onLayoutChange에서 2행 3열 범위 내에서만 이동 허용
          이렇게 해서 "6개의 고정 슬롯 안에서 위치만 바꾸는" 형태의 레이아웃을 구현합니다.
        */}
        <ResponsiveGridLayout
          className="dashboard-grid"
          layouts={{
            lg: layout, // 드래그로 변경된 레이아웃 사용
            md: layout, // 드래그로 변경된 레이아웃 사용
            sm: layout, // sm도 2행 3열 유지 (드래그로 변경된 레이아웃 사용)
            xs: computeLayout(activeCards, 2), // 모바일: 세로 스택 허용
            xxs: computeLayout(activeCards, 2), // 모바일: 세로 스택 허용
          }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 12, xs: 2, xxs: 2 }} // sm도 12열로 처리 (2행 3열 유지)
          rowHeight={isMobile ? 1 : responsiveRowHeight} // 모바일에서는 최소 높이로 설정하여 높이 계산 무시
          margin={[12, 12]}
          useCSSTransforms={true} // CSS transform 사용으로 성능 향상
          onBreakpointChange={(newBreakpoint, newCols) => {
            // 브레이크포인트 변경 시 레이아웃 재설정
            console.log('브레이크포인트 변경:', { newBreakpoint, newCols, currentCols });
            if (!expandedGridCardId) {
              // sm 이상(768px 이상)에서는 2행 3열 유지를 위해 12열로 처리
              const layoutCols = newCols >= 6 ? 12 : newCols;
              const newLayout = computeLayout(activeCards, layoutCols);
              setLayout(newLayout);
            }
          }}
          draggableHandle=".dashboard-card-drag-handle"
          draggableCancel=".dashboard-card-actions, .dashboard-card-body"
          isDraggable={!expandedGridCardId} // 확대 상태에서는 드래그 비활성화
          isResizable={false}
          compactType="vertical" // 위에서 아래로 자동 정렬
          preventCollision={false} // 드래그 중 겹침 허용 (위치 교환을 위해)
          onLayoutChange={(currentLayout) => {
            // 확대 상태가 아닐 때만 레이아웃 업데이트
            if (!expandedGridCardId) {
              // sm 이상(768px 이상)에서는 드래그 중에도 2행 3열로 제한 및 위치 교환
              const isDesktopOrTablet = window.innerWidth >= 768;
              
              if (isDesktopOrTablet) {
                // 2행 3열 범위 내에서만 이동 허용
                const cols = 12;
                const cardWidth = cols / 3; // 4
                const maxY = ROW_HEIGHT; // 6
                
                let validatedLayout = currentLayout.map((item) => {
                  // y는 0 또는 6만 허용 (가장 가까운 행으로 스냅)
                  let validY: number;
                  if (item.y <= ROW_HEIGHT / 2) {
                    validY = 0; // 첫 번째 행
                  } else {
                    validY = maxY; // 두 번째 행 (6보다 크면 무조건 6으로 제한)
                  }
                  
                  // x는 0, 4, 8만 허용 (가장 가까운 열로 스냅)
                  const validX = Math.round(item.x / cardWidth) * cardWidth;
                  const clampedX = Math.max(0, Math.min(cols - cardWidth, validX));
                  
                  return {
                    ...item,
                    x: clampedX,
                    y: validY,
                    w: cardWidth,
                    h: ROW_HEIGHT,
                  };
                });
                
                // 위치 교환: 드래그 중인 카드가 다른 카드의 위치로 이동하면 위치 교환
                if (draggingItemId && dragStartPositionRef.current) {
                  const draggingItem = validatedLayout.find(item => item.i === draggingItemId);
                  if (draggingItem) {
                    const newPos = { x: draggingItem.x, y: draggingItem.y };
                    const originalPos = dragStartPositionRef.current;
                    
                    // 새로운 위치가 원래 위치와 다르면 (실제로 이동했으면)
                    if (newPos.x !== originalPos.x || newPos.y !== originalPos.y) {
                      // 그 위치에 원래 있던 다른 카드 찾기
                      const targetItem = validatedLayout.find(item => 
                        item.i !== draggingItemId && 
                        item.x === newPos.x && 
                        item.y === newPos.y
                      );
                      
                      if (targetItem) {
                        // 두 카드의 위치 교환: 다른 카드를 드래그 중인 카드의 원래 위치로 이동
                        validatedLayout = validatedLayout.map(item => {
                          if (item.i === targetItem.i) {
                            return {
                              ...item,
                              x: originalPos.x,
                              y: originalPos.y,
                            };
                          }
                          return item;
                        });
                        // 위치 교환 완료 후 ref 초기화 (중복 교환 방지)
                        dragStartPositionRef.current = null;
                        console.log('카드 위치 교환:', {
                          dragging: draggingItemId,
                          target: targetItem.i,
                          draggingNewPos: newPos,
                          targetNewPos: originalPos,
                        });
                      }
                    }
                  }
                }
                
                setLayout(validatedLayout);
              } else {
                // 모바일은 그대로 저장
                setLayout(currentLayout);
              }
            }
          }}
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
            // 드래그 시작 시 원래 위치 저장
            dragStartPositionRef.current = { x: item.x, y: item.y };

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
              }
            } finally {
              // 드래그가 끝나면 항상 상태 초기화
              setDragStartY(null);
              setDraggingItemId(null);
              setIsDockTargetActive(false);
              dragStartPositionRef.current = null; // 원래 위치 ref 초기화
              
              // 드래그 종료 후 레이아웃 검증 (모바일 진입 전까지 2행 3열로 제한)
              setTimeout(() => {
                setLayout((currentLayout) => {
                  // sm 이상(768px 이상)에서는 2행 3열로 제한
                  // xs 이하(480px 미만)에서는 세로 스택 허용
                  const isDesktopOrTablet = window.innerWidth >= 768;
                  
                  if (!isDesktopOrTablet) {
                    return currentLayout; // 모바일(xs, xxs)은 그대로 (세로 스택 허용)
                  }
                  
                  // 2행 3열 범위 내에서만 이동 허용
                  const cols = 12;
                  const cardWidth = cols / 3; // 4
                  const maxY = ROW_HEIGHT; // 6 (2행이므로 최대 y는 6)
                  
                  const validatedLayout = currentLayout.map((item) => {
                    // y는 0 또는 6만 허용 (가장 가까운 행으로 스냅)
                    // y가 6보다 크면 무조건 6으로 제한 (3행 방지)
                    let validY: number;
                    if (item.y <= ROW_HEIGHT / 2) {
                      validY = 0; // 첫 번째 행
                    } else if (item.y > maxY) {
                      validY = maxY; // 6보다 크면 무조건 두 번째 행
                    } else {
                      validY = maxY; // 두 번째 행
                    }
                    
                    // x는 0, 4, 8만 허용 (가장 가까운 열로 스냅)
                    const validX = Math.round(item.x / cardWidth) * cardWidth;
                    const clampedX = Math.max(0, Math.min(cols - cardWidth, validX));
                    
                    // w는 4로 고정, h는 6으로 고정
                    return {
                      ...item,
                      x: clampedX,
                      y: validY,
                      w: cardWidth,
                      h: ROW_HEIGHT,
                    };
                  });
                  
                  // 레이아웃이 변경되었는지 확인
                  const hasChanged = validatedLayout.some((item, index) => {
                    const original = currentLayout[index];
                    return item.x !== original.x || item.y !== original.y || item.w !== original.w || item.h !== original.h;
                  });
                  
                  if (hasChanged) {
                    console.log('드래그 종료 후 레이아웃 검증:', { original: currentLayout, validated: validatedLayout });
                    return validatedLayout;
                  }
                  
                  return currentLayout;
                });
              }, 50); // 약간의 지연으로 레이아웃 업데이트 완료 대기
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
      </div>
    );
  };

  return (
    <>
      <div style={styles.container} className="dashboard-page-container">
        <h1 style={styles.pageTitle}>
          Dashboard ({getPeriodDescription()}, {getGroupByDescription()})
        </h1>

        {/* 필터 바 */}
        <div style={styles.filterBar}>
          {/* 기간 선택 */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Period:</label>
            <div style={styles.periodOptions}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="period"
                  value="recent7"
                  checked={periodMode === 'recent7'}
                  onChange={(e) => setPeriodMode(e.target.value as any)}
                />
                Last 7 Days
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="period"
                  value="thisMonth"
                  checked={periodMode === 'thisMonth'}
                  onChange={(e) => setPeriodMode(e.target.value as any)}
                />
                This Month
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="period"
                  value="lastMonth"
                  checked={periodMode === 'lastMonth'}
                  onChange={(e) => setPeriodMode(e.target.value as any)}
                />
                Last Month
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="period"
                  value="custom"
                  checked={periodMode === 'custom'}
                  onChange={(e) => setPeriodMode(e.target.value as any)}
                />
                Custom Range
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
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* 집계 단위 선택 */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Group By:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'DAY' | 'WEEK' | 'MONTH')}
              style={styles.select}
              disabled={isLoading}
            >
              <option value="DAY">Daily (DAY)</option>
              <option value="WEEK">Weekly (WEEK)</option>
              <option value="MONTH">Monthly (MONTH)</option>
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

      {/* AI 분석 모드 오버레이 */}
      {aiAnalysisCardId && (
        <div className="dashboard-ai-overlay">
          <div 
            ref={aiPanelRef}
            className={`dashboard-ai-panel ${isAiFullscreen ? 'dashboard-ai-panel--fullscreen' : ''}`}
          >
            {/* 상단 헤더: 제목, 전체화면 버튼, 닫기 버튼 */}
            <div className="dashboard-ai-header">
              <h2 style={styles.aiHeaderTitle}>
                {getCardTitle(aiAnalysisCardId)} - AI 분석
              </h2>
              <div style={styles.aiHeaderActions}>
                <button
                  onClick={handleToggleAiFullscreen}
                  style={styles.aiFullscreenButton}
                  title={isAiFullscreen ? '전체화면 종료' : '전체화면'}
                  aria-label={isAiFullscreen ? '전체화면 종료' : '전체화면'}
                >
                  {isAiFullscreen ? '⤓' : '⤢'}
                </button>
                <button
                  onClick={() => {
                    setAiAnalysisCardId(null);
                    setAiQuestion('');
                    setAiAnswer(null);
                    // 전체화면 상태도 초기화
                    if (isAiFullscreen && document.exitFullscreen) {
                      document.exitFullscreen().catch(() => {});
                    }
                  }}
                  style={styles.aiCloseButton}
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 메인 콘텐츠: 왼쪽 차트, 오른쪽 답변 */}
            <div className="dashboard-ai-content">
              {/* 왼쪽: 차트 영역 (2/3) */}
              <div className="dashboard-ai-chart">
                {renderExpandedCardContentRef.current
                  ? renderExpandedCardContentRef.current(aiAnalysisCardId)
                  : null}
              </div>

              {/* 오른쪽: AI 답변 영역 (1/3) */}
              <div className="dashboard-ai-answer">
                {aiLoading && (
                  <div style={styles.aiLoading}>분석 중...</div>
                )}
                {!aiLoading && !aiAnswer && (
                  <div style={styles.aiPlaceholder}>
                    왼쪽 차트를 기준으로 궁금한 점을 아래에 입력해 주세요.
                  </div>
                )}
                {!aiLoading && aiAnswer && (
                  <div style={styles.aiAnswerBody}>
                    {/* 타이핑 효과로 텍스트 표시 */}
                    {aiDisplayedText.split('\n').map((line, index, array) => {
                      // 마지막 줄이고 타이핑 중이면 커서 표시
                      const isLastLine = index === array.length - 1;
                      const showCursor = isLastLine && isTyping;
                      
                      return (
                        <p key={index} style={{ margin: '0.5rem 0' }}>
                          {line}
                          {showCursor && <span style={styles.typingCursor}>▊</span>}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 하단: 질문 입력 */}
            <form
              className="dashboard-ai-input"
              onSubmit={handleAiSubmit}
            >
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="이 차트에 대해 궁금한 점을 질문해 보세요."
                style={styles.aiInput}
                disabled={aiLoading}
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuestion.trim()}
                style={styles.aiSubmitButton}
              >
                {aiLoading ? '분석 중...' : '보내기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// 다크 테마 스타일
// AppLayout의 app-main에서 이미 padding이 적용되므로, 여기서는 추가 padding을 최소화합니다.
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    // height, overflow, minHeight는 CSS 클래스(.dashboard-page-container)에서 미디어쿼리로 제어
  },
  // 그리드 컨테이너 (flex: 1로 남은 공간 채움)
  gridContainer: {
    flex: 1,
    // minHeight, overflow는 CSS 클래스(.dashboard-grid-container)에서 미디어쿼리로 제어
  },
  pageTitle: {
    marginBottom: '1rem',
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
    fontSize: '1.75rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    flexShrink: 0, // 크기 축소 방지
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
    flexShrink: 0,
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
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    marginBottom: '1rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'flex-start',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    flexShrink: 0, // 크기 축소 방지
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
    margin: '8px 0',
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(15, 23, 42, 0.7)', // 다크 테마: 어두운 배경
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px dashed rgba(148, 163, 184, 0.5)', // 점선 테두리
    transition: 'background 0.15s ease, border 0.15s ease, box-shadow 0.15s ease', // border-color 대신 border 사용
    flexShrink: 0, // 크기 축소 방지
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
  // AI 분석 모드 스타일
  aiHeaderTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
  },
  aiHeaderActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  aiFullscreenButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    color: '#94a3b8', // 다크 테마: 회색 텍스트
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s, color 0.2s',
  },
  aiCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#94a3b8', // 다크 테마: 회색 텍스트
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s, color 0.2s',
  },
  aiLoading: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '2rem',
  },
  aiPlaceholder: {
    color: '#64748b', // 다크 테마: 회색 텍스트
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '2rem',
    fontStyle: 'italic',
  },
  aiAnswerBody: {
    color: '#e5e7eb', // 다크 테마: 밝은 텍스트
    fontSize: '0.95rem',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap', // 줄바꿈 유지
    wordBreak: 'break-word',
  },
  typingCursor: {
    display: 'inline-block',
    width: '2px',
    height: '1em',
    backgroundColor: '#8b5cf6', // 보라색 커서
    marginLeft: '2px',
    animation: 'blink 1s infinite',
    verticalAlign: 'baseline',
  },
  aiInput: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: '8px',
    fontSize: '0.95rem',
    backgroundColor: '#0f172a', // 다크 테마: 어두운 배경
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  aiSubmitButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', // 보라색-파란색 그라데이션
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.2s',
  },
};

export default UserDashboardPage;

