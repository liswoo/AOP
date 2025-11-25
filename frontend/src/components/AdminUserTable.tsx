/**
 * 사용자 목록 테이블 컴포넌트
 * 
 * 이 컴포넌트는 사용자 목록을 테이블 형태로 표시합니다.
 * 
 * Props:
 * - users: 표시할 사용자 목록 (UserSummary[])
 * 
 * 사용 예시:
 * <AdminUserTable users={userPage.content} />
 */

import React from 'react';
import { UserSummary } from '../types';

/**
 * AdminUserTable 컴포넌트 Props 타입
 */
interface AdminUserTableProps {
  users: UserSummary[];
}

/**
 * AdminUserTable 컴포넌트
 * 
 * 사용자 목록을 테이블로 표시합니다.
 * 
 * @param users 표시할 사용자 목록
 */
const AdminUserTable: React.FC<AdminUserTableProps> = ({ users }) => {
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
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={styles.td}>{user.id}</td>
              <td style={styles.td}>{user.username}</td>
              <td style={styles.td}>{user.name}</td>
              <td style={styles.td}>{user.email}</td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.badge,
                    ...(user.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser),
                  }}
                >
                  {user.role}
                </span>
              </td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.badge,
                    ...(user.enabled ? styles.badgeEnabled : styles.badgeDisabled),
                  }}
                >
                  {user.enabled ? '활성' : '비활성'}
                </span>
              </td>
              <td style={styles.td}>
                {new Date(user.createdAt).toLocaleDateString('ko-KR')}
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
};

export default AdminUserTable;


