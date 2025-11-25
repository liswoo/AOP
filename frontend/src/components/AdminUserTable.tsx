/**
 * 사용자 목록 테이블 컴포넌트
 * 
 * 이 컴포넌트는 사용자 목록을 테이블 형태로 표시하고,
 * 각 행에 수정/삭제/상태 변경 버튼을 제공합니다.
 * 
 * Props:
 * - users: 표시할 사용자 목록 (UserSummary[])
 * - onUpdate: 사용자 수정 시 호출되는 콜백 (id, payload) => void
 * - onStatusChange: 사용자 상태 변경 시 호출되는 콜백 (id, enabled) => void
 * - onDelete: 사용자 삭제 시 호출되는 콜백 (id) => void
 * - onReload: 목록 다시 로드 콜백 () => void
 * 
 * 사용 예시:
 * <AdminUserTable 
 *   users={userPage.content}
 *   onUpdate={handleUpdate}
 *   onStatusChange={handleStatusChange}
 *   onDelete={handleDelete}
 *   onReload={loadUsers}
 * />
 */

import React, { useState } from 'react';
import { UserSummary, UserUpdateRequest, UserRole } from '../types';

/**
 * AdminUserTable 컴포넌트 Props 타입
 */
interface AdminUserTableProps {
  users: UserSummary[];
  onUpdate: (id: number, payload: UserUpdateRequest) => Promise<void>;
  onStatusChange: (id: number, enabled: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onReload: () => void;
}

/**
 * AdminUserTable 컴포넌트
 * 
 * 사용자 목록을 테이블로 표시하고, 각 행에 액션 버튼을 제공합니다.
 * 
 * @param users 표시할 사용자 목록
 * @param onUpdate 사용자 수정 콜백
 * @param onStatusChange 사용자 상태 변경 콜백
 * @param onDelete 사용자 삭제 콜백
 * @param onReload 목록 다시 로드 콜백
 */
const AdminUserTable: React.FC<AdminUserTableProps> = ({
  users,
  onUpdate,
  onStatusChange,
  onDelete,
  onReload,
}) => {
  // 편집 중인 사용자 ID (null이면 편집 모드 아님)
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  // 편집 중인 사용자 데이터
  const [editingData, setEditingData] = useState<UserUpdateRequest>({});

  /**
   * 수정 버튼 클릭 핸들러
   * 
   * PUT /api/admin/users/{id} API를 호출하여 사용자 정보를 수정합니다.
   * 
   * @param user 수정할 사용자 정보
   */
  const handleEditClick = (user: UserSummary) => {
    setEditingUserId(user.id);
    setEditingData({
      email: user.email,
      name: user.name,
      role: user.role,
      enabled: user.enabled,
    });
  };

  /**
   * 수정 취소 핸들러
   */
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingData({});
  };

  /**
   * 수정 저장 핸들러
   * 
   * PUT /api/admin/users/{id} API를 호출하여 사용자 정보를 수정합니다.
   */
  const handleSaveEdit = async (id: number) => {
    try {
      await onUpdate(id, editingData);
      setEditingUserId(null);
      setEditingData({});
      onReload(); // 목록 다시 로드
      alert('사용자 정보가 성공적으로 수정되었습니다.');
    } catch (err: any) {
      console.error('사용자 수정 실패:', err);
      let errorMessage = '사용자 수정에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      alert(errorMessage);
    }
  };

  /**
   * 상태 변경 버튼 클릭 핸들러
   * 
   * PATCH /api/admin/users/{id}/status API를 호출하여 사용자의 활성화 상태를 변경합니다.
   * 
   * @param id 사용자 ID
   * @param currentEnabled 현재 활성화 상태
   */
  const handleStatusToggle = async (id: number, currentEnabled: boolean) => {
    try {
      await onStatusChange(id, !currentEnabled);
      onReload(); // 목록 다시 로드
      alert(`사용자가 ${!currentEnabled ? '활성화' : '비활성화'}되었습니다.`);
    } catch (err: any) {
      console.error('상태 변경 실패:', err);
      let errorMessage = '상태 변경에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      alert(errorMessage);
    }
  };

