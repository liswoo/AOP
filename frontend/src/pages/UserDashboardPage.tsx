/**
 * 사용자 대시보드 페이지
 * 
 * 일반 사용자가 로그인 후 처음 보게 되는 대시보드 화면입니다.
 * 
 * 동작 흐름:
 * 1. 페이지가 마운트되면 getDashboardOverview() API를 호출합니다.
 * 2. 백엔드에서 받은 데이터를 상태에 저장합니다.
 * 3. 요약 카드, 라인 차트, 바 차트, 도넛 차트를 렌더링합니다.
 * 
 * 레이아웃:
 * - 상단: summaryCards를 4개의 카드 형태로 가로로 배치
 * - 중간: 좌측에 lineChart, 우측에 barChart
 * - 하단: doughnutChart와 간단한 설명 텍스트
 * 
 * Chart.js + react-chartjs-2를 사용하여 차트를 렌더링합니다.
 * 백엔드에서 내려주는 데이터를 그대로 사용합니다.
 */

import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getDashboardOverview } from '../api/dashboardApi';
import { DashboardOverview } from '../types';
import Header from '../components/Header';

// Chart.js에 필요한 컴포넌트들을 등록합니다.
// 이렇게 등록해야 react-chartjs-2에서 차트를 렌더링할 수 있습니다.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

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
  // 대시보드 데이터 상태
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 에러 상태
  const [error, setError] = useState<string | null>(null);

  /**
   * 컴포넌트가 마운트될 때 대시보드 데이터를 불러옵니다.
   * 
   * useEffect의 의존성 배열이 비어있으므로,
   * 컴포넌트가 처음 마운트될 때 한 번만 실행됩니다.
   */
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // GET /api/dashboard/overview API를 호출하여 대시보드 데이터를 가져옵니다.
        // 이 API는 인증이 필요하므로, apiClient의 요청 인터셉터가
        // 자동으로 Authorization 헤더에 Bearer 토큰을 추가합니다.
        const data = await getDashboardOverview();
        
        // 성공 시 상태에 저장
        setOverview(data);
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

    loadDashboardData();
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

  // 로딩 중일 때 표시할 내용
  if (isLoading) {
    return (
      <>
        <Header />
        <div style={styles.container}>
          <div style={styles.loading}>로딩 중...</div>
        </div>
      </>
    );
  }

  // 에러가 발생했을 때 표시할 내용
  if (error) {
    return (
      <>
        <Header />
        <div style={styles.container}>
          <div style={styles.error}>{error}</div>
        </div>
      </>
    );
  }

  // 데이터가 없을 때 표시할 내용
  if (!overview) {
    return (
      <>
        <Header />
        <div style={styles.container}>
          <div style={styles.error}>데이터가 없습니다.</div>
        </div>
      </>
    );
  }

  /**
   * Chart.js에 전달할 차트 옵션을 생성합니다.
   * 
   * 백엔드에서 받은 데이터를 Chart.js 형식으로 변환합니다.
   * react-chartjs-2는 Chart.js의 데이터 구조를 그대로 사용하므로,
   * 백엔드에서 내려주는 데이터를 거의 그대로 사용할 수 있습니다.
   */

  // 라인 차트 데이터 변환
  // 백엔드에서 받은 lineChart 데이터를 Chart.js 형식으로 변환
  const lineChartData = {
    labels: overview.lineChart.labels,
    datasets: overview.lineChart.datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
    })),
  };

  // 바 차트 데이터 변환
  const barChartData = {
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
  };

  // 도넛 차트 데이터 변환
  const doughnutChartData = {
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
  };

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

  return (
    <>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>대시보드</h1>

        {/* 요약 카드 섹션 */}
        {/* 상단에 4개의 요약 카드를 가로로 배치합니다. */}
        <div style={styles.summaryCards}>
          {overview.summaryCards.map((card, index) => (
            <div key={index} style={styles.summaryCard}>
              <div style={styles.cardLabel}>{card.label}</div>
              <div style={styles.cardValue}>
                {card.value.toLocaleString()}
                <span style={styles.cardUnit}>{card.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 차트 섹션 */}
        {/* 중간에 좌측에 라인 차트, 우측에 바 차트를 배치합니다. */}
        <div style={styles.chartsRow}>
          {/* 라인 차트 */}
          <div style={styles.chartContainer}>
            <h2 style={styles.chartTitle}>{overview.lineChart.title}</h2>
            <div style={styles.chartWrapper}>
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>

          {/* 바 차트 */}
          <div style={styles.chartContainer}>
            <h2 style={styles.chartTitle}>{overview.barChart.title}</h2>
            <div style={styles.chartWrapper}>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* 도넛 차트 섹션 */}
        {/* 하단에 도넛 차트를 배치합니다. */}
        <div style={styles.doughnutSection}>
          <div style={styles.chartContainer}>
            <h2 style={styles.chartTitle}>{overview.doughnutChart.title}</h2>
            <div style={styles.doughnutWrapper}>
              <Doughnut data={doughnutChartData} options={chartOptions} />
            </div>
            <p style={styles.description}>
              채널별 매출 비율을 도넛 차트로 표시합니다.
              백엔드에서 받은 데이터를 Chart.js에 바로 바인딩하여 사용합니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// 간단한 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
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
  },
  // 요약 카드 스타일
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  cardLabel: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '0.5rem',
  },
  cardValue: {
    fontSize: '1.8rem',
    fontWeight: '600',
    color: '#333',
  },
  cardUnit: {
    fontSize: '1rem',
    marginLeft: '0.5rem',
    color: '#666',
  },
  // 차트 스타일
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  chartTitle: {
    marginBottom: '1rem',
    fontSize: '1.2rem',
    color: '#333',
  },
  chartWrapper: {
    height: '300px',
  },
  doughnutSection: {
    marginBottom: '2rem',
  },
  doughnutWrapper: {
    height: '300px',
    marginBottom: '1rem',
  },
  description: {
    color: '#666',
    fontSize: '0.9rem',
    lineHeight: '1.6',
  },
};

export default UserDashboardPage;

