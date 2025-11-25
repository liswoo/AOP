/**
 * 사용자 목록 테이블 컴포넌트
 * 
 * 이 컴포넌트는 사용자 목록을 테이블 형태로 표시하고,
 * 각 행에 수정/삭제/상태 변경 버튼을 제공합니다.
 * 
 * 개선 사항:
 * - 수정 중인 행 시각적 표시 (배경색 강조)
 * - 수정 중일 때 다른 행 조작 방지
 * - 필드 유효성 검증 표시 (행 내부 에러 메시지)
 * - 서버 오류 메시지 UI 개선 (alert 대신 상단/행 내부 표시)
 * - 정책 기반 버튼 숨김/비활성화
 * - 성공 메시지 시각화 (그린 알림 배너)
 * - 컴포넌트 구조 개선 (UserRow 분리)
 * 
 * Props:
 * - users: 표시할 사용자 목록 (UserSummary[])
 * - onChanged: 수정/삭제/상태변경 후 목록을 다시 로딩하기 위한 콜백 () => void
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserSummary, UserUpdateRequest, UserRole } from '../types';
import { updateUser, updateUserStatus, deleteUser } from '../api/adminUserApi';
import UserRow from './UserRow';

/**
 * AdminUserTable 컴포넌트 Props 타입
 */
interface AdminUserTableProps {
  users: UserSummary[];
  onChanged: () => void; // 수정/삭제 후 목록을 다시 로딩하기 위한 콜백
}

/**
 * 필드 유효성 검증 결과 타입
 */
interface FieldErrors {
  name?: string;
  email?: string;
}

/**
 * AdminUserTable 컴포넌트
 * 
 * 사용자 목록을 테이블로 표시하고, 각 행에 액션 버튼을 제공합니다.
 * 
 * @param users 표시할 사용자 목록
 * @param onChanged 수정/삭제/상태변경 후 목록을 다시 로딩하기 위한 콜백
 */
