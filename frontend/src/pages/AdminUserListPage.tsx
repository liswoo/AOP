/**
 * 어드민 사용자 목록 페이지
 * 
 * 사용 방법:
 * 1. /login에서 admin / admin1234 로 로그인
 * 2. /admin/users에서 사용자 목록 확인 및 생성
 * 
 * 이 페이지는 사용자 목록을 조회하고, 새 사용자를 생성할 수 있는 기능을 제공합니다.
 * AdminUserTable과 AdminUserCreateForm 컴포넌트를 사용합니다.
 */

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getUsers, createUser } from '../api/adminUserApi';
import { Page, UserSummary, UserCreateRequest } from '../types';
import AdminUserTable from '../components/AdminUserTable';
import AdminUserCreateForm from '../components/AdminUserCreateForm';

/**
 * AdminUserListPage 컴포넌트
 * 
 * 사용자 목록을 조회하고 표시하며, 새 사용자를 생성할 수 있는 페이지입니다.
 */
const AdminUserListPage: React.FC = () => {
  // AuthContext에서 user와 logout 함수 가져오기
  const { user, logout } = useAuth();
  
  // 상태 관리
  const [userPage, setUserPage] = useState<Page<UserSummary> | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize] = useState<number>(20);
  const [keyword, setKeyword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // 성공/실패 메시지 (AdminUserTable에서 사용)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // 메시지 자동 제거를 위한 timeout ref
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 스크롤 위치 저장용 ref
  const scrollPositionRef = useRef<number>(0);
  // 테이블 섹션 참조 (스크롤 위치 복원용)
  const tableSectionRef = useRef<HTMLDivElement>(null);
  // 페이징 섹션 참조 (스크롤 위치 복원용)
  const paginationRef = useRef<HTMLDivElement>(null);

  /**
   * 메시지가 설정되면 3초 후 자동으로 제거
   */
  useEffect(() => {
    // 이전 timeout이 있으면 정리
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    // 메시지가 있으면 3초 후 제거
    if (message) {
      messageTimeoutRef.current = setTimeout(() => {
        setMessage(null);
        messageTimeoutRef.current = null;
      }, 3000);
    }

    // 컴포넌트 언마운트 시 timeout 정리
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [message]);

  /**
   * 사용자 목록을 불러오는 함수
   * 
   * 페이지가 마운트될 때와 페이지/검색어가 변경될 때 호출됩니다.
   */
  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await getUsers(currentPage, pageSize, keyword || undefined);
      setUserPage(page);
    } catch (err: any) {
      console.error('사용자 목록 로드 실패:', err);
      setError('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 컴포넌트가 마운트될 때와 currentPage, keyword가 변경될 때 사용자 목록을 불러옵니다.
   */
  useEffect(() => {
    loadUsers();
  }, [currentPage, keyword]);

  /**
   * 새 사용자 생성 핸들러
   * 
   * POST /api/admin/users API를 호출하여 새 사용자를 생성합니다.
   * 
   * @param userData 생성할 사용자 정보
   */
  const handleCreateUser = async (userData: UserCreateRequest) => {
    try {
      await createUser(userData);
      // 사용자 생성 성공 시 목록을 다시 불러옴
      await loadUsers();
      alert('사용자가 성공적으로 생성되었습니다.');
    } catch (err: any) {
      console.error('사용자 생성 실패:', err);
      let errorMessage = '사용자 생성에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
      alert(errorMessage);
    }
  };


  /**
   * 검색어 변경 핸들러
   * 
   * @param e 입력 이벤트
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setCurrentPage(0); // 검색어가 변경되면 첫 페이지로 이동
  };

  /**
   * 페이지 변경 핸들러
   * 
   * 페이지 변경 시 현재 스크롤 위치를 저장하고,
   * 목록이 다시 로드된 후 저장된 스크롤 위치로 복원합니다.
   * 
   * 페이징 버튼이 sticky로 고정되어 있지만, 사용자가 보고 있던 테이블 위치를 유지하기 위해
   * 스크롤 위치를 복원합니다.
   * 
   * @param newPage 이동할 페이지 번호 (0부터 시작)
   */
  const handlePageChange = (newPage: number) => {
    // 현재 스크롤 위치 저장
    // 테이블 섹션의 상단 위치를 기준으로 저장하여 사용자가 보고 있던 테이블 위치를 유지
    if (tableSectionRef.current) {
      const tableTop = tableSectionRef.current.getBoundingClientRect().top + window.scrollY;
      // 현재 스크롤 위치와 테이블 상단의 차이를 계산하여 상대적 위치 저장
      const relativePosition = window.scrollY - tableTop;
      scrollPositionRef.current = relativePosition;
    } else {
      // 테이블 섹션이 없으면 현재 윈도우 스크롤 위치 저장
      scrollPositionRef.current = window.scrollY;
    }
    setCurrentPage(newPage);
  };

  /**
   * 사용자 목록이 로드된 후 스크롤 위치 복원
   * 
   * userPage가 변경되면 (목록이 다시 로드되면) 저장된 스크롤 위치로 복원합니다.
   * 
   * requestAnimationFrame을 사용하여 DOM 업데이트가 완료된 후 스크롤 위치를 복원합니다.
   */
  useLayoutEffect(() => {
    if (userPage && tableSectionRef.current && scrollPositionRef.current !== undefined) {
      // DOM 업데이트가 완료된 후 스크롤 위치 복원
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (tableSectionRef.current) {
            // 테이블 섹션의 새로운 상단 위치를 기준으로 상대적 위치 복원
            const tableTop = tableSectionRef.current.getBoundingClientRect().top + window.scrollY;
            const targetScroll = tableTop + scrollPositionRef.current;
            
            // 저장된 상대적 위치로 복원
            window.scrollTo({
              top: targetScroll,
              behavior: 'auto', // 부드러운 스크롤 없이 즉시 이동
            });
          }
        });
      });
    }
  }, [userPage]);

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <header style={styles.header}>
        <h1 style={styles.title}>사용자 관리</h1>
        <div style={styles.userInfo}>
          <span>안녕하세요, {user?.username}님</span>
          <button onClick={logout} style={styles.logoutButton}>
            로그아웃
          </button>
        </div>
      </header>

      {/* 성공/실패 메시지 표시 (헤더 바로 아래, 스크롤해도 상단에 고정) */}
      {message && (
        <div
          style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.messageSuccess : styles.messageError),
          }}
        >
          <span
            style={{
              ...styles.messageIcon,
              ...(message.type === 'success' ? styles.messageSuccessIcon : styles.messageErrorIcon),
            }}
          >
            {message.type === 'success' ? '✓' : '✕'}
          </span>
          {message.text}
        </div>
      )}

      {/* 검색 영역 */}
      <div style={styles.searchSection}>
        <input
          type="text"
          value={keyword}
          onChange={handleSearchChange}
          placeholder="사용자명 또는 이름으로 검색..."
          style={styles.searchInput}
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* 사용자 생성 폼 */}
      <div style={styles.createFormSection}>
        <h2 style={styles.sectionTitle}>새 사용자 생성</h2>
        <AdminUserCreateForm onSubmit={handleCreateUser} />
      </div>

      {/* 사용자 목록 테이블 */}
      <div ref={tableSectionRef} style={styles.tableSection}>
        <h2 style={styles.sectionTitle}>사용자 목록</h2>
        {isLoading ? (
          <div style={styles.loading}>로딩 중...</div>
        ) : userPage ? (
          <>
            <AdminUserTable
              users={userPage.content}
              onChanged={loadUsers}
              message={message}
              onMessageChange={setMessage}
            />
            
            {/* 페이지네이션 (sticky로 고정하여 스크롤 위치에 상관없이 항상 보이도록) */}
            <div ref={paginationRef} style={styles.pagination}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === 0 ? styles.pageButtonDisabled : {}),
                }}
              >
                이전
              </button>
              
              <span style={styles.pageInfo}>
                {currentPage + 1} / {userPage.totalPages} 페이지
                (전체 {userPage.totalElements}명)
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= userPage.totalPages - 1}
                style={{
                  ...styles.pageButton,
                  ...(currentPage >= userPage.totalPages - 1 ? styles.pageButtonDisabled : {}),
                }}
              >
                다음
              </button>
            </div>
          </>
        ) : (
          <div>데이터가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

// 간단한 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #eee',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  searchSection: {
    marginBottom: '2rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  message: {
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    position: 'sticky', // 스크롤해도 상단에 고정
    top: '1rem', // 헤더 아래 1rem 위치
    zIndex: 100, // 다른 요소 위에 표시
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // 더 진한 그림자로 눈에 띄게
    transition: 'all 0.3s ease-out', // 부드러운 전환 효과
  },
  messageIcon: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    display: 'inline-block',
    width: '1.5rem',
    height: '1.5rem',
    lineHeight: '1.5rem',
    textAlign: 'center',
    borderRadius: '50%',
    flexShrink: 0,
  },
  messageSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '2px solid #28a745', // 더 진한 초록색 테두리
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)', // 초록색 그림자
  },
  messageError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '2px solid #dc3545', // 더 진한 빨간색 테두리
    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.2)', // 빨간색 그림자
  },
  createFormSection: {
    marginBottom: '3rem',
    padding: '1.5rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  tableSection: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    marginBottom: '1rem',
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
    marginBottom: '2rem',
    padding: '1rem',
    // 스크롤 위치에 상관없이 항상 보이도록 sticky 위치 설정
    // 화면 하단에서 1rem 위에 고정되어 스크롤해도 항상 보임
    position: 'sticky',
    bottom: '1rem',
    backgroundColor: 'white',
    zIndex: 10,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e0e0e0',
  },
  pageButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  pageButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  pageInfo: {
    color: '#666',
  },
};

export default AdminUserListPage;


