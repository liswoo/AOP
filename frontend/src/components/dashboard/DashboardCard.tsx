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
import '../../styles/dashboardCard.css';

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
        boxShadow: isHovered 
          ? '0 8px 24px rgba(139, 92, 246, 0.3)' // 다크 테마: 보라색 그림자
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: isHovered 
          ? '1px solid rgba(139, 92, 246, 0.4)' // 다크 테마: hover 시 보라색 테두리 강조
          : '1px solid rgba(139, 92, 246, 0.2)',
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
    backgroundColor: '#1e293b', // 다크 테마: 어두운 슬레이트 블루
    borderRadius: '12px',
    padding: '20px',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(139, 92, 246, 0.2)', // 보라색 테두리
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.2)', // 다크 테마용 경계선
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  categoryBadge: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', // 보라색-파란색 그라데이션
    color: '#ffffff',
    fontSize: '0.75rem',
    padding: '4px 8px',
    borderRadius: '6px',
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
    color: '#f1f5f9', // 다크 테마: 밝은 텍스트
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8', // 다크 테마: 회색 텍스트
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
    color: '#94a3b8',
    transition: 'color 0.2s ease, transform 0.2s ease',
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  footer: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
    fontSize: '0.8rem',
    color: '#64748b',
    textAlign: 'right',
  },
};

export default DashboardCard;

