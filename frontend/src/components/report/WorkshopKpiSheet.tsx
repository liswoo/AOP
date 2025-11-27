/**
 * Workshop KPI 시트 컴포넌트
 * 
 * Handsontable을 사용하여 엑셀 스타일의 KPI 리포트 시트를 렌더링합니다.
 * 
 * 주요 기능:
 * - Title/Period/Section/Metric 행 구조 지원
 * - 셀 병합 (mergeCells)
 * - 섹션별 스타일링
 * - 음수 값 빨간색 표시
 * - 읽기 전용 모드 (향후 편집 가능하도록 구조 확장 가능)
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import type Handsontable from 'handsontable';
import type { CellProperties } from 'handsontable/settings';
import { WORKSHOP_KPI_ROWS, type WorkshopKpiRowConfig } from './workshopKpiLayout';
import { WORKSHOP_KPI_METRICS, type WorkshopKpiMetricValues } from './workshopKpiMockData';
import 'handsontable/dist/handsontable.full.css';
import './WorkshopKpiSheet.css';

/**
 * WorkshopKpiSheet Props
 */
export interface WorkshopKpiSheetProps {
  /** Period 텍스트 (예: "Period : 2025-10 (All Dealer)") */
  periodText?: string;
  /** 시트 높이 (픽셀) */
  height?: number;
  /** 읽기 전용 여부 (기본: true) */
  readOnly?: boolean;
}

/**
 * WorkshopKpiSheet 컴포넌트
 */
const WorkshopKpiSheet: React.FC<WorkshopKpiSheetProps> = ({
  periodText = 'Period : 2025-10 (All Dealer)',
  height = 600,
  readOnly = true,
}) => {
  const hotTableRef = useRef<HotTable | null>(null);

  /**
   * 레이아웃과 데이터를 조합하여 Handsontable 데이터 배열 생성
   */
  const tableData = useMemo(() => {
    const data: (string | number | null)[][] = [];
    const monthOrder: Array<keyof WorkshopKpiMetricValues['monthly']> = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ];

    WORKSHOP_KPI_ROWS.forEach((rowConfig) => {
      const row: (string | number | null)[] = [];

      if (rowConfig.type === 'title') {
        // Title 행: 첫 번째 셀에만 텍스트, 나머지는 빈 값
        row.push(rowConfig.label || '');
        for (let i = 1; i < 15; i++) {
          row.push(null);
        }
      } else if (rowConfig.type === 'period') {
        // Period 행: 첫 번째 셀에만 텍스트 (periodText 사용), 나머지는 빈 값
        row.push(periodText);
        for (let i = 1; i < 15; i++) {
          row.push(null);
        }
      } else if (rowConfig.type === 'spacer') {
        // Spacer: 모든 셀이 빈 값
        for (let i = 0; i < 15; i++) {
          row.push(null);
        }
      } else if (rowConfig.type === 'section') {
        // Section 행: 첫 번째 셀에만 텍스트, 나머지는 빈 값
        row.push(rowConfig.label || '');
        for (let i = 1; i < 15; i++) {
          row.push(null);
        }
      } else if (rowConfig.type === 'metric') {
        // Metric 행: label + benchmark + ytd + 월별 데이터
        const metricData = WORKSHOP_KPI_METRICS.find(
          (m) => m.metricKey === rowConfig.metricKey
        );

        row.push(rowConfig.label || ''); // 지표명
        row.push(metricData?.benchmark ?? null); // Benchmark
        row.push(metricData?.ytd ?? null); // YTD

        // 월별 데이터
        monthOrder.forEach((month) => {
          row.push(metricData?.monthly[month] ?? null);
        });
      } else {
        // 기본: 모든 셀이 빈 값
        for (let i = 0; i < 15; i++) {
          row.push(null);
        }
      }

      data.push(row);
    });

    return data;
  }, [periodText]);

  /**
   * 셀 병합 정보 생성
   */
  const mergeCells = useMemo(() => {
    const merges: Array<{
      row: number;
      col: number;
      rowspan: number;
      colspan: number;
    }> = [];

    WORKSHOP_KPI_ROWS.forEach((rowConfig, rowIndex) => {
      if (rowConfig.type === 'title' || rowConfig.type === 'period' || rowConfig.type === 'section') {
        // 첫 번째 컬럼부터 마지막 컬럼까지 병합 (15개 컬럼)
        merges.push({
          row: rowIndex,
          col: 0,
          rowspan: 1,
          colspan: 15,
        });
      }
    });

    return merges;
  }, []);

  /**
   * Handsontable 설정
   */
  const hotSettings = useMemo(() => {
    return {
      data: tableData,
      colHeaders: ['', 'Benchmark', 'YTD', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      rowHeaders: false, // 행 번호 숨김
      width: '100%',
      height: height,
      readOnly: readOnly,
      licenseKey: 'non-commercial-and-evaluation' as const,
      colWidths: [300, 100, 100, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80],
      stretchH: 'all' as const,
      mergeCells: mergeCells,
      cells: (row: number, col: number): CellProperties => {
        const cellProps: CellProperties = {};
        const rowConfig = WORKSHOP_KPI_ROWS[row];

        if (!rowConfig) {
          return cellProps;
        }

        // Title 행 스타일
        if (rowConfig.type === 'title') {
          if (col === 0) {
            cellProps.className = 'ht-cell-title';
          }
        }
        // Period 행 스타일
        else if (rowConfig.type === 'period') {
          if (col === 0) {
            cellProps.className = 'ht-cell-period';
          }
        }
        // Section 행 스타일
        else if (rowConfig.type === 'section') {
          if (col === 0) {
            cellProps.className = 'ht-cell-section';
          }
        }
        // Metric 행 스타일
        else if (rowConfig.type === 'metric') {
          if (col === 0) {
            // 지표명 셀
            cellProps.className = 'ht-cell-metric-label';
          } else if (col >= 1) {
            // 숫자 셀
            const value = tableData[row]?.[col];
            if (typeof value === 'number') {
              cellProps.className = 'ht-cell-metric-number';
              
              // Variance% 지표는 음수일 때 빨간색
              if (rowConfig.label?.includes('Variance%') && value < 0) {
                cellProps.className += ' ht-cell-negative';
              }
            } else {
              cellProps.className = 'ht-cell-metric-number';
            }
          }
        }

        return cellProps;
      },
    };
  }, [tableData, height, readOnly, mergeCells]);

  return (
    <div className="workshop-kpi-sheet-container">
      <HotTable
        ref={hotTableRef}
        settings={hotSettings}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default WorkshopKpiSheet;

