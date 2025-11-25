/**
 * 관리자 전용 사이드바 컴포넌트
 * 
 * /admin 경로 하위 페이지들의 좌측 네비게이션 메뉴입니다.
 * 관리자 전용 메뉴만 표시합니다.
 * 
 * 메뉴 항목:
 * - 사용자 관리 (/admin/users)
 * - 향후 추가될 관리자 메뉴들
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
  open: boolean; // 데스크톱에서 펼침/접힘 상태
  overlayOpen: boolean; // 모바일에서 오버레이 상태
  onCloseOverlay: () => void; // 모바일 오버레이 닫기 핸들러
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  open,
  overlayOpen,
  onCloseOverlay,
}) => {
  const location = useLocation();

  /**
   * 관리자 메뉴 아이템 정의
   */
  const menuItems = [
    {
      path: '/admin/users',
      icon: '👥',
      label: '사용자 관리',
    },
    // 향후 추가될 관리자 메뉴들
    // {
    //   path: '/admin/permissions',
    //   icon: '🔐',
    //   label: '권한 관리',
    // },
    // {
    //   path: '/admin/settings',
    //   icon: '⚙️',
    //   label: '시스템 설정',
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
      <aside className={`admin-sidebar admin-sidebar--desktop ${open ? 'admin-sidebar--desktop-open' : 'admin-sidebar--desktop-collapsed'}`}>
        {/* 로고/타이틀 영역 */}
        <div className="admin-sidebar-header">
          {open && (
            <h2 className="admin-sidebar-title">관리자</h2>
          )}
          {!open && (
            <div className="admin-sidebar-logo-icon">⚙️</div>
          )}
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-sidebar-item ${isActive(item.path) ? 'admin-sidebar-item--active' : ''}`}
              title={!open ? item.label : undefined}
            >
              <span className="admin-sidebar-item-icon">{item.icon}</span>
              {open && (
                <span className="admin-sidebar-item-label">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 모바일 사이드바 (오버레이) */}
      <aside className={`admin-sidebar admin-sidebar--mobile ${overlayOpen ? 'admin-sidebar--mobile-open' : ''}`}>
        {/* 모바일 헤더 */}
        <div className="admin-sidebar-header">
          <h2 className="admin-sidebar-title">관리자</h2>
          <button
            className="admin-sidebar-close-button"
            onClick={onCloseOverlay}
            aria-label="사이드바 닫기"
          >
            ✕
          </button>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-sidebar-item ${isActive(item.path) ? 'admin-sidebar-item--active' : ''}`}
              onClick={onCloseOverlay}
            >
              <span className="admin-sidebar-item-icon">{item.icon}</span>
              <span className="admin-sidebar-item-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;

