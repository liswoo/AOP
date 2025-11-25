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

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getUsers, createUser, updateUser, updateUserStatus, deleteUser } from '../api/adminUserApi';
import { Page, UserSummary, UserCreateRequest, UserUpdateRequest } from '../types';
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
   * 사용자 정보 수정 핸들러
   * 
   * PUT /api/admin/users/{id} API를 호출하여 사용자 정보를 수정합니다.
   * 
   * @param id 수정할 사용자 ID
   * @param payload 수정할 사용자 정보
   */
  const handleUpdateUser = async (id: number, payload: UserUpdateRequest) => {
    try {
      await updateUser(id, payload);
      // 수정 성공 시 목록을 다시 불러옴
      await loadUsers();
    } catch (err: any) {
      console.error('사용자 수정 실패:', err);
      let errorMessage = '사용자 수정에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
      throw err; // AdminUserTable에서 처리할 수 있도록 에러를 다시 throw
    }
  };

  /**
   * 사용자 상태 변경 핸들러
   * 
   * PATCH /api/admin/users/{id}/status API를 호출하여 사용자의 활성화 상태를 변경합니다.
   * 
   * @param id 상태를 변경할 사용자 ID
   * @param enabled 활성화 여부
   */
  const handleStatusChange = async (id: number, enabled: boolean) => {
    try {
      await updateUserStatus(id, enabled);
      // 상태 변경 성공 시 목록을 다시 불러옴
      await loadUsers();
    } catch (err: any) {
      console.error('상태 변경 실패:', err);
      let errorMessage = '상태 변경에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
      throw err; // AdminUserTable에서 처리할 수 있도록 에러를 다시 throw
    }
  };

  /**
   * 사용자 삭제 핸들러
   * 
   * DELETE /api/admin/users/{id} API를 호출하여 사용자를 물리적으로 삭제합니다.
   * 
   * @param id 삭제할 사용자 ID
   */
  const handleDeleteUser = async (id: number) => {
    try {
      await deleteUser(id);
      // 삭제 성공 시 목록을 다시 불러옴
      await loadUsers();
    } catch (err: any) {
      console.error('사용자 삭제 실패:', err);
      let errorMessage = '사용자 삭제에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
      throw err; // AdminUserTable에서 처리할 수 있도록 에러를 다시 throw
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
   * @param newPage 이동할 페이지 번호 (0부터 시작)
   */
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

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
      <div style={styles.tableSection}>
        <h2 style={styles.sectionTitle}>사용자 목록</h2>
        {isLoading ? (
          <div style={styles.loading}>로딩 중...</div>
        ) : userPage ? (
          <>
            <AdminUserTable
              users={userPage.content}
              onUpdate={handleUpdateUser}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteUser}
              onReload={loadUsers}
            />
            
            {/* 페이지네이션 */}
            <div style={styles.pagination}>
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


