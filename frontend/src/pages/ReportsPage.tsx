/**
 * Reports 페이지
 * 
 * 여러 리포트를 검색하고 선택하여 표시하는 페이지입니다.
 * Period 필터 기능을 포함합니다.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import WorkshopKpiSheet, { type WorkshopKpiSheetHandle } from '../components/report/WorkshopKpiSheet';
import { WORKSHOP_KPI_ROWS } from '../components/report/workshopKpiLayout';
import ExcelJS from 'exceljs';
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

  // WorkshopKpiSheet ref
  const sheetRef = useRef<WorkshopKpiSheetHandle>(null);

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

  /**
   * 엑셀 Export 함수 (스타일 및 병합 포함)
   */
  const handleExportToExcel = async () => {
    const hotInstance = sheetRef.current?.getHotInstance();
    if (!hotInstance) {
      console.error('Handsontable 인스턴스를 가져올 수 없습니다.');
      return;
    }

    try {
      // 데이터 가져오기
      const data = hotInstance.getData() as (string | number | null)[][];

      // 컬럼 헤더 가져오기
      const colCount = hotInstance.countCols();
      const colHeaders: string[] = [];
      for (let i = 0; i < colCount; i++) {
        const header = hotInstance.getColHeader(i);
        colHeaders.push(header ? String(header) : '');
      }

      // 병합 정보 계산 (WORKSHOP_KPI_ROWS 기반)
      const mergeRanges: Array<{ row: number; col: number; rowspan: number; colspan: number }> = [];
      WORKSHOP_KPI_ROWS.forEach((rowConfig, rowIndex) => {
        // Title, Period, Section 행은 전체 컬럼에 병합
        if (rowConfig.type === 'title' || rowConfig.type === 'period' || rowConfig.type === 'section') {
          mergeRanges.push({
            row: rowIndex, // 데이터 행 인덱스 (헤더 제외)
            col: 0,
            rowspan: 1,
            colspan: colCount, // 전체 컬럼 수
          });
        }
      });

      // 워크북 생성
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      // 컬럼 너비 설정
      const colWidths: number[] = [];
      for (let i = 0; i < colCount; i++) {
        const width = hotInstance.getColWidth(i);
        colWidths.push(width ? Math.max(10, Math.floor(width / 7)) : 15);
      }
      worksheet.columns = [
        { width: colWidths[0] || 15 }, // 첫 번째 컬럼
        ...colHeaders.slice(1).map((_, idx) => ({ width: colWidths[idx + 1] || 15 })),
      ];

      // 헤더 행 추가
      const headerRow = worksheet.addRow(['', ...colHeaders]);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }, // 연한 회색
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 20;

      // 데이터 행 추가
      data.forEach((row, rowIndex) => {
        const excelRow = worksheet.addRow(row);
        excelRow.height = 20;

        // 각 셀에 스타일 적용
        row.forEach((cellValue, colIndex) => {
          const cell = excelRow.getCell(colIndex + 1);

          // Handsontable의 셀 정보 가져오기
          const cellMeta = hotInstance.getCellMeta(rowIndex, colIndex);
          const className = cellMeta?.className || '';

          // Title 행 스타일 (빨간 배경, 흰색 텍스트)
          if (className.includes('kpi-title-cell')) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFB91C1C' }, // 진한 빨간색
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
          // Period 행 스타일 (연한 회색 배경)
          else if (className.includes('kpi-period-cell')) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9FAFB' }, // 연한 회색
            };
            cell.font = { size: 11 };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
          // Section 행 스타일 (빨간 배경, 흰색 텍스트)
          else if (className.includes('kpi-section-cell')) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFDC2626' }, // 빨간색
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
          // Metric 행 - 숫자 셀 (우측 정렬)
          else if (className.includes('ht-cell-metric-number')) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            if (typeof cellValue === 'number') {
              cell.numFmt = '#,##0';
            }
            // 음수 값 빨간색
            if (className.includes('ht-cell-negative')) {
              cell.font = { color: { argb: 'FFDC2626' }, bold: true };
            }
          }
          // Metric 행 - 지표명 셀 (좌측 정렬)
          else if (className.includes('ht-cell-metric-label')) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      // 셀 병합 적용
      mergeRanges.forEach((merge) => {
        // ExcelJS는 1-based 인덱스를 사용하므로 +1
        // 헤더 행이 있으므로 row + 2
        worksheet.mergeCells(
          merge.row + 2, // 헤더 행(1) + 0-based row
          merge.col + 1, // 0-based col
          merge.row + 2 + (merge.rowspan - 1),
          merge.col + 1 + (merge.colspan - 1)
        );
      });

      // 모든 셀에 테두리 추가
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
        });
      });

      // 파일명 생성
      const sanitizedTitle = selectedReport.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '_');
      const fileName = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // 파일 다운로드
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('엑셀 Export 중 오류 발생:', error);
      alert('엑셀 파일을 내보내는 중 오류가 발생했습니다.');
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
            <div className="reports-card-header-left">
              <h2 className="reports-card-title">{selectedReport.title}</h2>
              <p className="reports-card-subtitle">{selectedReport.subtitle}</p>
              <p className="reports-card-period">{getPeriodDescription()}</p>
            </div>
            <button
              className="reports-export-button"
              onClick={handleExportToExcel}
              title="엑셀로 내보내기"
            >
              <svg
                className="reports-export-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span className="reports-export-text">Export Excel</span>
            </button>
          </div>
          <div className="reports-card-body">
            <WorkshopKpiSheet
              ref={sheetRef}
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
