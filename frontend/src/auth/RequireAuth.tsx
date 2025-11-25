/**
 * 인증이 필요한 라우트 보호 컴포넌트
 * 
 * 이 컴포넌트는 특정 라우트에 접근하기 전에 사용자가 로그인되어 있는지 확인합니다.
 * 필요시 특정 역할(예: ADMIN)만 접근할 수 있도록 제한할 수 있습니다.
 * 
 * 동작 방식:
 * 1. useAuth()로 현재 인증 상태를 확인합니다.
 * 2. 사용자가 로그인되어 있지 않으면 /login 페이지로 리다이렉트합니다.
 * 3. requiredRole이 지정되어 있고 사용자 역할이 일치하지 않으면 접근을 거부합니다.
 * 4. 사용자가 로그인되어 있고 권한이 있으면 children(보호하려는 컴포넌트)을 렌더링합니다.
 * 
 * 사용 방법:
 * // 일반 인증만 필요
 * <Route path="/profile" element={
 *   <RequireAuth>
 *     <ProfilePage />
 *   </RequireAuth>
 * } />
 * 
 * // ADMIN 역할 필요
 * <Route path="/admin/users" element={
 *   <RequireAuth requiredRole="ADMIN">
 *     <AdminUserListPage />
 *   </RequireAuth>
 * } />
 * 
 * React Router의 Navigate 컴포넌트:
 * - Navigate는 자동으로 다른 경로로 리다이렉트하는 컴포넌트입니다.
 * - to prop에 이동할 경로를 지정합니다.
 * - replace prop을 true로 설정하면 브라우저 히스토리에 현재 페이지를 남기지 않습니다.
 */

import React, { useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from '../types';

/**
 * RequireAuth 컴포넌트 Props 타입
 */
interface RequireAuthProps {
  children: React.ReactElement; // 보호하려는 컴포넌트 (하나의 React 요소)
  requiredRole?: UserRole; // 필요한 역할 (지정하지 않으면 로그인만 확인)
}

/**
 * RequireAuth 컴포넌트
 * 
 * 로그인이 필요한 페이지를 보호하는 컴포넌트입니다.
 * requiredRole이 지정되면 해당 역할만 접근할 수 있습니다.
 * 
 * @param children 보호하려는 컴포넌트
 * @param requiredRole 필요한 역할 (선택사항, 지정하지 않으면 로그인만 확인)
 * @returns 로그인되어 있고 권한이 있으면 children을 렌더링, 아니면 리다이렉트
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();
  // alert가 이미 표시되었는지 추적하는 ref
  // React StrictMode에서 컴포넌트가 두 번 렌더링되어도 alert는 한 번만 표시됩니다.
  const hasShownAlert = useRef(false);

  // 사용자 정보를 불러오는 중이면 로딩 메시지 표시
  // (이렇게 하지 않으면 로딩 중에도 /login으로 리다이렉트될 수 있음)
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#666',
      }}>
        로딩 중...
      </div>
    );
  }

  // 사용자가 로그인되어 있지 않으면 /login으로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // requiredRole이 지정되어 있고, 사용자 역할이 일치하지 않으면 접근 거부
  if (requiredRole && user.role !== requiredRole) {
    // useEffect를 사용하여 alert를 한 번만 표시
    // StrictMode에서 컴포넌트가 두 번 렌더링되어도 useEffect는 한 번만 실행됩니다.
    useEffect(() => {
      if (!hasShownAlert.current) {
        hasShownAlert.current = true;
        alert('접근 권한이 없습니다. 관리자만 접근할 수 있습니다.');
      }
    }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

    return <Navigate to="/login" replace />;
  }

  // 권한이 있는 경우 alert ref 초기화 (다른 페이지로 이동했다가 돌아올 수 있음)
  hasShownAlert.current = false;

  // 사용자가 로그인되어 있고 권한이 있으면 보호하려는 컴포넌트를 렌더링
  return children;
};

