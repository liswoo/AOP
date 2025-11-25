/**
 * 프로필 드롭다운 컴포넌트
 * 
 * 헤더 우측에 표시되는 프로필 아바타와 드롭다운 메뉴를 제공합니다.
 * 
 * 기능:
 * - 사용자 이름의 첫 글자 이니셜을 표시하는 원형 아바타
 * - 아바타 클릭 시 드롭다운 메뉴 표시/숨김
 * - 메뉴 항목: "내 정보", "로그아웃"
 * 
 * 동작:
 * - 아바타 클릭 시 드롭다운 토글
 * - 외부 클릭 시 드롭다운 닫기
 * - "내 정보" 클릭 시 /profile로 이동
 * - "로그아웃" 클릭 시 로그아웃 처리
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProfileDropdownProps {
  username: string;
  onLogout: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  username,
  onLogout,
  theme = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  /**
   * 사용자 이름의 첫 글자 이니셜 추출
   * 
   * 한글/영문 모두 첫 글자를 반환합니다.
   */
  const getInitial = (name: string): string => {
    if (!name || name.length === 0) return 'U';
    return name.charAt(0).toUpperCase();
  };

  /**
   * 외부 클릭 감지하여 드롭다운 닫기
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * 내 정보 페이지로 이동
   */
  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  /**
   * 로그아웃 처리
   */
  const handleLogoutClick = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={styles.container}>
      {/* 프로필 아바타 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.avatarButton}
        aria-label="프로필 메뉴"
      >
        <div style={{
          ...styles.avatar,
          backgroundColor: theme === 'light' ? '#6366f1' : '#1f2937',
          border: theme === 'light' ? '1px solid #4f46e5' : '1px solid rgba(139, 92, 246, 0.3)',
        }}>
          {getInitial(username)}
        </div>
        <span style={{
          ...styles.usernameText,
          color: theme === 'light' ? '#374151' : '#cbd5e1',
        }}>{username}님</span>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div style={{
          ...styles.dropdown,
          backgroundColor: theme === 'light' ? '#ffffff' : '#020617',
          border: theme === 'light' ? '1px solid #e5e7eb' : '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: theme === 'light' ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}>
          <button
            onClick={handleProfileClick}
            style={{
              ...styles.menuItem,
              color: theme === 'light' ? '#374151' : '#cbd5e1',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : 'rgba(139, 92, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={styles.menuIcon}>👤</span>
            <span>내 정보</span>
          </button>
          <button
            onClick={handleLogoutClick}
            style={{
              ...styles.menuItem,
              color: theme === 'light' ? '#374151' : '#cbd5e1',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={styles.menuIcon}>🚪</span>
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
};

// 다크 테마 스타일
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  avatarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '9999px',
    backgroundColor: '#1f2937', // 살짝 밝은 배경
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
    border: '1px solid rgba(139, 92, 246, 0.3)',
  },
  usernameText: {
    color: '#cbd5e1', // 다크 테마 기본값 (라이트 테마에서는 동적으로 변경)
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: '#020617', // 다크 테마 기본값
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    minWidth: '160px',
    zIndex: 1000,
    overflow: 'hidden',
  },
  menuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: 'none',
    border: 'none',
    color: '#cbd5e1', // 다크 테마 기본값
    fontSize: '0.875rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s',
  },
  menuIcon: {
    fontSize: '1rem',
  },
};

export default ProfileDropdown;

