/**
 * 인증 관련 API 함수
 * 
 * 로그인, 현재 사용자 정보 조회 등의 인증 관련 API를 호출하는 함수들을 정의합니다.
 */

import apiClient from './client';
import { LoginResponse, UserInfo } from '../types';

/**
 * 로그인 API 호출
 * 
 * @param username 사용자명
 * @param password 비밀번호
 * @returns 로그인 응답 (accessToken과 사용자 정보)
 * 
 * 사용 예시:
 * const response = await login('admin', 'admin1234');
 * console.log(response.accessToken); // JWT 토큰
 * console.log(response.user);        // 사용자 정보
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    username,
    password,
  });
  return response.data;
};

/**
 * 현재 로그인한 사용자 정보 조회
 * 
 * 이 함수는 Authorization 헤더에 Bearer 토큰이 포함되어야 합니다.
 * apiClient의 요청 인터셉터가 자동으로 토큰을 추가합니다.
 * 
 * @returns 현재 사용자 정보
 * 
 * 사용 예시:
 * const userInfo = await getCurrentUser();
 * console.log(userInfo.username); // 현재 로그인한 사용자명
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  const response = await apiClient.get<UserInfo>('/auth/me');
  return response.data;
};

