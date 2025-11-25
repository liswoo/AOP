/**
 * 전체 앱의 기본 레이아웃 컴포넌트
 * 
 * 이 컴포넌트는 헤더, 좌측 사이드바, 메인 컨텐츠 영역을 포함하는 전체 앱의 레이아웃을 제공합니다.
 * 
 * 구조:
 * - 상단: Header (로고, 네비게이션, 로그인/로그아웃)
 * - 좌측: Sidebar (접었다 펼 수 있는 사이드바)
 * - 메인: React Router의 Outlet을 통해 각 페이지가 렌더링됨
 * 
 * 동작:
 * - 데스크톱: 사이드바를 접었다 펼칠 수 있음 (open 상태)
 * - 모바일: 사이드바를 오버레이로 표시 (overlayOpen 상태)
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/layout/Sidebar';
import '../styles/appLayout.css';

const AppLayout: React.FC = () => {
  // 데스크톱에서 사이드바 펼침/접힘 상태 관리
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // 모바일에서 사이드바 오버레이 표시 상태 관리
  const [sidebarOverlayOpen, setSidebarOverlayOpen] = useState(false);

  /**
   * 사이드바 토글 핸들러 (데스크톱용)
   * 
   * Header의 햄버거 버튼을 클릭하면 호출됩니다.
   * 사이드바를 접었다 펼칠 수 있습니다.
   */
  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  /**
   * 모바일 사이드바 열기 핸들러
   * 
   * 모바일 환경에서 Header의 햄버거 버튼을 클릭하면 호출됩니다.
   * 사이드바를 오버레이로 표시합니다.
   */
  const handleOpenMobileSidebar = () => {
    setSidebarOverlayOpen(true);
  };

  /**
   * 모바일 사이드바 닫기 핸들러
   * 
   * 오버레이 배경을 클릭하거나 사이드바 내부의 닫기 버튼을 클릭하면 호출됩니다.
   */
  const handleCloseOverlay = () => {
    setSidebarOverlayOpen(false);
  };

  return (
    <div className="app-root">
      {/* 상단 헤더 */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        onOpenMobileSidebar={handleOpenMobileSidebar}
      />

      {/* 메인 레이아웃 (사이드바 + 컨텐츠) */}
      <div className="app-body">
        {/* 좌측 사이드바 */}
        <Sidebar
          open={sidebarOpen}
          overlayOpen={sidebarOverlayOpen}
          onCloseOverlay={handleCloseOverlay}
        />

        {/* 모바일 오버레이 배경 (사이드바 뒤 어두운 배경) */}
        {sidebarOverlayOpen && (
          <div
            className="sidebar-backdrop"
            onClick={handleCloseOverlay}
            aria-hidden="true"
          />
        )}

        {/* 메인 컨텐츠 영역 (React Router의 Outlet을 통해 각 페이지가 렌더링됨) */}
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

