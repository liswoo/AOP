/**
 * 라우터 설정
 * 
 * 이 파일은 React Router v6를 사용하여 애플리케이션의 라우팅을 설정합니다.
 * 
 * 라우트 구성:
 * - /login → LoginPage (로그인 페이지, 인증 불필요)
 * - /dashboard → UserDashboardPage (일반 사용자 대시보드, 인증 필요, 역할 상관 없음)
 * - /profile → ProfilePage (내 정보 페이지, 인증 필요, 역할 상관 없음)
 * - /admin/users → AdminUserListPage (관리자 사용자 관리 페이지, ADMIN 역할 필요)
 * 
 * RequireAuth 컴포넌트:
 * - /dashboard 경로는 RequireAuth로 감싸져 있어서,
 *   로그인하지 않은 사용자가 접근하면 자동으로 /login으로 리다이렉트됩니다.
 *   requiredRole을 지정하지 않았으므로 어떤 역할이든 로그인만 되어 있으면 접근 가능합니다.
 * - /admin/users 경로는 RequireAuth로 감싸져 있고 requiredRole="ADMIN"이 지정되어 있어서,
 *   ADMIN 역할이 아닌 사용자가 접근하면 자동으로 /login으로 리다이렉트됩니다.
 * 
 * React Router v6 주요 개념:
 * - BrowserRouter: HTML5 History API를 사용하여 URL을 관리
 * - Routes: 여러 Route를 그룹화
 * - Route: 특정 경로와 컴포넌트를 연결
 * - Navigate: 자동 리다이렉트 (기본 경로 "/"를 "/login"으로 리다이렉트)
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { RequireAuth } from '../auth/RequireAuth';
import AppLayout from '../layout/AppLayout';
import AdminLayout from '../layout/AdminLayout';
import LoginPage from '../pages/LoginPage';
import AdminUserListPage from '../pages/AdminUserListPage';
import UserDashboardPage from '../pages/UserDashboardPage';
import ProfilePage from '../pages/ProfilePage';

/**
 * AppRouter 컴포넌트
 * 
 * 애플리케이션의 라우팅을 설정하고, AuthProvider로 전체 앱을 감쌉니다.
 * 
 * 구조:
 * - AuthProvider: 인증 상태를 전역으로 제공
 *   - BrowserRouter: 라우팅 기능 제공
 *     - Routes: 라우트 그룹
 *       - Route: 개별 라우트 정의
 * 
 * 레이아웃 구조:
 * - /login: AppLayout 없이 독립적으로 렌더링
 * - 나머지 인증 필요 페이지: AppLayout 안에서 렌더링 (헤더 + 사이드바 + 메인 컨텐츠)
 */
const AppRouter: React.FC = () => {
  console.log('AppRouter 렌더링 시작');
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 기본 경로 "/"는 "/login"으로 리다이렉트 */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 로그인 페이지 (인증 불필요, AppLayout 없이 독립적으로 렌더링) */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* 일반 사용자 페이지들은 AppLayout 안에서 렌더링 (다크 테마) */}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            {/* 대시보드 페이지 (인증 필요, 역할 상관 없음) */}
            <Route
              path="/dashboard"
              element={<UserDashboardPage />}
            />
            
            {/* 내 정보 페이지 (인증 필요, 역할 상관 없음) */}
            <Route
              path="/profile"
              element={<ProfilePage />}
            />
          </Route>

          {/* 관리자 페이지들은 AdminLayout 안에서 렌더링 (라이트 테마) */}
          <Route
            element={
              <RequireAuth requiredRole="ADMIN">
                <AdminLayout />
              </RequireAuth>
            }
          >
            {/* 사용자 목록 페이지 (ADMIN 역할 필요) */}
            <Route
              path="/admin/users"
              element={<AdminUserListPage />}
            />
          </Route>
          
          {/* 정의되지 않은 경로는 "/login"으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;

