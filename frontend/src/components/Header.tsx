/**
 * 공통 헤더 컴포넌트
 * 
 * 모든 페이지 상단에 표시되는 공통 헤더입니다.
 * 로그인한 사용자의 이름과 로그아웃 버튼을 표시합니다.
 * 
 * ADMIN 계정으로 로그인했을 때는 "사용자 관리" 링크도 함께 표시합니다.
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import '../styles/header.css';

interface HeaderProps {
  onToggleSidebar?: () => void; // 데스크톱 사이드바 토글 핸들러
  onOpenMobileSidebar?: () => void; // 모바일 사이드바 열기 핸들러
}

/**
 * Header 컴포넌트
 * 
 * 상단 헤더를 렌더링합니다.
 * - 좌측: 햄버거 아이콘 버튼 (사이드바 토글)
 * - 중앙: 로고/타이틀 (AppLayout으로 이동하여 제거 가능)
 * - 우측: 로그인한 사용자 이름, 로그아웃 버튼
 * 
 * 동작:
 * - 데스크톱: 햄버거 버튼 클릭 시 onToggleSidebar 호출
 * - 모바일: 햄버거 버튼 클릭 시 onOpenMobileSidebar 호출
 */
const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement | null>(null);

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

  /**
   * 햄버거 버튼 클릭 핸들러
   * 
   * 화면 크기에 따라 데스크톱 또는 모바일 핸들러를 호출합니다.
   */
  const handleMenuClick = () => {
    // 모바일 환경 감지 (간단한 방법)
    const isMobile = window.innerWidth < 1200;
    if (isMobile && onOpenMobileSidebar) {
      onOpenMobileSidebar();
    } else if (!isMobile && onToggleSidebar) {
      onToggleSidebar();
    }
  };

  /**
   * 헤더 디버깅: 헤더의 position과 스크롤 상태 확인
   */
  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) return;

    const isMobile = window.innerWidth < 1200;
    const computedStyle = window.getComputedStyle(headerElement);

    // 초기 상태 로그
    console.log('🔍 [Header] 초기 상태:', {
      isMobile,
      windowWidth: window.innerWidth,
      headerPosition: computedStyle.position,
      headerTop: computedStyle.top,
      headerZIndex: computedStyle.zIndex,
      headerRect: headerElement.getBoundingClientRect(),
    });

    // 스크롤 이벤트 핸들러
    const handleScroll = () => {
      const rect = headerElement.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      
      console.log('📜 [Header] 스크롤 이벤트:', {
        scrollY,
        headerTop: rect.top,
        headerBottom: rect.bottom,
        headerHeight: rect.height,
        headerPosition: computedStyle.position,
        isSticky: computedStyle.position === 'sticky',
        isFixed: computedStyle.position === 'fixed',
      });
    };

    // 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 리사이즈 이벤트 핸들러
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 1200;
      const newComputedStyle = window.getComputedStyle(headerElement);
      
      console.log('📐 [Header] 리사이즈 이벤트:', {
        isMobile: newIsMobile,
        windowWidth: window.innerWidth,
        headerPosition: newComputedStyle.position,
        headerTop: newComputedStyle.top,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <header ref={headerRef} style={styles.header}>
      <div style={styles.leftSection}>
        {/* 햄버거 메뉴 버튼 (사이드바 토글) */}
        <button
          onClick={handleMenuClick}
          style={styles.menuButton}
          aria-label="메뉴 열기/닫기"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ☰
        </button>
        {/* AOP 로고 */}
        <div style={styles.logo}>
          <span style={styles.logoText}>AOP</span>
          <span style={styles.logoSubtext}>Always On Platform</span>
        </div>
      </div>
      <div style={styles.rightSection}>
        {/* 프로필 아바타 + 드롭다운 메뉴 (내 정보, 로그아웃) */}
        <ProfileDropdown
          username={user.username}
          onLogout={handleLogout}
        />
      </div>
    </header>
  );
};

// 다크 테마 스타일
const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1e293b', // 다크 테마: 어두운 슬레이트 블루
    borderBottom: '1px solid rgba(139, 92, 246, 0.2)', // 보라색 테두리
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    flexShrink: 0, // 모바일에서 Header가 축소되지 않도록
    width: '100%', // 전체 너비 사용
    boxSizing: 'border-box', // padding 포함
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    marginLeft: '0.5rem',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#8b5cf6', // 보라색 (purple-500)
    letterSpacing: '0.05em',
    lineHeight: 1,
  },
  logoSubtext: {
    fontSize: '0.65rem',
    color: '#94a3b8', // 슬레이트 그레이 (slate-400)
    letterSpacing: '0.02em',
    lineHeight: 1,
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#cbd5e1',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'background-color 0.2s, color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
  },
  // 링크 hover 효과는 CSS에서 처리 (인라인 스타일로는 :hover 불가)
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
};

export default Header;

