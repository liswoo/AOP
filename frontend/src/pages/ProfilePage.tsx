/**
 * 내 정보 페이지
 * 
 * 로그인한 사용자가 자신의 프로필 정보를 조회하고 수정할 수 있는 페이지입니다.
 * 
 * 동작 흐름:
 * 1. 페이지가 마운트되면 getMyProfile() API를 호출하여 프로필 정보를 불러옵니다.
 * 2. 불러온 정보를 상태에 저장하고 폼에 표시합니다.
 * 3. 사용자가 정보를 수정하고 "정보 수정" 버튼을 클릭하면 updateMyProfile() API를 호출합니다.
 * 4. 사용자가 비밀번호를 변경하고 "비밀번호 변경" 버튼을 클릭하면 changeMyPassword() API를 호출합니다.
 * 
 * 레이아웃:
 * - 좌측 카드: 기본 정보 수정 폼 (사용자명, 이름, 이메일)
 * - 우측 카드: 비밀번호 변경 폼 (현재 비밀번호, 새 비밀번호, 새 비밀번호 확인)
 */

import React, { useState, useEffect } from 'react';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../api/profileApi';
import { Profile } from '../types';

/**
 * ProfilePage 컴포넌트
 * 
 * 내 정보 조회 및 수정 페이지를 렌더링합니다.
 * 
 * 동작 흐름:
 * 1. 컴포넌트가 마운트되면 useEffect가 실행됩니다.
 * 2. getMyProfile() API를 호출하여 프로필 정보를 가져옵니다.
 * 3. 성공 시 profile 상태에 저장하고, 실패 시 에러 메시지를 표시합니다.
 * 4. 사용자가 정보를 수정하면 updateMyProfile() API를 호출합니다.
 * 5. 사용자가 비밀번호를 변경하면 changeMyPassword() API를 호출합니다.
 */
