/**
 * 대시보드 공통 카드 레이아웃 컴포넌트
 * 
 * LONGVIEW 스타일의 카드형 대시보드를 위한 공통 카드 컴포넌트입니다.
 * 
 * 기능:
 * - 카드 헤더: 카테고리 뱃지, 제목, 부제목
 * - 우측 아이콘: 말풍선(💬) 아이콘, 즐겨찾기(♥) 아이콘
 * - 본문: children으로 전달된 내용 렌더링
 * - 푸터: 기준일자 등 추가 정보 표시
 * 
 * 사용 예시:
 * <DashboardCard
 *   title="주요 손익"
 *   subtitle="단위: 억원, %"
 *   category="M"
 *   footerText="기준일자: 2025-11-01"
 *   onChatClick={() => setModalOpen(true)}
 * >
 *   <table>...</table>
 * </DashboardCard>
 */

import React, { useState } from 'react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  category?: string;
  showFavorite?: boolean;
  onChatClick?: () => void;
  footerText?: string;
  children: React.ReactNode;
  style?: React.CSSProperties; // react-grid-layout과 Chart.js 높이를 맞추기 위한 처리
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  category,
  showFavorite = true,
  onChatClick,
  footerText,
  children,
  style,
}) => {
  // 즐겨찾기 상태 관리 (로컬 state)
  const [isFavorite, setIsFavorite] = useState(false);
  // hover 상태 관리
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="dashboard-card"
      style={{
        ...styles.card,
        ...style, // react-grid-layout과 Chart.js 높이를 맞추기 위한 처리
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 2px 6px rgba(0, 0, 0, 0.06)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 카드 헤더 (드래그 핸들) */}
      <div className="dashboard-card-drag-handle" style={styles.header}>
        {/* 좌측: 카테고리 뱃지 + 제목 + 부제목 */}
        <div style={styles.headerLeft}>
          {category && (
            <span style={styles.categoryBadge}>{category}</span>
          )}
          <div style={styles.titleContainer}>
            <h3 style={styles.title}>{title}</h3>
            {subtitle && (
              <span style={styles.subtitle}>{subtitle}</span>
            )}
          </div>
        </div>

        {/* 우측: 아이콘 영역 */}
        <div style={styles.headerRight}>
          {/* 말풍선 아이콘 (AI 프롬프트 모달 열기) */}
          {onChatClick && (
            <button
              onClick={onChatClick}
              style={styles.iconButton}
              title="AI 분석 요청"
            >
              💬
            </button>
          )}
          {/* 즐겨찾기 아이콘 */}
          {showFavorite && (
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              style={{
                ...styles.iconButton,
                color: isFavorite ? '#ff6b6b' : '#999',
              }}
              title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              {isFavorite ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>

      {/* 카드 본문 (react-grid-layout과 Chart.js 높이를 맞추기 위한 처리) */}
      <div className="dashboard-card-body" style={styles.body}>
        {children}
      </div>

      {/* 카드 푸터 (기준일자 등) */}
      {footerText && (
        <div style={styles.footer}>
          {footerText}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    transition: 'box-shadow 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#f5f5f5',
    color: '#666',
    fontSize: '0.75rem',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: '600',
    minWidth: '24px',
    textAlign: 'center',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#666',
  },
  headerRight: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '4px 8px',
    color: '#999',
    transition: 'color 0.2s ease',
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  footer: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
    fontSize: '0.8rem',
    color: '#999',
    textAlign: 'right',
  },
};

export default DashboardCard;

