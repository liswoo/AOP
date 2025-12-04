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

import React, { useMemo, useRef, useState, useLayoutEffect, useEffect, forwardRef, useImperativeHandle } from 'react';
import { HotTable } from '@handsontable/react';
import type { CellProperties } from 'handsontable/settings';
import Handsontable from 'handsontable';
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
  /** 시트 높이 (픽셀 또는 "100%") */
  height?: number | string;
  /** 읽기 전용 여부 (기본: true) */
  readOnly?: boolean;
}

/**
 * WorkshopKpiSheet에서 외부로 노출할 메서드
 */
export interface WorkshopKpiSheetHandle {
  /** Handsontable 인스턴스 가져오기 */
  getHotInstance: () => Handsontable | null;
}

/**
 * WorkshopKpiSheet 컴포넌트
 */
const WorkshopKpiSheet = forwardRef<WorkshopKpiSheetHandle, WorkshopKpiSheetProps>(({
  periodText = 'Period : 2025-10 (All Dealer)',
  height = 600,
  readOnly = true,
}, ref) => {
  const hotTableRef = useRef<HotTable | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 사이드바 오버레이 상태 감지
  const [isSidebarOverlayOpen, setIsSidebarOverlayOpen] = useState(false);

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
   * 컬럼 수 계산 (동적으로 처리)
   */
  const columnCount = WORKSHOP_KPI_COLUMNS.length;

  /**
   * 사이드바 오버레이 상태 감지 (app-root의 클래스 확인)
   */
  useEffect(() => {
    const checkSidebarState = () => {
      const appRoot = document.querySelector('.app-root');
      const isOpen = appRoot?.classList.contains('sidebar-overlay-open') || false;
      setIsSidebarOverlayOpen(isOpen);
    };

    // 초기 확인
    checkSidebarState();

    // MutationObserver로 클래스 변경 감지
    const observer = new MutationObserver(checkSidebarState);
    const appRoot = document.querySelector('.app-root');
    if (appRoot) {
      observer.observe(appRoot, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    // 주기적으로도 확인 (MutationObserver가 작동하지 않는 경우 대비)
    const interval = setInterval(checkSidebarState, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  /**
   * 사이드바가 열려있을 때 Handsontable 고정 열에 blur 적용
   * Handsontable이 완전히 초기화된 후에 실행되도록 주기적으로 확인
   */
  useEffect(() => {
    if (!hotTableRef.current) return;

    const applyBlurToFixedColumns = () => {
      // @ts-ignore
      const hotInstance = hotTableRef.current?.hotInstance || hotTableRef.current;
      if (!hotInstance) return false;

      const container = hotInstance.rootElement;
      if (!container) return false;

      // 고정 열 요소 찾기 (더 구체적인 선택자 사용)
      const fixedLeftElements = container.querySelectorAll('.ht_clone_left, .ht_clone_top_left');

      // 고정 열이 있으면 적용
      if (fixedLeftElements.length > 0) {
        fixedLeftElements.forEach((element: Element) => {
          const htmlElement = element as HTMLElement;
          if (isSidebarOverlayOpen) {
            htmlElement.style.filter = 'blur(2px)';
            htmlElement.style.pointerEvents = 'none';
            htmlElement.style.zIndex = '25';
            htmlElement.style.position = 'relative';
          } else {
            htmlElement.style.filter = '';
            htmlElement.style.pointerEvents = '';
            htmlElement.style.zIndex = '';
            htmlElement.style.position = '';
          }
        });

        // 내부의 모든 자식 요소에도 blur 적용
        fixedLeftElements.forEach((element: Element) => {
          const allChildren = element.querySelectorAll('*');
          allChildren.forEach((child: Element) => {
            const htmlChild = child as HTMLElement;
            if (isSidebarOverlayOpen) {
              htmlChild.style.filter = 'blur(2px)';
            } else {
              htmlChild.style.filter = '';
            }
          });
        });

        return true; // 성공적으로 적용됨
      }

      // 고정 열이 없으면 첫 번째 열(col 0)의 셀들을 직접 찾기
      const firstColumnCells = container.querySelectorAll('td[data-col="0"], th[data-col="0"]');
      if (firstColumnCells.length > 0) {
        firstColumnCells.forEach((cell: Element) => {
          const htmlCell = cell as HTMLElement;
          if (isSidebarOverlayOpen) {
            htmlCell.style.filter = 'blur(2px)';
            htmlCell.style.pointerEvents = 'none';
          } else {
            htmlCell.style.filter = '';
            htmlCell.style.pointerEvents = '';
          }
        });
        return true;
      }

      return false; // 아직 생성되지 않음
    };

    // 즉시 시도
    if (applyBlurToFixedColumns()) {
      return; // 이미 적용됨
    }

    // Handsontable이 아직 초기화되지 않았으면 주기적으로 확인
    const interval = setInterval(() => {
      if (applyBlurToFixedColumns()) {
        clearInterval(interval);
      }
    }, 50); // 50ms마다 확인

    return () => {
      clearInterval(interval);
    };
  }, [isSidebarOverlayOpen]);

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
   * 
   * ResizeObserver 무한 루프 방지를 위해 debounce 적용
   */
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastWidth = 0;

    const calcColWidths = () => {
      const totalWidth = container.clientWidth;
      if (!totalWidth || totalWidth <= 0) return;

      // 너비가 변경되지 않았으면 계산하지 않음 (무한 루프 방지)
      if (totalWidth === lastWidth) return;
      lastWidth = totalWidth;

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
    lastWidth = container.clientWidth;

    // 리사이즈 대응 (debounce 적용)
    const ro = new ResizeObserver((entries) => {
      // 이전 타이머 취소
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // debounce: 100ms 후에 실행
      timeoutId = setTimeout(() => {
        const entry = entries[0];
        if (entry) {
          const newWidth = entry.contentRect.width;
          // 너비만 확인 (높이 변화는 무시하여 무한 루프 방지)
          if (newWidth !== lastWidth && newWidth > 0) {
            calcColWidths();
          }
        }
      }, 100);
    });

    // width만 관찰하도록 설정 (height 변화는 무시)
    ro.observe(container);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      ro.disconnect();
    };
  }, [columnCount]);

  /**
   * 사이드바 상태에 따라 첫 번째 열에 blur 적용하는 함수
   */
  const applyBlurToFirstColumn = () => {
    if (!hotTableRef.current) return;

    // @ts-ignore
    const hotInstance = hotTableRef.current?.hotInstance || hotTableRef.current;
    if (!hotInstance) return;

    const container = hotInstance.rootElement;
    if (!container) return;

    // 사이드바 상태 확인
    const appRoot = document.querySelector('.app-root');
    const isOpen = appRoot?.classList.contains('sidebar-overlay-open') || false;

    // 고정 열 요소 찾기 (ht_clone_left, ht_clone_top_left)
    const fixedLeftElements = container.querySelectorAll('.ht_clone_left, .ht_clone_top_left');

    if (fixedLeftElements.length > 0) {
      // 고정 열이 있는 경우 - 고정 열에 blur 적용
      fixedLeftElements.forEach((element: Element) => {
        const htmlElement = element as HTMLElement;
        if (isOpen) {
          htmlElement.style.filter = 'blur(2px)';
          htmlElement.style.pointerEvents = 'none';
        } else {
          htmlElement.style.filter = '';
          htmlElement.style.pointerEvents = '';
        }
      });
    } else {
      // 고정 열이 없는 경우 - 첫 번째 열의 모든 셀 찾기
      // Handsontable의 구조: .htCore > table > tbody > tr > td:first-child
      const firstColumnCells = container.querySelectorAll(
        '.htCore tbody tr td:first-child, .htCore thead tr th:first-child, .ht_master tbody tr td:first-child, .ht_master thead tr th:first-child'
      );

      firstColumnCells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        if (isOpen) {
          htmlCell.style.filter = 'blur(2px)';
          htmlCell.style.pointerEvents = 'none';
        } else {
          htmlCell.style.filter = '';
          htmlCell.style.pointerEvents = '';
        }
      });
    }
  };

  /**
   * 사이드바 상태 변경 감지 및 blur 적용
   */
  useEffect(() => {
    // 사이드바 상태 변경 감지
    const checkSidebarState = () => {
      applyBlurToFirstColumn();
    };

    // MutationObserver로 클래스 변경 감지
    const observer = new MutationObserver(checkSidebarState);
    const appRoot = document.querySelector('.app-root');
    if (appRoot) {
      observer.observe(appRoot, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    // Handsontable이 업데이트될 때마다 확인
    const interval = setInterval(() => {
      applyBlurToFirstColumn();
    }, 200);

    // 초기 실행
    setTimeout(applyBlurToFirstColumn, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  /**
   * Handsontable 인스턴스 가져오기
   */
  const getHotInstance = (): Handsontable | null => {
    if (!hotTableRef.current) return null;
    // @ts-ignore - HotTable의 hotInstance는 런타임에 존재
    return (hotTableRef.current as any).hotInstance || hotTableRef.current;
  };

  /**
   * 외부에서 접근 가능한 메서드 노출
   */
  useImperativeHandle(ref, () => ({
    getHotInstance,
  }));

  // 테이블 높이 상태
  const [tableHeight, setTableHeight] = useState<number | undefined>(undefined);

  /**
   * 컨테이너 높이 감지 및 테이블 높이 업데이트
   */
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 모바일에서는 높이 계산 안 함
    if (isMobile) {
      setTableHeight(undefined);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const updateHeight = () => {
      if (!container) return;
      const height = container.clientHeight;
      // 패딩 등을 고려하여 약간의 여유를 둠 (선택 사항)
      // container padding이 8px이므로, 내부 높이는 clientHeight - 16px 정도가 될 수 있음
      // 하지만 box-sizing: border-box이고 padding이 있으므로 clientHeight를 그대로 쓰면 
      // Handsontable이 컨테이너 크기에 맞게 렌더링됨.
      // 다만, overflow: hidden이므로 정확한 높이가 필요함.
      // Handsontable은 부모의 높이를 100% 채우는 것보다 명시적 픽셀 높이를 선호함.

      // 컨테이너의 실제 콘텐츠 영역 높이 계산 (padding 제외)
      const computedStyle = window.getComputedStyle(container);
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);
      const contentHeight = height - paddingTop - paddingBottom;

      if (contentHeight > 0) {
        setTableHeight(contentHeight);
      }
    };

    // 초기 계산
    updateHeight();

    const ro = new ResizeObserver((entries) => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const entry = entries[0];
        if (entry) {
          updateHeight();
        }
      }, 100);
    });

    ro.observe(container);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      ro.disconnect();
    };
  }, [isMobile]); // isMobile 변경 시 재실행

  return (
    <div className="workshop-kpi-sheet-container" ref={containerRef}>
      <HotTable
        ref={hotTableRef}
        data={tableData}
        colHeaders={['', 'Benchmark', 'YTD', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
        rowHeaders={false}
        width="100%"
        height={isMobile ? undefined : (tableHeight ?? height)} // 계산된 높이 사용, 없으면 props height 사용
        readOnly={readOnly}
        licenseKey="non-commercial-and-evaluation"
        colWidths={colWidths}
        stretchH="none"
        mergeCells={mergeCells}
        rowHeights={rowHeights}
        cells={cellsCallback}
        afterInit={() => {
          // 초기화 후 blur 적용
          setTimeout(() => {
            applyBlurToFirstColumn();
          }, 200);
        }}
      />
    </div>
  );
});

WorkshopKpiSheet.displayName = 'WorkshopKpiSheet';

export default WorkshopKpiSheet;

