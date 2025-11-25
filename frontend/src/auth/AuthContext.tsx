/**
 * 인증 컨텍스트 (Authentication Context)
 * 
 * 이 파일은 React Context API를 사용하여 전역 인증 상태를 관리합니다.
 * 
 * 주요 기능:
 * 1. 사용자 정보(user)와 액세스 토큰(accessToken)을 전역 상태로 관리
 * 2. 로그인 함수: 백엔드 API를 호출하여 토큰을 받아오고 상태에 저장
 * 3. 로그아웃 함수: 상태와 localStorage를 초기화
 * 4. 앱 시작 시 localStorage에 저장된 토큰이 있으면 자동으로 사용자 정보를 불러옴
 * 
 * 사용 방법:
 * - 컴포넌트에서 useAuth() 훅을 사용하여 인증 상태와 함수에 접근
 * - 예: const { user, login, logout } = useAuth();
 * 
 * Context API란?
 * - React에서 전역 상태를 관리하는 방법 중 하나
 * - Props drilling(여러 컴포넌트를 거쳐 props를 전달하는 것)을 피할 수 있음
 * - Provider로 감싼 모든 하위 컴포넌트에서 Context의 값을 사용할 수 있음
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginApi, getCurrentUser } from '../api/authApi';
import { UserInfo, UserRole } from '../types';

/**
 * 인증 컨텍스트의 값 타입
 * 
 * 이 타입은 AuthContext에서 제공하는 모든 값과 함수를 정의합니다.
 */
interface AuthContextType {
  user: { id: number; username: string; role: UserRole } | null; // 현재 로그인한 사용자 정보 (없으면 null)
  accessToken: string | null; // JWT 액세스 토큰 (없으면 null)
  login: (username: string, password: string) => Promise<void>; // 로그인 함수
  logout: () => void; // 로그아웃 함수
  isLoading: boolean; // 사용자 정보를 불러오는 중인지 여부 (초기 로딩 상태)
}

/**
 * AuthContext 생성
 * 
 * createContext로 Context를 생성합니다.
 * 초기값은 undefined로 설정하고, 타입 단언을 사용합니다.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider 컴포넌트
 * 
 * 이 컴포넌트는 인증 상태를 관리하고, 하위 컴포넌트에 인증 관련 값과 함수를 제공합니다.
 * 
 * 동작 흐름:
 * 1. 컴포넌트가 마운트되면 useEffect가 실행됩니다.
 * 2. localStorage에서 'accessToken'을 확인합니다.
 * 3. 토큰이 있으면 /api/auth/me를 호출하여 사용자 정보를 불러옵니다.
 * 4. 성공하면 user 상태를 업데이트하고, 실패하면 토큰을 제거합니다.
 * 
 * @param children 이 Provider로 감싸진 하위 컴포넌트들
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('AuthProvider 렌더링 시작');
  
  // 상태 관리
  const [user, setUser] = useState<{ id: number; username: string; role: UserRole } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // 초기 로딩 상태

  /**
   * 앱 시작 시 실행되는 useEffect
   * 
   * localStorage에 저장된 토큰이 있으면 사용자 정보를 자동으로 불러옵니다.
   * 이렇게 하면 페이지를 새로고침해도 로그인 상태가 유지됩니다.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthProvider 초기화 시작');
      try {
        // localStorage에서 토큰과 사용자 정보 읽기
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        console.log('localStorage 토큰 확인:', storedToken ? '있음' : '없음');

        if (storedToken) {
          try {
            // 토큰이 있으면 사용자 정보를 불러옴
            // apiClient의 요청 인터셉터가 자동으로 토큰을 헤더에 추가합니다.
            const userInfo = await getCurrentUser();
            
            // 사용자 정보를 상태에 저장
            setUser({
              id: userInfo.id,
              username: userInfo.username,
              role: userInfo.role,
            });
            setAccessToken(storedToken);
          } catch (error) {
            // 토큰이 유효하지 않거나 만료된 경우
            console.error('토큰 검증 실패:', error);
            // localStorage 초기화
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setAccessToken(null);
            setUser(null);
          }
        } else if (storedUser) {
          // 토큰은 없지만 사용자 정보만 있는 경우 (비정상 상태)
          // localStorage 초기화
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        // 예상치 못한 에러 발생 시
        console.error('인증 초기화 중 에러 발생:', error);
        // 상태 초기화
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } finally {
        // 로딩 완료 (에러가 발생해도 로딩은 완료)
        console.log('AuthProvider 초기화 완료, isLoading: false');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

  /**
   * 로그인 함수
   * 
   * @param username 사용자명
   * @param password 비밀번호
   * 
   * 동작 흐름:
   * 1. 백엔드 API에 로그인 요청
   * 2. 성공 시 accessToken과 user 정보를 받음
   * 3. 상태에 저장하고 localStorage에도 저장 (페이지 새로고침 시 유지)
   * 4. 실패 시 에러를 throw하여 호출한 컴포넌트에서 처리할 수 있도록 함
   */
  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await loginApi(username, password);
      
      // 상태에 저장
      setAccessToken(response.accessToken);
      setUser(response.user);
      
      // localStorage에 저장 (페이지 새로고침 시 유지)
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      // 에러는 호출한 컴포넌트에서 처리하도록 throw
      throw error;
    }
  };

  /**
   * 로그아웃 함수
   * 
   * 상태와 localStorage를 모두 초기화합니다.
   */
  const logout = (): void => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  // Context에 제공할 값
  const value: AuthContextType = {
    user,
    accessToken,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth 훅
 * 
 * 컴포넌트에서 AuthContext의 값을 쉽게 사용하기 위한 커스텀 훅입니다.
 * 
 * 사용 예시:
 * const { user, login, logout } = useAuth();
 * 
 * @returns AuthContextType 인증 상태와 함수들
 * @throws Error AuthProvider로 감싸지지 않은 컴포넌트에서 사용하면 에러 발생
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  
  return context;
};