  /**
   * 삭제 버튼 클릭 핸들러
   * 
   * DELETE /api/admin/users/{id} API를 호출하여 사용자를 물리적으로 삭제합니다.
   * 
   * @param id 삭제할 사용자 ID
   */
  const handleDeleteClick = async (id: number) => {
    // 확인 대화상자 표시
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await onDelete(id);
        onReload(); // 목록 다시 로드
        alert('사용자가 성공적으로 삭제되었습니다.');
      } catch (err: any) {
        console.error('사용자 삭제 실패:', err);
        let errorMessage = '사용자 삭제에 실패했습니다.';
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        alert(errorMessage);
      }
    }
  };

  if (users.length === 0) {
    return <div style={styles.empty}>사용자가 없습니다.</div>;
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>사용자명</th>
            <th style={styles.th}>이름</th>
            <th style={styles.th}>이메일</th>
            <th style={styles.th}>역할</th>
            <th style={styles.th}>상태</th>
            <th style={styles.th}>생성일</th>
            <th style={styles.th}>작업</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={styles.td}>{user.id}</td>
              <td style={styles.td}>{user.username}</td>
              <td style={styles.td}>
                {editingUserId === user.id ? (
                  <input
                    type="text"
                    value={editingData.name || ''}
                    onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                    style={styles.input}
                  />
                ) : (
                  user.name
                )}
              </td>
              <td style={styles.td}>
                {editingUserId === user.id ? (
                  <input
                    type="email"
                    value={editingData.email || ''}
                    onChange={(e) => setEditingData({ ...editingData, email: e.target.value })}
                    style={styles.input}
                  />
                ) : (
                  user.email
                )}
              </td>
              <td style={styles.td}>
                {editingUserId === user.id ? (
                  <select
                    value={editingData.role || 'USER'}
                    onChange={(e) => setEditingData({ ...editingData, role: e.target.value as UserRole })}
                    style={styles.select}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                ) : (
                  <span
                    style={{
                      ...styles.badge,
                      ...(user.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser),
                    }}
                  >
                    {user.role}
                  </span>
                )}
              </td>
              <td style={styles.td}>
                {editingUserId === user.id ? (
                  <select
                    value={editingData.enabled ? 'true' : 'false'}
                    onChange={(e) => setEditingData({ ...editingData, enabled: e.target.value === 'true' })}
                    style={styles.select}
                  >
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                ) : (
                  <span
                    style={{
                      ...styles.badge,
                      ...(user.enabled ? styles.badgeEnabled : styles.badgeDisabled),
                    }}
                  >
                    {user.enabled ? '활성' : '비활성'}
                  </span>
                )}
              </td>
              <td style={styles.td}>
                {new Date(user.createdAt).toLocaleDateString('ko-KR')}
              </td>
              <td style={styles.td}>
                {editingUserId === user.id ? (
                  <div style={styles.buttonGroup}>
                    <button
                      onClick={() => handleSaveEdit(user.id)}
                      style={styles.saveButton}
                    >
                      저장
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={styles.cancelButton}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div style={styles.buttonGroup}>
                    <button
                      onClick={() => handleEditClick(user)}
                      style={styles.editButton}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleStatusToggle(user.id, user.enabled)}
                      style={styles.statusButton}
                    >
                      {user.enabled ? '비활성화' : '활성화'}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user.id)}
                      style={styles.deleteButton}
                      disabled={user.id === 1} // ADMIN 계정은 삭제 불가
                    >
                      삭제
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 간단한 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  th: {
    padding: '0.75rem',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: '600',
    color: '#495057',
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #dee2e6',
    color: '#333',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  badgeAdmin: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  badgeUser: {
    backgroundColor: '#6c757d',
    color: 'white',
  },
  badgeEnabled: {
    backgroundColor: '#28a745',
    color: 'white',
  },
  badgeDisabled: {
    backgroundColor: '#6c757d',
    color: 'white',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  input: {
    padding: '0.25rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.875rem',
    width: '100%',
  },
  select: {
    padding: '0.25rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.875rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  statusButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  deleteButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  saveButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  cancelButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
};

export default AdminUserTable;