const ProfilePage: React.FC = () => {
  // 프로필 정보 상태
  const [profile, setProfile] = useState<Profile | null>(null);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 에러 상태
  const [error, setError] = useState<string | null>(null);

  // 기본 정보 수정 폼 상태
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // 비밀번호 변경 폼 상태
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  /**
   * 컴포넌트가 마운트될 때 프로필 정보를 불러옵니다.
   * 
   * useEffect의 의존성 배열이 비어있으므로,
   * 컴포넌트가 처음 마운트될 때 한 번만 실행됩니다.
   */
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // GET /api/profile API를 호출하여 프로필 정보를 가져옵니다.
        // 이 API는 인증이 필요하므로, apiClient의 요청 인터셉터가
        // 자동으로 Authorization 헤더에 Bearer 토큰을 추가합니다.
        const data = await getMyProfile();
        
        // 성공 시 상태에 저장
        setProfile(data);
        // 폼 필드에도 초기값 설정
        setName(data.name);
        setEmail(data.email);
      } catch (err: any) {
        // 에러 발생 시 에러 메시지 저장
        console.error('프로필 정보 로드 실패:', err);
        let errorMessage = '프로필 정보를 불러오는데 실패했습니다.';
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        setError(errorMessage);
      } finally {
        // 로딩 완료
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

  /**
   * 기본 정보 수정 핸들러
   * 
   * PUT /api/profile API를 호출하여 현재 로그인한 사용자의 이름과 이메일을 수정합니다.
   * 
   * 동작 흐름:
   * 1. 폼 제출 이벤트 기본 동작 방지
   * 2. updateMyProfile() API 호출
   * 3. 성공 시 profile 상태 업데이트 및 성공 메시지 표시
   * 4. 실패 시 에러 메시지 표시
   */
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsUpdating(true);
    setUpdateMessage(null);
    setError(null);

    try {
      // PUT /api/profile API를 호출하여 프로필 정보를 수정합니다.
      const updatedProfile = await updateMyProfile({
        name,
        email,
      });
      
      // 성공 시 profile 상태 업데이트
      setProfile(updatedProfile);
      setUpdateMessage('정보가 수정되었습니다.');
      
      // 3초 후 메시지 자동 제거
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err: any) {
      console.error('프로필 수정 실패:', err);
      let errorMessage = '정보 수정에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 비밀번호 변경 핸들러
   * 
   * PATCH /api/profile/password API를 호출하여 현재 로그인한 사용자의 비밀번호를 변경합니다.
   * 
   * 동작 흐름:
   * 1. 폼 제출 이벤트 기본 동작 방지
   * 2. 새 비밀번호와 확인 비밀번호 일치 여부 확인
   * 3. 일치하지 않으면 에러 메시지 표시
   * 4. 일치하면 changeMyPassword() API 호출
   * 5. 성공 시 성공 메시지 표시 및 폼 초기화
   * 6. 실패 시 에러 메시지 표시 (현재 비밀번호 불일치 등)
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsChangingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);

    // 새 비밀번호와 확인 비밀번호 일치 여부 확인
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      setIsChangingPassword(false);
      return;
    }

    try {
      // PATCH /api/profile/password API를 호출하여 비밀번호를 변경합니다.
      await changeMyPassword({
        currentPassword,
        newPassword,
      });
      
      // 성공 시 성공 메시지 표시 및 폼 초기화
      setPasswordMessage('비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // 3초 후 메시지 자동 제거
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err: any) {
      console.error('비밀번호 변경 실패:', err);
      let errorMessage = '비밀번호 변경에 실패했습니다.';
      
      // 서버에서 400 에러(현재 비밀번호 불일치)가 오면 특별한 메시지 표시
      if (err.response?.status === 400) {
        if (err.response?.data?.error === 'INVALID_CURRENT_PASSWORD' || 
            err.response?.data?.message?.includes('비밀번호')) {
          errorMessage = '현재 비밀번호가 올바르지 않습니다.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 로딩 중일 때 표시할 내용
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>불러오는 중...</div>
      </div>
    );
  }

  // 에러가 발생했을 때 표시할 내용
  if (error && !profile) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  // 프로필 정보가 없을 때 표시할 내용
  if (!profile) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>프로필 정보를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
        <h1 style={styles.pageTitle}>내 정보</h1>

        {/* 에러 메시지 (전역) */}
        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* 두 개의 카드를 가로로 배치 */}
        <div style={styles.cardsRow}>
          {/* 좌측 카드: 기본 정보 수정 폼 */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>기본 정보 수정</h2>
            <p style={styles.cardDescription}>
              현재 로그인한 사용자의 이름/이메일을 수정하는 폼입니다.
            </p>

            {/* 성공 메시지 */}
            {updateMessage && (
              <div style={styles.successMessage}>
                {updateMessage}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>사용자명</label>
                <input
                  type="text"
                  value={profile.username}
                  disabled
                  style={styles.inputDisabled}
                />
                <p style={styles.helpText}>사용자명은 변경할 수 없습니다.</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>이름 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="홍길동"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>이메일 *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="user@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                style={{
                  ...styles.submitButton,
                  ...(isUpdating ? styles.buttonDisabled : {}),
                }}
              >
                {isUpdating ? '수정 중...' : '정보 수정'}
              </button>
            </form>
          </div>

          {/* 우측 카드: 비밀번호 변경 폼 */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>비밀번호 변경</h2>
            <p style={styles.cardDescription}>
              비밀번호 변경 폼입니다. 현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.
            </p>

            {/* 성공 메시지 */}
            {passwordMessage && (
              <div style={styles.successMessage}>
                {passwordMessage}
              </div>
            )}

            {/* 에러 메시지 */}
            {passwordError && (
              <div style={styles.errorMessage}>
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>현재 비밀번호 *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>새 비밀번호 *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    // 새 비밀번호가 변경되면 확인 비밀번호와의 일치 여부를 다시 확인
                    if (confirmPassword && e.target.value !== confirmPassword) {
                      setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
                    } else {
                      setPasswordError(null);
                    }
                  }}
                  required
                  minLength={8}
                  style={styles.input}
                  placeholder="새 비밀번호를 입력하세요 (최소 8자)"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>새 비밀번호 확인 *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    // 확인 비밀번호가 변경되면 새 비밀번호와의 일치 여부를 확인
                    if (newPassword && e.target.value !== newPassword) {
                      setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
                    } else {
                      setPasswordError(null);
                    }
                  }}
                  required
                  minLength={8}
                  style={styles.input}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
                {/* 새 비밀번호와 확인 비밀번호가 다르면 즉시 에러 메시지 표시 */}
                {confirmPassword && newPassword && confirmPassword !== newPassword && (
                  <p style={styles.errorText}>
                    새 비밀번호와 확인 비밀번호가 일치하지 않습니다.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || (confirmPassword && newPassword !== confirmPassword)}
                style={{
                  ...styles.submitButton,
                  ...(isChangingPassword || (confirmPassword && newPassword !== confirmPassword) 
                    ? styles.buttonDisabled : {}),
                }}
              >
                {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </div>
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
  pageTitle: {
    marginBottom: '2rem',
    color: '#333',
    fontSize: '2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '1rem',
    borderRadius: '4px',
    textAlign: 'center',
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  cardTitle: {
    marginBottom: '0.5rem',
    color: '#333',
    fontSize: '1.5rem',
  },
  cardDescription: {
    marginBottom: '1.5rem',
    color: '#666',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#555',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  inputDisabled: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    backgroundColor: '#f5f5f5',
    color: '#666',
    cursor: 'not-allowed',
  },
  helpText: {
    marginTop: '0.25rem',
    fontSize: '0.875rem',
    color: '#666',
  },
  submitButton: {
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  errorText: {
    marginTop: '0.25rem',
    fontSize: '0.875rem',
    color: '#dc3545',
  },
};

export default ProfilePage;

