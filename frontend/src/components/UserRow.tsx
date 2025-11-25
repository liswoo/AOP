/**
 * 사용자 테이블 행 컴포넌트
 * 
 * AdminUserTable의 각 행을 렌더링하는 컴포넌트입니다.
 * 
 * 개선 사항:
 * - 수정 중인 행 시각적 표시 (배경색 강조)
 * - 필드 유효성 검증 표시 (행 내부 에러 메시지)
 * - 정책 기반 버튼 비활성화 (ADMIN 보호)
 * 
 * Props:
 * - user: 사용자 정보
 * - isEditing: 현재 행이 수정 중인지 여부
 * - editingData: 수정 중인 데이터 (수정 중일 때만)
 * - fieldErrors: 필드별 유효성 검증 에러
 * - rowError: 행별 서버 에러 메시지
 * - isLoading: 로딩 중인지 여부
 * - isOtherRowEditing: 다른 행이 수정 중인지 여부
 * - adminCount: 시스템에 활성화된 ADMIN 수
 * - onEditClick: 수정 버튼 클릭 핸들러
 * - onCancelEdit: 취소 버튼 클릭 핸들러
 * - onSaveEdit: 저장 버튼 클릭 핸들러
 * - onStatusToggle: 상태 변경 버튼 클릭 핸들러
 * - onDeleteClick: 삭제 버튼 클릭 핸들러
 * - onEditingDataChange: 편집 데이터 변경 핸들러
 */

import React from 'react';
import { UserSummary, UserUpdateRequest, UserRole } from '../types';

/**
 * UserRow 컴포넌트 Props 타입
 */
interface UserRowProps {
  user: UserSummary;
  isEditing: boolean;
  editingData?: UserUpdateRequest;
  fieldErrors?: {
    name?: string;
    email?: string;
  };
  rowError?: string;
  isLoading: boolean;
  isOtherRowEditing: boolean;
  adminCount: number;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onStatusToggle: () => void;
  onDeleteClick: () => void;
  onEditingDataChange: (data: UserUpdateRequest) => void;
}

/**
 * UserRow 컴포넌트
 * 
 * 사용자 테이블의 한 행을 렌더링합니다.
 * 수정 모드와 일반 모드를 지원합니다.
 */
