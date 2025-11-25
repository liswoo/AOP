/**
 * 공통 헤더 컴포넌트
 * 
 * 모든 페이지 상단에 표시되는 공통 헤더입니다.
 * 로그인한 사용자의 이름과 로그아웃 버튼을 표시합니다.
 * 
 * ADMIN 계정으로 로그인했을 때는 "사용자 관리" 링크도 함께 표시합니다.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Header 컴포넌트
 * 
 * 상단 헤더를 렌더링합니다.
 * - 로그인한 사용자 이름 표시
 * - ADMIN 계정인 경우 "사용자 관리" 링크 표시
 * - 로그아웃 버튼
 */
const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * 로그아웃 핸들러
   * 
   * AuthContext의 logout() 함수를 호출하여
   * 상태와 localStorage를 초기화하고 로그인 페이지로 이동합니다.
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    // 로그인하지 않은 경우 헤더를 표시하지 않음
    return null;
  }

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <h1 style={styles.logo}>EIS 대시보드</h1>
        {/* ADMIN 계정인 경우 "사용자 관리" 링크 표시 */}
        {user.role === 'ADMIN' && (
          <Link to="/admin/users" style={styles.link}>
            사용자 관리
          </Link>
        )}
        <Link to="/dashboard" style={styles.link}>
          대시보드
        </Link>
      </div>
      <div style={styles.rightSection}>
        <span style={styles.userName}>안녕하세요, {user.username}님</span>
        <button onClick={handleLogout} style={styles.logoutButton}>
          로그아웃
        </button>
      </div>
    </header>
  );
};

// 간단한 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#fff',
    borderBottom: '2px solid #eee',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  logo: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333',
    fontWeight: '600',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userName: {
    color: '#666',
    fontSize: '1rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default Header;

