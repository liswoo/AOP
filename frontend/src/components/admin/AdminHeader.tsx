/**
 * 관리자 전용 헤더 컴포넌트
 * 
 * /admin 경로 하위 페이지들의 상단 헤더입니다.
 * 라이트 테마로 구성되어 있습니다.
 * 
 * 구조:
 * - 좌측: 햄버거 메뉴 버튼, "EIS Admin" 로고
 * - 우측: 관리자 이름, 프로필 드롭다운 (내 정보, 로그아웃)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import ProfileDropdown from '../ProfileDropdown';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  onOpenMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  /**
   * 햄버거 버튼 클릭 핸들러
   */
  const handleMenuClick = () => {
    const isMobile = window.innerWidth < 1200;
    if (isMobile && onOpenMobileSidebar) {
      onOpenMobileSidebar();
    } else if (!isMobile && onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        {/* 햄버거 메뉴 버튼 */}
        <button
          onClick={handleMenuClick}
          className="admin-menu-button"
          aria-label="메뉴 열기/닫기"
        >
          ☰
        </button>
        {/* 로고 */}
        <h1 className="admin-logo">EIS Admin</h1>
      </div>
      <div className="admin-header-right">
        {/* 프로필 드롭다운 (라이트 테마로 표시) */}
        <ProfileDropdown
          username={user.username}
          onLogout={handleLogout}
          theme="light"
        />
      </div>
    </header>
  );
};

export default AdminHeader;

