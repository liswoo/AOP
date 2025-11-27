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

import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { HotTable } from '@handsontable/react';
import type { CellProperties } from 'handsontable/settings';
import { WORKSHOP_KPI_ROWS, WORKSHOP_KPI_COLUMNS } from './workshopKpiLayout';
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * 컬럼 수 계산 (동적으로 처리)
   */
  const columnCount = WORKSHOP_KPI_COLUMNS.length;

  // 각 컬럼 너비 상태 (px)
  const [colWidths, setColWidths] = useState<number[]>(() =>
    Array(columnCount).fill(100)
  );

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
        for (let i = 1; i < columnCount; i++) {
          row.push(null);
        }
      } else if (rowConfig.type === 'period') {
        // Period 행: 첫 번째 셀에만 텍스트 (periodText 사용), 나머지는 빈 값
        row.push(periodText);
        for (let i = 1; i < columnCount; i++) {
          row.push(null);
        }
      } else if (rowConfig.type === 'spacer') {
        // Spacer: 모든 셀이 빈 값
        for (let i = 0; i < columnCount; i++) {
          row.push(null);
        }
      } else if (rowConfig.type === 'section') {
        // Section 행: 첫 번째 셀에만 텍스트, 나머지는 빈 값
        row.push(rowConfig.label || '');
        for (let i = 1; i < columnCount; i++) {
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
        for (let i = 0; i < columnCount; i++) {
          row.push(null);
        }
      }

      data.push(row);
    });

    return data;
  }, [periodText, columnCount]);

  /**
   * 셀 병합 정보 생성
   * 
   * 레이아웃 config 기반으로 동적으로 계산합니다.
   * Title, Period, Section 행을 전체 컬럼에 병합합니다.
   */
  const mergeCells = useMemo(() => {
    const merges: Array<{
      row: number;
      col: number;
      rowspan: number;
      colspan: number;
    }> = [];

    WORKSHOP_KPI_ROWS.forEach((rowConfig, rowIndex) => {
      // Title 행 (row 0): "Workshop KPI - Total"
      // Period 행 (row 1): "Period : 2025-10 (All Dealer)"
      // Section 행: "Operations", "Quality", "Financials"
      if (rowConfig.type === 'title' || rowConfig.type === 'period' || rowConfig.type === 'section') {
        merges.push({
          row: rowIndex,
          col: 0,
          rowspan: 1,
          colspan: columnCount, // 동적으로 컬럼 수 계산
        });
      }
    });

    // 디버깅: mergeCells와 데이터 행 인덱스 확인
    console.log('=== WorkshopKpiSheet Debug ===');
    console.log('tableData rows:', tableData.length);
    console.log('WORKSHOP_KPI_ROWS length:', WORKSHOP_KPI_ROWS.length);
    console.log('columnCount:', columnCount);
    console.log('mergeCells:', merges);
    
    // 실제 row 인덱스 확인
    const titleRowIndex = WORKSHOP_KPI_ROWS.findIndex(r => r.type === 'title');
    const periodRowIndex = WORKSHOP_KPI_ROWS.findIndex(r => r.type === 'period');
    const operationsRowIndex = WORKSHOP_KPI_ROWS.findIndex(r => r.sectionKey === 'operations' && r.type === 'section');
    const qualityRowIndex = WORKSHOP_KPI_ROWS.findIndex(r => r.sectionKey === 'quality' && r.type === 'section');
    const financialsRowIndex = WORKSHOP_KPI_ROWS.findIndex(r => r.sectionKey === 'financials' && r.type === 'section');
    
    console.log('Row indices:', {
      title: titleRowIndex,
      period: periodRowIndex,
      operations: operationsRowIndex,
      quality: qualityRowIndex,
      financials: financialsRowIndex,
    });

    return merges;
  }, [columnCount]);

  /**
   * 행 높이 설정
   * 
   * Title/Section 행의 높이를 살짝 키워서 시각적 구분을 강화합니다.
   * CSS에서 height를 직접 지정하지 않고 rowHeights로만 조절합니다.
   */
  const rowHeights = useMemo(() => {
    return WORKSHOP_KPI_ROWS.map((rowConfig) => {
      if (rowConfig.type === 'title') return 32; // Title 행: 약간 높게
      if (rowConfig.type === 'section') return 28; // Section 행: 약간 높게
      if (rowConfig.type === 'period') return 26; // Period 행: 기본보다 약간 높게
      return 24; // 기본 높이
    });
  }, []);

  /**
   * cells 콜백 함수
   * 
   * 각 셀에 className을 부여하여 스타일을 적용합니다.
   */
  const cellsCallback = useMemo(() => {
    return (row: number, col: number): CellProperties => {
      const cellProps: CellProperties = {};
      const rowConfig = WORKSHOP_KPI_ROWS[row];

      if (!rowConfig) {
        return cellProps;
      }

      // Title 행 (row 0): "Workshop KPI - Total"
      // 병합된 행이므로 모든 셀에 같은 className 적용
      if (rowConfig.type === 'title') {
        cellProps.className = 'htCenter htMiddle kpi-title-cell';
        cellProps.readOnly = true;
      }
      // Period 행: "Period : 2025-10 (All Dealer)"
      // 병합된 행이므로 모든 셀에 같은 className 적용
      else if (rowConfig.type === 'period') {
        cellProps.className = 'htLeft htMiddle kpi-period-cell';
        cellProps.readOnly = true;
      }
      // Section 행: "Operations", "Quality", "Financials"
      // 병합된 행이므로 모든 셀에 같은 className 적용
      else if (rowConfig.type === 'section') {
        cellProps.className = 'htLeft htMiddle kpi-section-cell';
        cellProps.readOnly = true;
      }
      // Metric 행: 실제 지표 데이터 행
      else if (rowConfig.type === 'metric') {
        if (col === 0) {
          // 지표명 셀 (좌측 정렬)
          cellProps.className = 'ht-cell-metric-label';
        } else if (col >= 1) {
          // 숫자 셀 (우측 정렬)
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
    };
  }, [tableData]);

  /**
   * 컨테이너 width 기준으로 colWidths 동적으로 계산
   * - 1번 컬럼: 고정 260px
   * - 나머지 14개 컬럼: 남은 너비를 균등 분배 (최소 70px 보장)
   */
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calcColWidths = () => {
      const totalWidth = container.clientWidth;
      if (!totalWidth || totalWidth <= 0) return;

      const firstColWidth = 260;
      const otherColCount = columnCount - 1;
      const minOtherColWidth = 70;

      // 컨테이너에서 첫 번째 컬럼 빼고 남은 공간
      let remaining = totalWidth - firstColWidth;

      // 남은 공간이 너무 작으면 최소 폭 기준으로 계산
      const minNeededForOthers = otherColCount * minOtherColWidth;
      if (remaining < minNeededForOthers) {
        remaining = minNeededForOthers;
      }

      const perOther = Math.floor(remaining / otherColCount);
      const widths: number[] = [firstColWidth];
      for (let i = 0; i < otherColCount; i++) {
        widths.push(perOther);
      }
      setColWidths(widths);
    };

    // 초기 1회 계산
    calcColWidths();

    // 리사이즈 대응
    const ro = new ResizeObserver(() => {
      calcColWidths();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  }, [columnCount]);

  return (
    <div className="workshop-kpi-sheet-container" ref={containerRef}>
      <HotTable
        ref={hotTableRef}
        data={tableData}
        colHeaders={['', 'Benchmark', 'YTD', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
        rowHeaders={false}
        width="100%"
        readOnly={readOnly}
        licenseKey="non-commercial-and-evaluation"
        colWidths={colWidths}
        stretchH="none"
        mergeCells={mergeCells}
        rowHeights={rowHeights}
        cells={cellsCallback}
      />
    </div>
  );
};

export default WorkshopKpiSheet;

