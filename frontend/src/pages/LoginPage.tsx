/**
 * 로그인 페이지
 * 
 * 사용 방법:
 * 1. /login에서 admin / admin1234 로 로그인
 * 2. 로그인 성공 시 /admin/users로 자동 이동
 * 
 * 이 페이지는 사용자명과 비밀번호를 입력받아 로그인을 처리합니다.
 * AuthContext의 login 함수를 사용하여 백엔드 API를 호출합니다.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * LoginPage 컴포넌트
 * 
 * 로그인 폼을 제공하고, 로그인 성공 시 /admin/users로 이동합니다.
 */
const LoginPage: React.FC = () => {
  console.log('LoginPage 렌더링');
  
  // React Router의 useNavigate 훅: 프로그래밍 방식으로 페이지 이동
  const navigate = useNavigate();
  
  // AuthContext에서 login 함수 가져오기
  const { login } = useAuth();
  
  // 폼 상태 관리
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 로그인 폼 제출 핸들러
   * 
   * @param e 폼 제출 이벤트
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 기본 폼 제출 동작 방지 (페이지 새로고침 방지)
    
    // 에러 메시지 초기화
    setError(null);
    setIsLoading(true);

    try {
      // AuthContext의 login 함수 호출
      await login(username, password);
      
      // 로그인 성공 시 /admin/users로 이동
      navigate('/admin/users');
    } catch (err: any) {
      // 로그인 실패 시 에러 메시지 표시
      console.error('로그인 실패:', err);
      
      // 에러 메시지 추출
      let errorMessage = '로그인에 실패했습니다.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>관리자 로그인</h1>
        
        {/* 에러 메시지 표시 */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}
        
        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>사용자명</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
              placeholder="admin"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="admin1234"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {}),
            }}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 간단한 인라인 스타일 (CSS 파일을 사용하지 않고 컴포넌트 내부에 정의)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '1rem',
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
  button: {
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
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
};

export default LoginPage;

