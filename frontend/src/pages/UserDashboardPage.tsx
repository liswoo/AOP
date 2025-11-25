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

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'chart.js';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { getDashboardOverview, DashboardQuery } from '../api/dashboardApi';
import { DashboardOverview } from '../types';
import { DashboardCardId, DashboardLayoutItem, defaultDashboardLayout } from '../types/dashboard';
import Header from '../components/Header';
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
  Legend
);

// react-grid-layout의 Responsive 컴포넌트를 WidthProvider로 래핑
// WidthProvider는 컨테이너의 너비를 자동으로 감지하여 Responsive 컴포넌트에 전달합니다.
const ResponsiveGridLayout = WidthProvider(Responsive);

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
  
  // 대시보드 레이아웃 상태 관리
  // react-grid-layout에서 레이아웃이 변경될 때마다 이 상태가 업데이트됩니다.
  const [layout, setLayout] = useState<DashboardLayoutItem[]>(defaultDashboardLayout);

  /**
   * 기본 레이아웃 맵
   * 
   * 각 카드의 기본 크기(w, h)를 보존하기 위해 사용합니다.
   * handleLayoutChange에서 위치(x, y)만 변경하고 크기는 기본값을 유지하기 위함입니다.
   */
  const baseLayoutMap = useMemo(() => {
    const m = new Map<string, DashboardLayoutItem>();
    defaultDashboardLayout.forEach(item => m.set(item.i, item));
    return m;
  }, []);

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

  // 라인 차트 데이터 변환 (overview가 있을 때만)
  const lineChartData = overview ? {
    labels: overview.lineChart.labels,
    datasets: overview.lineChart.datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
    })),
  } : null;

  // 바 차트 데이터 변환
  const barChartData = overview ? {
    labels: overview.barChart.labels,
    datasets: overview.barChart.datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    })),
  } : null;

  // 도넛 차트 데이터 변환
  const doughnutChartData = overview ? {
    labels: overview.doughnutChart.labels,
    datasets: overview.doughnutChart.datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
      ],
      borderWidth: 1,
    })),
  } : null;

  // 공통 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
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
   * 레이아웃 변경 핸들러
   * 
   * react-grid-layout에서 카드 위치를 바꿀 때 호출되는 콜백입니다.
   * 여기서는 카드 크기(w,h)는 기본 레이아웃 값을 유지하고,
   * 위치(x,y)만 변경되도록 강제하여
   * 6개 카드가 항상 동일한 크기를 유지하도록 합니다.
   * 
   * 이렇게 하면 "6개의 고정 슬롯 안에서 위치만 바꾸는" 형태의 레이아웃이 됩니다.
   */
  const handleLayoutChange = (next: Layout[]) => {
    // react-grid-layout이 넘겨주는 Layout에는 x,y,w,h가 모두 들어있지만
    // 우리는 위치(x,y)만 반영하고 크기(w,h)는 기본값으로 되돌립니다.
    const newLayout: DashboardLayoutItem[] = next.map(item => {
      const base = baseLayoutMap.get(item.i as DashboardCardId);
      if (!base) {
        // 기본 레이아웃에 없는 경우 (이론적으로 발생하지 않아야 함)
        return {
          i: item.i as DashboardCardId,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        };
      }
      // 위치(x, y)만 업데이트하고, 크기(w, h)는 기본값 유지
      return {
        ...base,
        x: item.x,
        y: item.y,
      };
    });
    setLayout(newLayout);
    
    // TODO: localStorage에 저장하여 새로고침 후에도 사용자 맞춤 레이아웃 유지
    // localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
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
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderWidth: 2,
      }],
    };

    // (3) 재고 현황 카드용 Bar 차트 데이터 (백엔드에서 받은 barChart 활용)
    const inventoryBarData = overview.barChart ? {
      labels: overview.barChart.labels,
      datasets: overview.barChart.datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)', // 전월재고
          'rgba(75, 192, 192, 0.6)', // 입고
          'rgba(255, 99, 132, 0.6)', // 출하내수
          'rgba(255, 99, 132, 0.6)', // 출하수출
          'rgba(255, 99, 132, 0.6)', // 기타
          'rgba(54, 162, 235, 0.6)', // 월말재고
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 1,
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
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }],
    };

    // (6) 비가동 실적 카드용 멀티 도넛 차트 데이터 (백엔드에서 받은 doughnutChart 활용)
    const downtimeDoughnutData = overview.doughnutChart ? {
      labels: overview.doughnutChart.labels,
      datasets: overview.doughnutChart.datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: index === 0 
          ? 'rgba(255, 99, 132, 0.6)' // 계획
          : index === 1
          ? 'rgba(255, 206, 86, 0.6)' // 실적
          : [
              'rgba(75, 192, 192, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(201, 203, 207, 0.6)',
              'rgba(255, 159, 64, 0.6)',
            ],
        borderColor: index === 0
          ? 'rgba(255, 99, 132, 1)'
          : index === 1
          ? 'rgba(255, 206, 86, 1)'
          : [
              'rgba(75, 192, 192, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(201, 203, 207, 1)',
              'rgba(255, 159, 64, 1)',
            ],
        borderWidth: 1,
      })),
    } : null;

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
                        color: row.isPositive ? '#28a745' : '#dc3545',
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
              style={{ height: '100%' }}
            >
              <div className="chart-container">
                <Radar data={qualityRadarData} options={{
                  ...chartOptions,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
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
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={45}
        margin={[16, 16]}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".dashboard-card-drag-handle"
        isDraggable={true}
        isResizable={false}
        compactType="vertical"
        preventCollision={false}
      >
        {layout.map((item) => (
          <div key={item.i} data-grid={item}>
            {renderCard(item.i)}
          </div>
        ))}
        </ResponsiveGridLayout>
      </>
    );
  };

  return (
    <>
      <Header />
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

        {/* 메인 콘텐츠 (카드 그리드) */}
        {renderContent()}
      </div>

      {/* AI 프롬프트 모달 */}
      <AiPromptModal
        open={aiModalOpen}
        title={aiModalTitle}
        onClose={() => setAiModalOpen(false)}
      />
    </>
  );
};

// 간단한 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: '#f5f5f5', // 심플한 SaaS 스타일: 연한 회색 배경
    minHeight: '100vh',
  },
  pageTitle: {
    marginBottom: '2rem',
    color: '#333',
    fontSize: '2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '1rem',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  errorContainer: {
    textAlign: 'center',
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.5rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  // 필터 바 스타일
  filterBar: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  filterLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333',
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
  },
  dateInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  dateInput: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  dateSeparator: {
    color: '#666',
  },
  searchButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  select: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
    minWidth: '150px',
  },
  loadingOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '2rem',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  // 카드 그리드 스타일은 react-grid-layout이 자동으로 관리합니다.
  // cardGrid 스타일 제거됨
  // 차트 래퍼 스타일은 chart-container 클래스로 대체됨 (react-grid-layout과 Chart.js 높이를 맞추기 위한 처리)
  // 주요 손익 테이블 스타일
  profitTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  tableHeader: {
    padding: '8px',
    textAlign: 'left',
    borderBottom: '2px solid #f0f0f0',
    fontWeight: '600',
    color: '#333',
    fontSize: '0.85rem',
  },
  tableCell: {
    padding: '8px',
    borderBottom: '1px solid #f0f0f0',
    color: '#666',
  },
  // 인원 현황 요약 스타일
  personnelSummary: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #f0f0f0',
  },
  personnelItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  personnelLabel: {
    fontSize: '0.85rem',
    color: '#666',
  },
  personnelValue: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#333',
  },
};

export default UserDashboardPage;

