/**
 * Reports 페이지
 * 
 * 여러 리포트를 검색하고 선택하여 표시하는 페이지입니다.
 * Period 필터 기능을 포함합니다.
 */

import React, { useState, useMemo, useEffect } from 'react';
import WorkshopKpiSheet from '../components/report/WorkshopKpiSheet';
import './ReportsPage.css';

/**
 * 리포트 타입 정의
 */
export interface Report {
  id: string;
  title: string;
  subtitle: string;
}

/**
 * 리포트 목록 (기존 리포트를 복사하여 01, 02, 03 생성)
 */
const REPORTS: Report[] = [
  {
    id: 'report-01',
    title: 'Workshop KPI Report 01',
    subtitle: 'Workshop KPI - Total 01',
  },
  {
    id: 'report-02',
    title: 'Workshop KPI Report 02',
    subtitle: 'Workshop KPI - Total 02',
  },
  {
    id: 'report-03',
    title: 'Workshop KPI Report 03',
    subtitle: 'Workshop KPI - Total 03',
  },
];

/**
 * ReportsPage 컴포넌트
 */
const ReportsPage: React.FC = () => {
  // 선택된 리포트 ID
  const [selectedReportId, setSelectedReportId] = useState<string>(REPORTS[0].id);
  
  // 검색어
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Period 필터 상태 (Dashboard 참고)
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [periodMode, setPeriodMode] = useState<'recent7' | 'thisMonth' | 'lastMonth' | 'custom'>('recent7');
  
  // 모바일 여부 상태 (1200px 기준)
  const [isMobile, setIsMobile] = useState(false);

  /**
   * 모바일 감지 (1200px 기준)
   */
  useEffect(() => {
    const checkMobile = () => {
      const viewportWidth = window.innerWidth;
      setIsMobile(viewportWidth < 1200);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Period 모드에 따라 날짜 자동 설정
   */
  useEffect(() => {
    const today = new Date();
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (periodMode) {
      case 'recent7':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        setFrom(formatDate(sevenDaysAgo));
        setTo(formatDate(today));
        break;
      case 'thisMonth':
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setFrom(formatDate(thisMonthStart));
        setTo(formatDate(today));
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setFrom(formatDate(lastMonthStart));
        setTo(formatDate(lastMonthEnd));
        break;
      case 'custom':
        // 사용자가 직접 입력하도록 유지
        break;
    }
  }, [periodMode]);

  /**
   * 검색어로 필터링된 리포트 목록
   */
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) {
      return REPORTS;
    }
    const query = searchQuery.toLowerCase();
    return REPORTS.filter(
      (report) =>
        report.title.toLowerCase().includes(query) ||
        report.subtitle.toLowerCase().includes(query) ||
        report.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  /**
   * 검색 결과에 따라 선택된 리포트 자동 업데이트
   */
  useEffect(() => {
    // 검색 결과가 있고, 현재 선택된 리포트가 필터링된 목록에 없으면 첫 번째 결과로 자동 선택
    if (filteredReports.length > 0 && !filteredReports.find(r => r.id === selectedReportId)) {
      setSelectedReportId(filteredReports[0].id);
    }
  }, [filteredReports, selectedReportId]);

  /**
   * 선택된 리포트
   */
  const selectedReport = useMemo(() => {
    return REPORTS.find((report) => report.id === selectedReportId) || REPORTS[0];
  }, [selectedReportId]);

  /**
   * Period 텍스트 생성
   */
  const periodText = useMemo(() => {
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const fromMonth = String(fromDate.getMonth() + 1).padStart(2, '0');
      const toMonth = String(toDate.getMonth() + 1).padStart(2, '0');
      const fromYear = fromDate.getFullYear();
      const toYear = toDate.getFullYear();
      
      if (fromYear === toYear && fromMonth === toMonth) {
        return `Period : ${fromYear}-${fromMonth} (All Dealer)`;
      } else {
        return `Period : ${fromYear}-${fromMonth} ~ ${toYear}-${toMonth} (All Dealer)`;
      }
    }
    return 'Period : 2025-10 (All Dealer)';
  }, [from, to]);

  /**
   * Period 설명 텍스트
   */
  const getPeriodDescription = (): string => {
    switch (periodMode) {
      case 'recent7':
        return 'Last 7 Days';
      case 'thisMonth':
        return 'This Month';
      case 'lastMonth':
        return 'Last Month';
      case 'custom':
        return from && to ? `${from} ~ ${to}` : 'Custom Range';
      default:
        return 'Last 7 Days';
    }
  };

  return (
    <div className="reports-page">
      <div className="reports-page-header">
        <h1 className="reports-page-title">Reports</h1>
        <p className="reports-page-subtitle">리포트 검색 및 선택</p>
      </div>

      {/* 필터 및 검색 영역 */}
      <div className="reports-filter-bar">
        {/* 리포트 검색 및 선택 */}
        <div className="reports-filter-group">
          <label className="reports-filter-label">Report:</label>
          <div className="reports-search-select-container">
            {/* 검색창 */}
            <input
              type="text"
              placeholder="리포트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="reports-search-input"
            />
            {/* 선택창 */}
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="reports-select"
            >
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.title}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  검색 결과가 없습니다
                </option>
              )}
            </select>
            {/* 검색 결과 개수 표시 */}
            {searchQuery.trim() && (
              <span className="reports-search-count">
                ({filteredReports.length}개 검색됨)
              </span>
            )}
          </div>
        </div>

        {/* Period 필터 (Dashboard 참고) */}
        <div className="reports-filter-group">
          <label className="reports-filter-label">Period:</label>
          <div className="reports-period-options">
            <label className="reports-radio-label">
              <input
                type="radio"
                name="period"
                value="recent7"
                checked={periodMode === 'recent7'}
                onChange={(e) => setPeriodMode(e.target.value as any)}
              />
              Last 7 Days
            </label>
            <label className="reports-radio-label">
              <input
                type="radio"
                name="period"
                value="thisMonth"
                checked={periodMode === 'thisMonth'}
                onChange={(e) => setPeriodMode(e.target.value as any)}
              />
              This Month
            </label>
            <label className="reports-radio-label">
              <input
                type="radio"
                name="period"
                value="lastMonth"
                checked={periodMode === 'lastMonth'}
                onChange={(e) => setPeriodMode(e.target.value as any)}
              />
              Last Month
            </label>
            <label className="reports-radio-label">
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
            <div className="reports-date-inputs">
              <input
                type="date"
                value={from || ''}
                onChange={(e) => setFrom(e.target.value || null)}
                className="reports-date-input"
              />
              <span className="reports-date-separator">~</span>
              <input
                type="date"
                value={to || ''}
                onChange={(e) => setTo(e.target.value || null)}
                className="reports-date-input"
              />
            </div>
          )}
        </div>
      </div>

      {/* 리포트 콘텐츠 영역 */}
      <div className="reports-page-content">
        <div className="reports-card">
          <div className="reports-card-header">
            <h2 className="reports-card-title">{selectedReport.title}</h2>
            <p className="reports-card-subtitle">{selectedReport.subtitle}</p>
            <p className="reports-card-period">{getPeriodDescription()}</p>
          </div>
          <div className="reports-card-body">
            <WorkshopKpiSheet
              periodText={periodText}
              readOnly={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
