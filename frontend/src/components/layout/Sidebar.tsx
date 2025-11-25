/**
 * 좌측 사이드바 컴포넌트
 * 
 * 전체 앱의 좌측 네비게이션 메뉴를 제공합니다.
 * 
 * 기능:
 * - 데스크톱: 접었다 펼칠 수 있는 사이드바 (open 상태에 따라 width 변경)
 * - 모바일: 오버레이 형태로 표시되는 사이드바 (overlayOpen 상태)
 * - 현재 페이지 경로에 따라 활성 메뉴 강조
 * 
 * 동작:
 * - 넓은 화면(lg 이상): open=true일 때 width: 240px, open=false일 때 width: 64px
 * - 모바일(sm 이하): overlayOpen=true일 때만 표시, position: fixed
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

interface SidebarProps {
  open: boolean; // 데스크톱에서 펼침/접힘 상태
  overlayOpen: boolean; // 모바일에서 오버레이 상태
  onCloseOverlay: () => void; // 모바일 오버레이 닫기 핸들러
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  overlayOpen,
  onCloseOverlay,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  /**
   * 메뉴 아이템 정의
   * 
   * 각 메뉴는 경로, 아이콘, 텍스트를 포함합니다.
   * 
   * 참고: "내 정보"는 헤더의 프로필 드롭다운 메뉴로 이동되었습니다.
   */
  const menuItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: '대시보드',
      show: true, // 모든 사용자에게 표시
    },
    // "내 정보"는 헤더의 프로필 드롭다운으로 이동
    // {
    //   path: '/profile',
    //   icon: '👤',
    //   label: '내 정보',
    //   show: true,
    // },
  ];

  /**
   * 현재 경로가 메뉴 항목과 일치하는지 확인
   */
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className={`sidebar sidebar--desktop ${open ? 'sidebar--desktop-open' : 'sidebar--desktop-collapsed'}`}>
        {/* 로고/타이틀 영역 */}
        <div className="sidebar-header">
          {open && (
            <h2 className="sidebar-title">EIS 대시보드</h2>
          )}
          {!open && (
            <div className="sidebar-logo-icon">📊</div>
          )}
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="sidebar-nav">
          {menuItems
            .filter(item => item.show)
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'sidebar-item--active' : ''}`}
                title={!open ? item.label : undefined} // 접힌 상태일 때 tooltip
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {open && (
                  <span className="sidebar-item-label">{item.label}</span>
                )}
              </Link>
            ))}
        </nav>
      </aside>

      {/* 모바일 사이드바 (오버레이) */}
      <aside className={`sidebar sidebar--mobile ${overlayOpen ? 'sidebar--mobile-open' : ''}`}>
        {/* 모바일 헤더 (닫기 버튼 포함) */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">EIS 대시보드</h2>
          <button
            className="sidebar-close-button"
            onClick={onCloseOverlay}
            aria-label="사이드바 닫기"
          >
            ✕
          </button>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="sidebar-nav">
          {menuItems
            .filter(item => item.show)
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'sidebar-item--active' : ''}`}
                onClick={onCloseOverlay} // 모바일에서 메뉴 클릭 시 사이드바 닫기
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-label">{item.label}</span>
              </Link>
            ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

