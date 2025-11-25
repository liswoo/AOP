/**
 * 관리자 전용 레이아웃 컴포넌트
 * 
 * /admin 경로 하위의 관리자 페이지들을 위한 전용 레이아웃입니다.
 * 
 * 특징:
 * - 라이트 테마 (화이트/연한 회색 배경)
 * - 관리자 전용 사이드바 (사용자 관리 등)
 * - 일반 사용자 레이아웃(AppLayout)과 완전히 분리
 * 
 * 구조:
 * - 상단: AdminHeader (로고, 관리자 이름, 로그아웃)
 * - 좌측: AdminSidebar (관리자 메뉴)
 * - 메인: React Router의 Outlet을 통해 각 관리자 페이지가 렌더링됨
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import '../styles/adminLayout.css';

const AdminLayout: React.FC = () => {
  // 데스크톱에서 사이드바 펼침/접힘 상태 관리
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // 모바일에서 사이드바 오버레이 표시 상태 관리
  const [sidebarOverlayOpen, setSidebarOverlayOpen] = useState(false);

  /**
   * 사이드바 토글 핸들러 (데스크톱용)
   */
  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  /**
   * 모바일 사이드바 열기 핸들러
   */
  const handleOpenMobileSidebar = () => {
    setSidebarOverlayOpen(true);
  };

  /**
   * 모바일 사이드바 닫기 핸들러
   */
  const handleCloseOverlay = () => {
    setSidebarOverlayOpen(false);
  };

  return (
    <div className="admin-root">
      {/* 상단 헤더 */}
      <AdminHeader
        onToggleSidebar={handleToggleSidebar}
        onOpenMobileSidebar={handleOpenMobileSidebar}
      />

      {/* 메인 레이아웃 (사이드바 + 컨텐츠) */}
      <div className="admin-body">
        {/* 좌측 사이드바 */}
        <AdminSidebar
          open={sidebarOpen}
          overlayOpen={sidebarOverlayOpen}
          onCloseOverlay={handleCloseOverlay}
        />

        {/* 모바일 오버레이 배경 */}
        {sidebarOverlayOpen && (
          <div
            className="admin-sidebar-backdrop"
            onClick={handleCloseOverlay}
            aria-hidden="true"
          />
        )}

        {/* 메인 컨텐츠 영역 */}
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

