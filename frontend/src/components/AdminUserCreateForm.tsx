/**
 * 사용자 생성 폼 컴포넌트
 * 
 * 이 컴포넌트는 새 사용자를 생성하기 위한 입력 폼을 제공합니다.
 * 
 * Props:
 * - onSubmit: 폼 제출 시 호출되는 함수 (userData: UserCreateRequest) => void
 * 
 * 사용 예시:
 * <AdminUserCreateForm onSubmit={handleCreateUser} />
 */

import React, { useState } from 'react';
import { UserCreateRequest, UserRole } from '../types';

/**
 * AdminUserCreateForm 컴포넌트 Props 타입
 */
interface AdminUserCreateFormProps {
  onSubmit: (userData: UserCreateRequest) => void;
}

/**
 * AdminUserCreateForm 컴포넌트
 * 
 * 새 사용자를 생성하기 위한 폼을 제공합니다.
 * 
 * @param onSubmit 폼 제출 시 호출되는 함수
 */
const AdminUserCreateForm: React.FC<AdminUserCreateFormProps> = ({ onSubmit }) => {
  // 폼 상태 관리
  const [formData, setFormData] = useState<UserCreateRequest>({
    username: '',
    password: '',
    email: '',
    name: '',
    role: 'USER',
  });

  /**
   * 입력 필드 변경 핸들러
   * 
   * @param e 입력 이벤트
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * 폼 제출 핸들러
   * 
   * @param e 폼 제출 이벤트
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 데이터 검증 (간단한 검증)
    if (!formData.username || !formData.password || !formData.email || !formData.name) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    // onSubmit 함수 호출
    onSubmit(formData);

    // 폼 초기화
    setFormData({
      username: '',
      password: '',
      email: '',
      name: '',
      role: 'USER',
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>사용자명 *</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="user01"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>비밀번호 *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="password1234"
          />
        </div>
      </div>

      <div style={styles.formRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>이름 *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="홍길동"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>이메일 *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="user01@example.com"
          />
        </div>
      </div>

      <div style={styles.formRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>역할 *</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            style={styles.select}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          {/* 빈 공간 (레이아웃 맞추기) */}
        </div>
      </div>

      <button type="submit" style={styles.button}>
        사용자 생성
      </button>
    </form>
  );
};

// 간단한 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.5rem',
    color: '#555',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    backgroundColor: 'white',
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    alignSelf: 'flex-start',
  },
};

export default AdminUserCreateForm;


