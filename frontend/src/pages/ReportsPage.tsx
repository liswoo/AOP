/**
 * Reports 페이지
 * 
 * Workshop KPI Report를 표시하는 페이지입니다.
 * Handsontable 기반의 엑셀 스타일 시트를 렌더링합니다.
 */

import React from 'react';
import WorkshopKpiSheet from '../components/report/WorkshopKpiSheet';
import './ReportsPage.css';

/**
 * ReportsPage 컴포넌트
 */
const ReportsPage: React.FC = () => {
  // Period 텍스트 생성 (현재는 하드코딩, 향후 날짜 선택 기능 추가 예정)
  const periodText = 'Period : 2025-10 (All Dealer)';

  return (
    <div className="reports-page">
      <div className="reports-page-header">
        <h1 className="reports-page-title">Workshop KPI Report</h1>
        <p className="reports-page-subtitle">Workshop KPI - Total</p>
      </div>

      <div className="reports-page-content">
        <div className="reports-card">
          <WorkshopKpiSheet
            periodText={periodText}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
