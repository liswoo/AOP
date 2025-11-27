/**
 * ReportSheet 컴포넌트
 * 
 * Handsontable 기반 Excel 스타일 시트 컴포넌트
 * 
 * 기능:
 * - 셀 직접 편집
 * - 드래그 복사
 * - 필터/정렬
 * - 우클릭 컨텍스트 메뉴
 * - 복사/붙여넣기
 * - 고정 행/열
 * - 컬럼 리사이즈
 */

import React, { useRef, useEffect, useMemo } from 'react';
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react';
import type { CellProperties } from 'handsontable/settings';
// Handsontable CSS import (v16.2.0에서는 여전히 필요)
// 경고: v17.0에서 제거될 예정이지만, 현재 버전(16.2.0)에서는 정상 작동을 위해 필요
// v17.0 업그레이드 시 새로운 테마 시스템으로 전환 예정
import 'handsontable/dist/handsontable.full.css';

/**
 * Workshop KPI 시트 데이터 행 타입
 */
export interface ReportSheetRow {
  section: string;        // Operations, Quality, Financials
  item: string;           // 지표명
  benchmark?: number;     // Benchmark 값
  ytd?: number;          // Year-to-Date 값
  jan?: number;
  feb?: number;
  mar?: number;
  apr?: number;
  may?: number;
  jun?: number;
  jul?: number;
  aug?: number;
  sep?: number;
  oct?: number;
  nov?: number;
  dec?: number;
}

/**
 * ReportSheet Props
 */
interface ReportSheetProps {
  data: ReportSheetRow[];
  onDataChange?: (data: ReportSheetRow[]) => void;
  fixedRowsTop?: number;
  fixedColumnsLeft?: number;
  height?: number;
}

/**
 * ReportSheet 컴포넌트
 */