const UserRow: React.FC<UserRowProps> = ({
  user,
  isEditing,
  editingData,
  fieldErrors = {},
  rowError,
  isLoading,
  isOtherRowEditing,
  adminCount,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onStatusToggle,
  onDeleteClick,
  onEditingDataChange,
}) => {
  // 정책 기반 버튼 비활성화 여부 계산
  // 기본 관리자 계정 보호: id=1이거나 username="admin"
  const isProtectedAdmin = user.id === 1 || user.username === 'admin';
  // 마지막 ADMIN 보호: ADMIN 역할이고 활성화되어 있으며, 시스템에 ADMIN이 1명뿐
  const isLastAdmin = user.role === 'ADMIN' && user.enabled && adminCount <= 1;
  // 삭제 불가 조건
  const cannotDelete = isProtectedAdmin || isLastAdmin;
  // 비활성화 불가 조건
  const cannotDisable = isLastAdmin;
  // 역할 변경 불가 조건 (ADMIN -> USER)
  const cannotChangeRole = isLastAdmin && editingData?.role === 'USER';

  // 수정 중인 행 배경색 강조
  const rowStyle: React.CSSProperties = {
    ...styles.td,
    ...(isEditing ? styles.editingRow : {}),
  };

  return (
    <>
      <tr style={rowStyle}>
        <td style={styles.td}>{user.id}</td>
        <td style={styles.td}>{user.username}</td>
        
        {/* 이름 필드 */}
        <td style={styles.td}>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={editingData?.name || ''}
                onChange={(e) =>
                  onEditingDataChange({ ...editingData!, name: e.target.value })
                }
                style={{
                  ...styles.input,
                  ...(fieldErrors.name ? styles.inputError : {}),
                }}
              />
              {/* 필드 유효성 검증 에러 표시 */}
              {fieldErrors.name && (
                <div style={styles.fieldError}>{fieldErrors.name}</div>
              )}
            </div>
          ) : (
            user.name
          )}
        </td>
        
        {/* 이메일 필드 */}
        <td style={styles.td}>
          {isEditing ? (
            <div>
              <input
                type="email"
                value={editingData?.email || ''}
                onChange={(e) =>
                  onEditingDataChange({ ...editingData!, email: e.target.value })
                }
                style={{
                  ...styles.input,
                  ...(fieldErrors.email ? styles.inputError : {}),
                }}
              />
              {/* 필드 유효성 검증 에러 표시 */}
              {fieldErrors.email && (
                <div style={styles.fieldError}>{fieldErrors.email}</div>
              )}
            </div>
          ) : (
            user.email
          )}
        </td>
        
        {/* 역할 필드 */}
        <td style={styles.td}>
          {isEditing ? (
            <select
              value={editingData?.role || 'USER'}
              onChange={(e) =>
                onEditingDataChange({
                  ...editingData!,
                  role: e.target.value as UserRole,
                })
              }
              style={styles.select}
              disabled={cannotChangeRole}
              title={cannotChangeRole ? '마지막 관리자 계정의 역할을 변경할 수 없습니다.' : ''}
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
        
        {/* 상태 필드 */}
        <td style={styles.td}>
          {isEditing ? (
            <select
              value={editingData?.enabled ? 'true' : 'false'}
              onChange={(e) =>
                onEditingDataChange({
                  ...editingData!,
                  enabled: e.target.value === 'true',
                })
              }
              style={styles.select}
              disabled={cannotDisable && editingData?.enabled}
              title={
                cannotDisable && editingData?.enabled
                  ? '마지막 관리자 계정은 비활성화할 수 없습니다.'
                  : ''
              }
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
        
        {/* 작업 버튼 */}
        <td style={styles.td}>
          {isEditing ? (
            <div style={styles.buttonGroup}>
              <button
                onClick={() => {
                  console.log('🔘 저장 버튼 클릭됨', { user, editingData });
                  onSaveEdit();
                }}
                disabled={isLoading}
                style={{
                  ...styles.saveButton,
                  ...(isLoading ? styles.buttonDisabled : {}),
                }}
              >
                {isLoading ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={onCancelEdit}
                disabled={isLoading}
                style={{
                  ...styles.cancelButton,
                  ...(isLoading ? styles.buttonDisabled : {}),
                }}
              >
                취소
              </button>
            </div>
          ) : (
            <div style={styles.buttonGroup}>
              <button
                onClick={onEditClick}
                disabled={isOtherRowEditing}
                style={{
                  ...styles.editButton,
                  ...(isOtherRowEditing ? styles.buttonDisabled : {}),
                }}
                title={isOtherRowEditing ? '먼저 현재 수정 중인 행을 저장 또는 취소하세요.' : ''}
              >
                수정
              </button>
              <button
                onClick={onStatusToggle}
                disabled={isOtherRowEditing || isLoading || (cannotDisable && user.enabled)}
                style={{
                  ...styles.statusButton,
                  ...(isOtherRowEditing || isLoading || (cannotDisable && user.enabled)
                    ? styles.buttonDisabled
                    : {}),
                }}
                title={
                  isOtherRowEditing
                    ? '먼저 현재 수정 중인 행을 저장 또는 취소하세요.'
                    : cannotDisable && user.enabled
                    ? '마지막 관리자 계정은 비활성화할 수 없습니다.'
                    : ''
                }
              >
                {isLoading ? '처리 중...' : user.enabled ? '비활성화' : '활성화'}
              </button>
              <button
                onClick={onDeleteClick}
                disabled={isOtherRowEditing || isLoading || cannotDelete}
                style={{
                  ...styles.deleteButton,
                  ...(isOtherRowEditing || isLoading || cannotDelete
                    ? styles.buttonDisabled
                    : {}),
                }}
                title={
                  isOtherRowEditing
                    ? '먼저 현재 수정 중인 행을 저장 또는 취소하세요.'
                    : isProtectedAdmin
                    ? '기본 관리자 계정은 삭제할 수 없습니다.'
                    : isLastAdmin
                    ? '마지막 관리자 계정은 삭제할 수 없습니다.'
                    : ''
                }
              >
                {isLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          )}
        </td>
      </tr>
      
      {/* 행별 서버 에러 메시지 표시 */}
      {rowError && (
        <tr>
          <td colSpan={8} style={styles.errorRow}>
            <div style={styles.rowError}>{rowError}</div>
          </td>
        </tr>
      )}
    </>
  );
};

// 간단한 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #dee2e6',
    color: '#333',
  },
  // 수정 중인 행 강조 (배경색)
  editingRow: {
    backgroundColor: '#fffce8',
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
  input: {
    padding: '0.25rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.875rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  // 필드 유효성 검증 에러 스타일
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  // 필드 에러 메시지 스타일
  fieldError: {
    fontSize: '0.75rem',
    color: '#dc3545',
    marginTop: '0.25rem',
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
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  // 행별 서버 에러 메시지 스타일
  errorRow: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#fff5f5',
    borderBottom: '1px solid #f5c6cb',
  },
  rowError: {
    fontSize: '0.875rem',
    color: '#721c24',
  },
};

export default UserRow;