const AdminUserTable: React.FC<AdminUserTableProps> = ({
  users,
  onChanged,
  message: propMessage,
  onMessageChange,
}) => {
  // 편집 중인 사용자 ID (null이면 편집 모드 아님)
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  // 편집 중인 사용자 데이터
  const [editingData, setEditingData] = useState<UserUpdateRequest>({});
  // 필드 유효성 검증 에러 (행별로 관리)
  const [fieldErrors, setFieldErrors] = useState<Record<number, FieldErrors>>({});
  // 행별 서버 에러 메시지 (행 내부 표시용)
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  // 로딩 상태 관리 (각 버튼별로)
  const [loadingStates, setLoadingStates] = useState<{
    update?: number;
    status?: number;
    delete?: number;
  }>({});
  
  // 메시지 상태: 부모에서 전달받은 경우 부모 상태 사용, 없으면 로컬 상태 사용
  const [localMessage, setLocalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const message = propMessage !== undefined ? propMessage : localMessage;
  const setMessage = onMessageChange || setLocalMessage;
  
  // 메시지 자동 제거를 위한 timeout ref
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 시스템에 ADMIN이 몇 명인지 계산 (정책 기반 버튼 비활성화용)
  const adminCount = useMemo(() => {
    return users.filter(u => u.role === 'ADMIN' && u.enabled).length;
  }, [users]);

  /**
   * 메시지가 설정되면 3초 후 자동으로 제거
   * 
   * useEffect를 사용하여 메시지가 변경될 때마다 자동으로 제거되도록 합니다.
   * 이렇게 하면 setTimeout의 클로저 문제를 해결할 수 있습니다.
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
   * 필드 유효성 검증 함수
   * 
   * 수정 중인 행의 필수 필드와 형식을 검증합니다.
   * 
   * @param data 검증할 데이터
   * @returns 검증 에러 객체
   */
  const validateFields = (data: UserUpdateRequest): FieldErrors => {
    const errors: FieldErrors = {};
    
    // data가 비어있으면 에러 반환
    if (!data || Object.keys(data).length === 0) {
      errors.name = '수정할 데이터가 없습니다.';
      return errors;
    }
    
    // 이름 필수 검증
    if (!data.name || data.name.trim() === '') {
      errors.name = '이름은 필수입니다.';
    }
    
    // 이메일 필수 및 형식 검증
    if (!data.email || data.email.trim() === '') {
      errors.email = '이메일은 필수입니다.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.email = '올바른 이메일 형식이 아닙니다.';
      }
    }
    
    return errors;
  };

  /**
   * 수정 버튼 클릭 핸들러
   * 
   * PUT /api/admin/users/{id} API를 호출하여 사용자 정보를 수정합니다.
   * 
   * @param user 수정할 사용자 정보
   */
  const handleEditClick = (user: UserSummary) => {
    // 이미 다른 행이 수정 중이면 막기
    if (editingUserId !== null && editingUserId !== user.id) {
      alert('먼저 현재 수정 중인 행을 저장 또는 취소하세요.');
      return;
    }
    
    setEditingUserId(user.id);
    setEditingData({
      email: user.email,
      name: user.name,
      role: user.role,
      enabled: user.enabled,
    });
    // 행별 에러 초기화
    setFieldErrors({ ...fieldErrors, [user.id]: {} });
    setRowErrors({ ...rowErrors, [user.id]: '' });
  };

  /**
   * 수정 취소 핸들러
   */
  const handleCancelEdit = () => {
    if (editingUserId !== null) {
      setFieldErrors({ ...fieldErrors, [editingUserId]: {} });
      setRowErrors({ ...rowErrors, [editingUserId]: '' });
    }
    setEditingUserId(null);
    setEditingData({});
  };

  /**
   * 수정 저장 핸들러
   * 
   * 이 버튼은 PUT /api/admin/users/{id} API를 호출하여 사용자 정보를 수정합니다.
   * 성공 시 onChanged() 콜백을 호출하여 목록을 다시 로딩합니다.
   */
  const handleSaveEdit = async (id: number) => {
    console.log('🔵 handleSaveEdit 호출됨', { id, editingData });
    
    // editingData가 비어있는지 확인
    if (!editingData || Object.keys(editingData).length === 0) {
      console.error('❌ editingData가 비어있습니다.');
      setRowErrors({ ...rowErrors, [id]: '수정할 데이터가 없습니다.' });
      return;
    }
    
    // 필드 유효성 검증
    const errors = validateFields(editingData);
    console.log('🔍 유효성 검증 결과:', errors);
    
    if (Object.keys(errors).length > 0) {
      console.warn('⚠️ 유효성 검증 실패:', errors);
      setFieldErrors({ ...fieldErrors, [id]: errors });
      return;
    }
    
    setLoadingStates({ ...loadingStates, update: id });
    setMessage(null);
    setRowErrors({ ...rowErrors, [id]: '' });
    
    try {
      console.log('📤 API 호출 시작:', { id, payload: editingData });
      // PUT /api/admin/users/{id} API 호출
      const result = await updateUser(id, editingData);
      console.log('✅ API 호출 성공:', result);
      
      setEditingUserId(null);
      setEditingData({});
      setFieldErrors({ ...fieldErrors, [id]: {} });
      setRowErrors({ ...rowErrors, [id]: '' });
      
      // 성공 메시지 표시 (onChanged 호출 전에 설정)
      console.log('💬 성공 메시지 설정');
      const successMessage = { type: 'success' as const, text: '사용자 정보가 성공적으로 수정되었습니다.' };
      setMessage(successMessage);
      console.log('💬 setMessage 호출 완료, 메시지:', successMessage);
      
      // React 상태 업데이트가 완료될 때까지 기다린 후 목록 새로고침
      // requestAnimationFrame을 두 번 사용하여 다음 렌더링 사이클까지 대기
      console.log('⏳ React 상태 업데이트 대기 중...');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log('🔄 onChanged 호출 (지연)');
          // 메시지가 여전히 설정되어 있는지 확인
          setTimeout(() => {
            onChanged(); // 목록 다시 로드
          }, 50); // 추가 지연으로 메시지 렌더링 보장
        });
      });
    } catch (err: any) {
      console.error('❌ 사용자 수정 실패:', err);
      console.error('에러 상세:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = '사용자 수정에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      // 행 내부에 에러 메시지 표시
      setRowErrors({ ...rowErrors, [id]: errorMessage });
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoadingStates({ ...loadingStates, update: undefined });
      console.log('🏁 handleSaveEdit 완료');
    }
  };

  /**
   * 상태 변경 버튼 클릭 핸들러
   * 
   * 이 버튼은 PATCH /api/admin/users/{id}/status API를 호출하여 사용자의 활성화 상태를 변경합니다.
   * 성공 시 onChanged() 콜백을 호출하여 목록을 다시 로딩합니다.
   * 
   * @param id 사용자 ID
   * @param currentEnabled 현재 활성화 상태
   */
  const handleStatusToggle = async (id: number, currentEnabled: boolean) => {
    // 수정 중인 행이 있으면 막기
    if (editingUserId !== null) {
      alert('먼저 현재 수정 중인 행을 저장 또는 취소하세요.');
      return;
    }
    
    setLoadingStates({ ...loadingStates, status: id });
    setMessage(null);
    setRowErrors({ ...rowErrors, [id]: '' });
    
    try {
      // PATCH /api/admin/users/{id}/status API 호출
      await updateUserStatus(id, !currentEnabled);
      // 성공 메시지 표시 (onChanged 호출 전에 설정)
      setMessage({ type: 'success', text: `사용자가 ${!currentEnabled ? '활성화' : '비활성화'}되었습니다.` });
      // React 상태 업데이트가 완료될 때까지 기다린 후 목록 새로고침
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onChanged(); // 목록 다시 로드
        });
      });
    } catch (err: any) {
      console.error('상태 변경 실패:', err);
      let errorMessage = '상태 변경에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      // 행 내부에 에러 메시지 표시
      setRowErrors({ ...rowErrors, [id]: errorMessage });
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoadingStates({ ...loadingStates, status: undefined });
    }
  };

  /**
   * 삭제 버튼 클릭 핸들러
   * 
   * 이 버튼은 DELETE /api/admin/users/{id} API를 호출하여 사용자를 물리적으로 삭제합니다.
   * window.confirm으로 한 번 확인한 후, 확인 시 API를 호출하고 성공 시 onChanged() 콜백을 호출합니다.
   * 실패 시(400 등) 서버에서 온 에러 메시지를 행 내부에 표시합니다.
   * 
   * @param id 삭제할 사용자 ID
   */
  const handleDeleteClick = async (id: number) => {
    // 수정 중인 행이 있으면 막기
    if (editingUserId !== null) {
      alert('먼저 현재 수정 중인 행을 저장 또는 취소하세요.');
      return;
    }
    
    // 확인 대화상자 표시
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setLoadingStates({ ...loadingStates, delete: id });
      setMessage(null);
      setRowErrors({ ...rowErrors, [id]: '' });
      
      try {
        // DELETE /api/admin/users/{id} API 호출
        await deleteUser(id);
        // 성공 메시지 표시 (onChanged 호출 전에 설정)
        setMessage({ type: 'success', text: '사용자가 성공적으로 삭제되었습니다.' });
        // React 상태 업데이트가 완료될 때까지 기다린 후 목록 새로고침
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            onChanged(); // 목록 다시 로드
          });
        });
      } catch (err: any) {
        console.error('사용자 삭제 실패:', err);
        let errorMessage = '사용자 삭제에 실패했습니다.';
        // 서버에서 400 에러가 오면 서버 메시지를 그대로 표시
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        // 행 내부에 에러 메시지 표시
        setRowErrors({ ...rowErrors, [id]: errorMessage });
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoadingStates({ ...loadingStates, delete: undefined });
      }
    }
  };

  /**
   * 편집 데이터 변경 핸들러
   * 
   * 수정 중인 행의 필드 값이 변경될 때 호출됩니다.
   * 실시간으로 유효성 검증을 수행합니다.
   */
  const handleEditingDataChange = (id: number, newData: UserUpdateRequest) => {
    setEditingData(newData);
    // 실시간 유효성 검증
    const errors = validateFields(newData);
    setFieldErrors({ ...fieldErrors, [id]: errors });
  };

  if (users.length === 0) {
    return <div style={styles.empty}>사용자가 없습니다.</div>;
  }

  return (
    <div style={styles.tableContainer}>
      {/* 메시지는 부모 컴포넌트(AdminUserListPage)에서 표시하므로 여기서는 표시하지 않음 */}
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
            <UserRow
              key={user.id}
              user={user}
              isEditing={editingUserId === user.id}
              editingData={editingUserId === user.id ? editingData : undefined}
              fieldErrors={fieldErrors[user.id]}
              rowError={rowErrors[user.id]}
              isLoading={loadingStates.update === user.id || loadingStates.status === user.id || loadingStates.delete === user.id}
              isOtherRowEditing={editingUserId !== null && editingUserId !== user.id}
              adminCount={adminCount}
              onEditClick={() => handleEditClick(user)}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={() => handleSaveEdit(user.id)}
              onStatusToggle={() => handleStatusToggle(user.id, user.enabled)}
              onDeleteClick={() => handleDeleteClick(user.id)}
              onEditingDataChange={(newData) => handleEditingDataChange(user.id, newData)}
            />
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
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  message: {
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'block', // 명시적으로 block으로 설정
    position: 'sticky', // 스크롤 시에도 상단에 고정
    top: 0,
    zIndex: 10, // 다른 요소 위에 표시
  },
  messageSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // 그림자 추가로 더 눈에 띄게
  },
  messageError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // 그림자 추가로 더 눈에 띄게
  },
};

export default AdminUserTable;