const ReportSheet: React.FC<ReportSheetProps> = ({
  data,
  onDataChange,
  fixedRowsTop = 1,
  fixedColumnsLeft = 0,
  height = 600,
  periodText = '',
}) => {
  const hotTableRef = useRef<HotTable | null>(null);

  // 데이터 안전성 검사
  const safeData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data.filter(row => row && typeof row === 'object');
  }, [data]);

  /**
   * Handsontable 설정
   */
  const hotSettings = useMemo(() => {
    // 빈 데이터 처리
    if (!data || data.length === 0) {
      return {
        data: [],
        colHeaders: ['Section', 'Item', 'Benchmark', 'YTD', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        rowHeaders: true,
        width: '100%',
        height: height,
        licenseKey: 'non-commercial-and-evaluation',
        colWidths: [120, 300, 100, 100, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80],
      };
    }

    // Period 행 추가 (첫 번째 행)
    const periodRow = [
      periodText || `Period: ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')} (All Dealer)`,
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ];

    // Section별로 그룹화된 데이터 준비
    // Section별로 헤더 행을 추가하고, 각 Section의 첫 번째 행에 Section 이름 표시
    const rowData: unknown[][] = [periodRow];
    
    let currentSection = '';
    safeData.forEach((row, index) => {
      const sectionValue = row.section || '';
      
      // 새로운 Section이 시작되면 헤더 행 추가
      if (sectionValue && sectionValue !== currentSection) {
        currentSection = sectionValue;
        // Section 헤더 행 추가 (Section 이름이 모든 컬럼에 병합된 것처럼 보이게)
        const sectionHeaderRow: unknown[] = [
          sectionValue, // Section 이름
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        rowData.push(sectionHeaderRow);
      }
      
      // 실제 데이터 행 추가
      rowData.push([
        '', // Section 컬럼은 빈 문자열 (헤더 행에만 표시)
        row.item || '',
        row.benchmark ?? '',
        row.ytd ?? '',
        row.jan ?? '',
        row.feb ?? '',
        row.mar ?? '',
        row.apr ?? '',
        row.may ?? '',
        row.jun ?? '',
        row.jul ?? '',
        row.aug ?? '',
        row.sep ?? '',
        row.oct ?? '',
        row.nov ?? '',
        row.dec ?? '',
      ]);
    });

    return {
      data: rowData,
      colHeaders: ['Section', 'Item', 'Benchmark', 'YTD', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      rowHeaders: true,
      width: '100%',
      height: height,
      fixedRowsTop: fixedRowsTop,
      fixedColumnsLeft: fixedColumnsLeft > 0 ? 2 : 0, // Section과 Item 컬럼 고정
      columnSorting: true,
      filters: true,
      contextMenu: true,
      manualColumnResize: true,
      manualRowResize: true,
      copyPaste: true,
      stretchH: 'none' as const,
      colWidths: [120, 350, 100, 100, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80], // Item 컬럼을 넓게
      licenseKey: 'non-commercial-and-evaluation',
      cells: (row: number, col: number): CellProperties => {
        try {
          const cellProperties: CellProperties = {};
          if (row < 0 || row >= rowData.length) return cellProperties;
          const currentRow = rowData[row] as unknown[];
          if (!currentRow) return cellProperties;
          
          // Period 행 (row 0) - 빨간색 배경
          if (row === 0) {
            if (col === 0) {
              cellProperties.renderer = (_instance: Handsontable, td: HTMLTableCellElement, _rowIdx: number, _colIdx: number, _prop: string | number, value: unknown) => {
                td.textContent = String(value || '');
                td.style.fontWeight = 'bold';
                td.style.fontSize = '14px';
                td.style.color = '#ffffff';
                td.style.backgroundColor = '#dc2626'; // 빨간색 배경
                td.style.borderBottom = '3px solid #ef4444';
                td.style.padding = '10px 12px';
                td.style.textAlign = 'left';
                td.colSpan = 16; // 모든 컬럼 병합
              };
            } else {
              // Period 행의 나머지 컬럼은 숨김
              cellProperties.renderer = (_instance: Handsontable, td: HTMLTableCellElement) => {
                td.style.display = 'none';
              };
            }
            return cellProperties;
          }
          
          // Section 헤더 행 처리 (Section 이름이 있는 행)
          const sectionValue = String(currentRow[0] || '');
          const isSectionHeader = sectionValue && sectionValue !== '' && String(currentRow[1] || '') === '';
          
          // Section 컬럼 (col 0)
          if (col === 0) {
            cellProperties.renderer = (_instance: Handsontable, td: HTMLTableCellElement, _rowIdx: number, _colIdx: number, _prop: string | number, value: unknown) => {
              try {
                const val = String(value || '');
                if (isSectionHeader) {
                  // Section 헤더 셀 - 빨간색 강조, 모든 컬럼 병합
                  td.textContent = val;
                  td.style.fontWeight = 'bold';
                  td.style.fontSize = '14px';
                  td.style.color = '#ffffff';
                  td.style.backgroundColor = '#dc2626'; // 빨간색 배경
                  td.style.borderTop = '2px solid #ef4444';
                  td.style.borderBottom = '2px solid #ef4444';
                  td.style.borderLeft = '3px solid #ef4444';
                  td.style.padding = '10px 12px';
                  td.style.textAlign = 'left';
                  td.colSpan = 16; // 모든 컬럼 병합
                } else {
                  // 빈 셀
                  td.textContent = '';
                  td.style.backgroundColor = '#1e293b';
                  td.style.borderLeft = 'none';
                }
              } catch (error) {
                console.error('Section renderer error:', error);
                td.textContent = String(value || '');
              }
            };
          } else if (isSectionHeader) {
            // Section 헤더 행의 나머지 컬럼은 숨김
            cellProperties.renderer = (_instance: Handsontable, td: HTMLTableCellElement) => {
              td.style.display = 'none';
            };
          }
          
          // Item 컬럼 (col 1) - Section 헤더 행이 아닌 경우만
          if (col === 1 && !isSectionHeader) {
            cellProperties.renderer = (_instance: Handsontable, td: HTMLTableCellElement, _rowIdx: number, _colIdx: number, _prop: string | number, value: unknown) => {
              try {
                td.textContent = String(value || '');
                td.style.fontWeight = '500';
                td.style.fontSize = '13px';
                td.style.color = '#f1f5f9'; // 밝은 회색으로 변경
                td.style.backgroundColor = '#1e293b';
                td.style.padding = '8px 12px';
                td.style.whiteSpace = 'normal'; // 텍스트 줄바꿈 허용
                td.style.wordWrap = 'break-word';
              } catch (error) {
                console.error('Item renderer error:', error);
                td.textContent = String(value || '');
              }
            };
          }
          
          // 숫자 컬럼 (Benchmark, YTD, 월별) - col 2부터, Section 헤더 행이 아닌 경우만
          if (col >= 2 && !isSectionHeader) {
            // 실제 데이터 행 찾기 (Period 행과 Section 헤더 행 제외)
            const dataRowIndex = row - 1; // Period 행 제외
            let actualDataIndex = -1;
            let sectionHeaderCount = 0;
            for (let i = 1; i < row; i++) {
              const checkRow = rowData[i] as unknown[];
              if (checkRow && String(checkRow[0] || '') && String(checkRow[1] || '') === '') {
                sectionHeaderCount++;
              }
            }
            actualDataIndex = dataRowIndex - sectionHeaderCount;
            const actualRowData = actualDataIndex >= 0 && actualDataIndex < safeData.length ? safeData[actualDataIndex] : null;
            
            // type을 제거하고 커스텀 렌더러만 사용
            cellProperties.renderer = (_instance: Handsontable, td: HTMLTableCellElement, _rowIdx: number, _colIdx: number, _prop: string | number, value: unknown, _cellProps: CellProperties) => {
              try {
                if (value === null || value === undefined || value === '') {
                  td.textContent = '';
                  td.style.textAlign = 'right';
                  return;
                }
                
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                if (isNaN(numValue)) {
                  td.textContent = '';
                  td.style.textAlign = 'right';
                  return;
                }
                
                // 숫자 포맷팅
                td.textContent = numValue.toLocaleString('en-US', { 
                  minimumFractionDigits: 1, 
                  maximumFractionDigits: 1 
                });
                td.style.textAlign = 'right';
                td.style.fontSize = '13px';
                td.style.fontWeight = '500';
                td.style.backgroundColor = '#1e293b';
                td.style.padding = '8px 12px';
                
                // Variance% 컬럼 스타일링 (Item에 "Variance%"가 포함된 경우)
                if (actualRowData && actualRowData.item && String(actualRowData.item).includes('Variance%')) {
                  if (numValue > 0) {
                    td.style.color = '#3b82f6'; // 파란색 (양수) - 더 진하게
                    td.style.fontWeight = '600';
                  } else if (numValue < 0) {
                    td.style.color = '#ef4444'; // 빨간색 (음수) - 더 진하게
                    td.style.fontWeight = '600';
                  } else {
                    td.style.color = '#f1f5f9';
                  }
                } else {
                  // 일반 숫자는 흰색
                  td.style.color = '#f1f5f9';
                }
              } catch (error) {
                console.error('Numeric renderer error:', error);
                td.textContent = String(value || '');
                td.style.textAlign = 'right';
              }
            };
          }
          
          return cellProperties;
        } catch (error) {
          console.error('Cells function error:', error);
          return {} as CellProperties;
        }
      },
      afterChange: (changes: Handsontable.CellChange[] | null, source: string): void => {
        if (!changes || source === 'loadData') return;
        
        if (hotTableRef.current && onDataChange) {
          // @ts-ignore - HotTable의 hotInstance는 런타임에 존재
          const hotInstance: Handsontable = (hotTableRef.current as any).hotInstance || hotTableRef.current;
          const newData: ReportSheetRow[] = [];
          const dataArray = hotInstance.getData() as unknown[][];
          
          let lastSection = '';
          dataArray.forEach((row: unknown[]) => {
            const parseNumber = (val: unknown): number | undefined => {
              if (val === null || val === undefined || val === '') return undefined;
              const num = typeof val === 'number' ? val : parseFloat(String(val));
              return isNaN(num) ? undefined : num;
            };
            
            // Section이 빈 문자열이면 이전 Section 값 사용
            const sectionValue = typeof row[0] === 'string' ? row[0] : String(row[0] || '');
            const currentSection = sectionValue || lastSection;
            if (sectionValue) {
              lastSection = sectionValue;
            }
            
            newData.push({
              section: currentSection,
              item: typeof row[1] === 'string' ? row[1] : String(row[1] || ''),
              benchmark: parseNumber(row[2]),
              ytd: parseNumber(row[3]),
              jan: parseNumber(row[4]),
              feb: parseNumber(row[5]),
              mar: parseNumber(row[6]),
              apr: parseNumber(row[7]),
              may: parseNumber(row[8]),
              jun: parseNumber(row[9]),
              jul: parseNumber(row[10]),
              aug: parseNumber(row[11]),
              sep: parseNumber(row[12]),
              oct: parseNumber(row[13]),
              nov: parseNumber(row[14]),
              dec: parseNumber(row[15]),
            });
          });
          
          onDataChange(newData);
        }
      },
      afterInit: (): void => {
        // 초기화 후 스타일 적용 및 셀 병합
        if (hotTableRef.current) {
          // @ts-ignore - HotTable의 hotInstance는 런타임에 존재
          const hotInstance: Handsontable = hotTableRef.current.hotInstance || hotTableRef.current;
          const container = hotInstance.rootElement;
          if (container) {
            container.classList.add('handsontable-dark');
          }
          
          // Period 행 병합 (row 0, col 0부터 15까지)
          try {
            hotInstance.setCellMeta(0, 0, 'colspan', 16);
          } catch (error) {
            console.error('Period row merge error:', error);
          }
          
          // Section 헤더 행 병합
          for (let row = 1; row < rowData.length; row++) {
            const checkRow = rowData[row] as unknown[];
            if (checkRow && String(checkRow[0] || '') && String(checkRow[1] || '') === '') {
              try {
                hotInstance.setCellMeta(row, 0, 'colspan', 16);
              } catch (error) {
                console.error('Section header merge error:', error);
              }
            }
          }
        }
      },
    };
  }, [safeData, fixedRowsTop, fixedColumnsLeft, height, onDataChange]);

  /**
   * Handsontable 인스턴스 참조 설정
   */
  useEffect(() => {
    if (hotTableRef.current) {
      // @ts-ignore - HotTable의 hotInstance는 런타임에 존재
      const hotInstance: Handsontable = (hotTableRef.current as any).hotInstance || hotTableRef.current;
      const container = hotInstance.rootElement;
      if (container) {
        container.classList.add('handsontable-dark');
      }
    }
  }, [safeData]);

  return (
    <div className="report-sheet-container">
      <HotTable
        ref={hotTableRef}
        settings={hotSettings}
        licenseKey="non-commercial-and-evaluation"
        afterInit={() => {
          // 초기화 완료 후 스타일 적용
          try {
            if (hotTableRef.current) {
              // @ts-ignore - HotTable의 hotInstance는 런타임에 존재
              const hotInstance: Handsontable = hotTableRef.current.hotInstance || hotTableRef.current;
              const container = hotInstance.rootElement;
              if (container) {
                container.classList.add('handsontable-dark');
              }
            }
          } catch (error) {
            console.error('Handsontable 초기화 오류:', error);
          }
        }}
      />
    </div>
  );
};

export default ReportSheet;

